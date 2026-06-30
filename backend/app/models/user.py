"""Pydantic models — User, Channel, Session, Message."""
from pydantic import BaseModel
from datetime import datetime


class User(BaseModel):
    id: str
    name: str
    tailscale_name: str | None = None
    device_type: str = "unknown"
    created_at: datetime | None = None
    last_seen: datetime | None = None


class Channel(BaseModel):
    id: str
    name: str
    type: str = "private"
    owner_id: str | None = None
    created_at: datetime | None = None


class UserContextResponse(BaseModel):
    """Réponse de /api/auth/whoami."""
    user: User
    channel: Channel
    channels: list[Channel]


class Session(BaseModel):
    id: str
    channel_id: str
    user_id: str
    title: str | None = None
    model: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None


class Message(BaseModel):
    id: int
    session_id: str
    role: str
    content: str
    tool_calls: str | None = None
    created_at: datetime | None = None


class StatsResponse(BaseModel):
    users: int
    channels: int
    sessions: int
    messages: int