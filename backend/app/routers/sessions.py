"""Router Sessions — historique des sessions Hermes."""
import os
import sqlite3
from pathlib import Path
from fastapi import APIRouter, Depends
from app.middleware.auth import get_user_context
from app.services.user_service import users as user_service

router = APIRouter(prefix="/api/sessions", tags=["sessions"])

HERMES_HOME = os.path.expanduser("~/.hermes")
STATE_DB = os.path.join(HERMES_HOME, "state.db")


@router.get("")
async def list_sessions(ctx: dict = Depends(get_user_context)):
    """Liste les sessions Hermes (state.db) + sessions dashboard (PostgreSQL)."""
    # 1. Sessions Hermes (SQLite state.db)
    hermes_sessions = []
    if os.path.exists(STATE_DB):
        try:
            conn = sqlite3.connect(STATE_DB, timeout=2)
            conn.row_factory = sqlite3.Row
            rows = conn.execute("""
                SELECT id, title, source, model, created_at, updated_at
                FROM sessions
                ORDER BY updated_at DESC
                LIMIT 50
            """).fetchall()
            hermes_sessions = [dict(r) for r in rows]
            conn.close()
        except Exception:
            pass

    # 2. Sessions dashboard (PostgreSQL)
    channel_id = ctx["channel"]["id"] if ctx["channel"] else None
    dash_sessions = []
    if channel_id:
        dash_sessions = await user_service.get_sessions_for_channel(channel_id, limit=20)

    return {
        "hermes_sessions": hermes_sessions,
        "dashboard_sessions": dash_sessions,
        "total": len(hermes_sessions) + len(dash_sessions),
    }


@router.get("/{session_id}/messages")
async def get_session_messages(session_id: str):
    """Retourne les messages d'une session Hermes (state.db)."""
    if not os.path.exists(STATE_DB):
        return {"messages": [], "error": "state.db not found"}

    try:
        conn = sqlite3.connect(STATE_DB, timeout=2)
        conn.row_factory = sqlite3.Row
        rows = conn.execute("""
            SELECT id, role, content, tool_calls, created_at
            FROM messages
            WHERE session_id = ?
            ORDER BY id ASC
            LIMIT 200
        """, (session_id,)).fetchall()
        messages = [dict(r) for r in rows]
        conn.close()
        return {"session_id": session_id, "messages": messages, "count": len(messages)}
    except Exception as e:
        return {"session_id": session_id, "messages": [], "error": str(e)}