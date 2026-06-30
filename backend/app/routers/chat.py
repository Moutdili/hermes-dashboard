"""Router Chat — WebSocket temps réel + bridge vers Hermes Agent."""
import os
import sys
import json
import asyncio
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.user_service import users as user_service

router = APIRouter(prefix="/api/chat", tags=["chat"])

HERMES_HOME = os.path.expanduser("~/.hermes")


@router.websocket("/ws")
async def chat_websocket(websocket: WebSocket):
    """WebSocket chat temps réel — bridge vers Hermes Agent.

    Messages entrants: {"type": "message", "content": "...", "channel": "..."}
    Messages sortants: {"type": "token", "content": "..."} / {"type": "done"}
    """
    await websocket.accept()

    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "content": "Invalid JSON"})
                continue

            if msg.get("type") == "message":
                content = msg.get("content", "")
                channel_id = msg.get("channel", "shared")

                # Créer une session si pas déjà fait
                session = await user_service.create_session(
                    channel_id=channel_id,
                    user_id="100.76.54.29",  # fhp default
                    title=content[:50] if content else "New session",
                )

                # Sauvegarder le message utilisateur
                if session:
                    await user_service.add_message(
                        session_id=session["id"],
                        role="user",
                        content=content,
                    )

                # Pour l'instant, on renvoie un ack — le bridge Hermes Agent
                # sera implémenté en Phase 4 avec le vrai agent loop
                await websocket.send_json({
                    "type": "ack",
                    "session_id": session["id"] if session else None,
                    "content": f"Received: {content[:100]}",
                })
                await websocket.send_json({"type": "done"})

            elif msg.get("type") == "ping":
                await websocket.send_json({"type": "pong"})

    except WebSocketDisconnect:
        pass