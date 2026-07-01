"""Router Sessions — historique des sessions. Contrat aligné frontend."""
import os
import sqlite3
from fastapi import APIRouter, Depends
from app.middleware.auth import get_user_context
from app.services.user_service import users as user_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

HERMES_HOME = os.path.expanduser("~/.hermes")
STATE_DB = os.path.join(HERMES_HOME, "state.db")


def _session_to_frontend(row: dict) -> dict:
    """Hermes session → frontend Session."""
    return {
        "id": str(row.get("id", "")),
        "title": row.get("title", "Untitled"),
        "source": row.get("source", row.get("model", "unknown")),
        "when": row.get("created_at", row.get("updated_at", "")),
        "messages": row.get("message_count", 0),
    }


def _message_to_frontend(row: dict) -> dict:
    """Hermes message → frontend SessionMessage."""
    return {
        "id": row.get("id", 0),
        "role": row.get("role", "user"),
        "content": row.get("content", ""),
        "timestamp": row.get("created_at", ""),
    }


@router.get("")
async def list_sessions(ctx: dict = Depends(get_user_context)):
    """Liste les sessions → Session[] direct (merge Hermes + dashboard)."""
    sessions = []

    # Hermes sessions (SQLite state.db)
    if os.path.exists(STATE_DB):
        try:
            conn = sqlite3.connect(STATE_DB, timeout=2)
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT s.id, s.title, s.source, s.model, s.created_at, s.updated_at,
                       COUNT(m.id) as message_count
                FROM sessions s
                LEFT JOIN messages m ON m.session_id = s.id
                GROUP BY s.id
                ORDER BY s.updated_at DESC
                LIMIT 50
            """).fetchall()
            sessions = [_session_to_frontend(dict(r)) for r in rows]
            conn.close()
        except Exception:
            pass

    # Dashboard sessions (PostgreSQL)
    channel_id = ctx["channel"]["id"] if ctx.get("channel") else None
    if channel_id:
        try:
            dash = await user_service.get_sessions_for_channel(channel_id, limit=20)
            for d in dash:
                sessions.append(_session_to_frontend(d))
        except Exception:
            pass

    return sessions


@router.get("/{session_id}/messages")
async def get_session_messages(session_id: str):
    """Messages d'une session → SessionMessage[] direct."""
    if not os.path.exists(STATE_DB):
        return []

    try:
        conn = sqlite3.connect(STATE_DB, timeout=2)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT id, role, content, created_at
            FROM messages
            WHERE session_id = ?
            ORDER BY id ASC
            LIMIT 200
        """, (session_id,)).fetchall()
        messages = [_message_to_frontend(dict(r)) for r in rows]
        conn.close()
        return messages
    except Exception:
        return []
