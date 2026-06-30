"""User service — PostgreSQL-backed user/channel management."""
import uuid
from typing import Any
from app.db.connection import get_pool


class UserService:
    """Gestion des utilisateurs, canaux, sessions, messages (PostgreSQL)."""

    # ── Users ──────────────────────────────────────────────────

    async def resolve_user(self, ip: str) -> dict[str, Any] | None:
        """Get or create a user from their Tailscale IP."""
        pool = await get_pool()
        user = await pool.fetchrow("SELECT * FROM dash_users WHERE id = $1", ip)
        if not user:
            name = f"Guest ({ip})"
            await pool.execute(
                "INSERT INTO dash_users (id, name, device_type) VALUES ($1, $2, 'unknown')",
                ip, name,
            )
            channel_id = f"private-{ip.replace('.', '-')}"
            await pool.execute(
                """INSERT INTO dash_channels (id, name, type, owner_id)
                   VALUES ($1, $2, 'private', $3)
                   ON CONFLICT (id) DO NOTHING""",
                channel_id, name, ip,
            )
            await pool.execute(
                """INSERT INTO dash_channel_members (channel_id, user_id, role)
                   VALUES ($1, $2, 'owner')
                   ON CONFLICT DO NOTHING""",
                channel_id, ip,
            )
            user = await pool.fetchrow("SELECT * FROM dash_users WHERE id = $1", ip)

        await pool.execute("UPDATE dash_users SET last_seen = NOW() WHERE id = $1", ip)
        return dict(user) if user else None

    async def get_user(self, user_id: str) -> dict[str, Any] | None:
        pool = await get_pool()
        row = await pool.fetchrow("SELECT * FROM dash_users WHERE id = $1", user_id)
        return dict(row) if row else None

    async def list_users(self) -> list[dict[str, Any]]:
        pool = await get_pool()
        rows = await pool.fetch("SELECT * FROM dash_users ORDER BY last_seen DESC")
        return [dict(r) for r in rows]

    async def upsert_user(self, ip: str, name: str, tailscale_name: str | None, device_type: str) -> dict[str, Any]:
        """Insert or update a user (used by Tailscale auto-discovery)."""
        pool = await get_pool()
        await pool.execute(
            """INSERT INTO dash_users (id, name, tailscale_name, device_type, last_seen)
               VALUES ($1, $2, $3, $4, NOW())
               ON CONFLICT (id) DO UPDATE SET
                   name = EXCLUDED.name,
                   tailscale_name = EXCLUDED.tailscale_name,
                   device_type = EXCLUDED.device_type,
                   last_seen = NOW()""",
            ip, name, tailscale_name, device_type,
        )
        return dict(await pool.fetchrow("SELECT * FROM dash_users WHERE id = $1", ip))

    # ── Channels ───────────────────────────────────────────────

    async def get_channels_for_user(self, user_id: str) -> list[dict[str, Any]]:
        pool = await get_pool()
        rows = await pool.fetch(
            """SELECT c.*, cm.role as member_role
               FROM dash_channels c
               JOIN dash_channel_members cm ON c.id = cm.channel_id
               WHERE cm.user_id = $1
               ORDER BY
                   CASE c.type
                       WHEN 'private' THEN 0
                       WHEN 'shared' THEN 1
                       ELSE 2
                   END,
                   c.name""",
            user_id,
        )
        return [dict(r) for r in rows]

    async def get_channel(self, channel_id: str) -> dict[str, Any] | None:
        pool = await get_pool()
        row = await pool.fetchrow("SELECT * FROM dash_channels WHERE id = $1", channel_id)
        return dict(row) if row else None

    async def create_channel(self, name: str, channel_type: str, owner_id: str) -> dict[str, Any] | None:
        pool = await get_pool()
        channel_id = f"{channel_type}-{uuid.uuid4().hex[:8]}"
        await pool.execute(
            "INSERT INTO dash_channels (id, name, type, owner_id) VALUES ($1, $2, $3, $4)",
            channel_id, name, channel_type, owner_id,
        )
        await pool.execute(
            """INSERT INTO dash_channel_members (channel_id, user_id, role)
               VALUES ($1, $2, 'owner')
               ON CONFLICT DO NOTHING""",
            channel_id, owner_id,
        )
        return await self.get_channel(channel_id)

    # ── Sessions ───────────────────────────────────────────────

    async def create_session(self, channel_id: str, user_id: str, title: str | None = None,
                             model: str | None = None) -> dict[str, Any] | None:
        pool = await get_pool()
        sid = uuid.uuid4().hex[:12]
        await pool.execute(
            """INSERT INTO dash_sessions (id, channel_id, user_id, title, model)
               VALUES ($1, $2, $3, $4, $5)""",
            sid, channel_id, user_id, title, model,
        )
        return await self.get_session(sid)

    async def get_sessions_for_channel(self, channel_id: str, limit: int = 20) -> list[dict[str, Any]]:
        pool = await get_pool()
        rows = await pool.fetch(
            "SELECT * FROM dash_sessions WHERE channel_id = $1 ORDER BY updated_at DESC LIMIT $2",
            channel_id, limit,
        )
        return [dict(r) for r in rows]

    async def get_session(self, session_id: str) -> dict[str, Any] | None:
        pool = await get_pool()
        row = await pool.fetchrow("SELECT * FROM dash_sessions WHERE id = $1", session_id)
        return dict(row) if row else None

    async def delete_session(self, session_id: str):
        pool = await get_pool()
        await pool.execute("DELETE FROM dash_sessions WHERE id = $1", session_id)

    async def touch_session(self, session_id: str):
        pool = await get_pool()
        await pool.execute("UPDATE dash_sessions SET updated_at = NOW() WHERE id = $1", session_id)

    # ── Messages ───────────────────────────────────────────────

    async def add_message(self, session_id: str, role: str, content: str,
                          tool_calls: str | None = None):
        pool = await get_pool()
        await pool.execute(
            """INSERT INTO dash_messages (session_id, role, content, tool_calls)
               VALUES ($1, $2, $3, $4)""",
            session_id, role, content, tool_calls,
        )
        await self.touch_session(session_id)

    async def get_messages(self, session_id: str, limit: int = 200) -> list[dict[str, Any]]:
        pool = await get_pool()
        rows = await pool.fetch(
            "SELECT * FROM dash_messages WHERE session_id = $1 ORDER BY id ASC LIMIT $2",
            session_id, limit,
        )
        return [dict(r) for r in rows]

    # ── Stats ──────────────────────────────────────────────────

    async def stats(self) -> dict[str, int]:
        pool = await get_pool()
        return {
            "users": await pool.fetchval("SELECT COUNT(*) FROM dash_users"),
            "channels": await pool.fetchval("SELECT COUNT(*) FROM dash_channels"),
            "sessions": await pool.fetchval("SELECT COUNT(*) FROM dash_sessions"),
            "messages": await pool.fetchval("SELECT COUNT(*) FROM dash_messages"),
        }


# Singleton
users = UserService()