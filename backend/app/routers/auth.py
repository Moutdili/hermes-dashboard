"""Router Auth — whoami, login, logout, users, channels. Contrat aligné frontend."""
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from app.middleware.auth import get_user_context, get_client_ip
from app.services.user_service import users
from app.models.user import User, Channel, Session

router = APIRouter(prefix="/api/auth", tags=["auth"])


class LoginRequest(BaseModel):
    ip: str


def _user_to_frontend(row: dict) -> dict:
    """Backend user → frontend User {id, name, ip, channels}."""
    return {
        "id": row.get("id", ""),
        "name": row.get("name", ""),
        "ip": row.get("id", ""),  # Tailscale IP = user ID
        "channels": [],
    }


@router.get("/whoami")
async def whoami(ctx: dict = Depends(get_user_context)):
    """Retourne l'utilisateur → User direct (frontend contract)."""
    user = _user_to_frontend(ctx["user"])
    user["channels"] = [
        {"id": c["id"], "name": c["name"], "type": c.get("type", "private")}
        for c in ctx.get("channels", [])
    ]
    return user


@router.post("/login")
async def login(req: LoginRequest):
    """Login par IP → {success, user}."""
    resolved = await users.resolve_user(req.ip)
    if not resolved:
        # Auto-create guest
        resolved = await users.resolve_user(req.ip)
    if not resolved:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Could not resolve user")
    return {
        "success": True,
        "user": _user_to_frontend(resolved),
    }


@router.post("/logout")
async def logout(ctx: dict = Depends(get_user_context)):
    """Logout → {success}."""
    return {"success": True}


@router.get("/users")
async def list_users():
    """Liste tous les utilisateurs."""
    all_users = await users.list_users()
    return [_user_to_frontend(u) for u in all_users]


@router.get("/channels")
async def list_channels(ctx: dict = Depends(get_user_context)):
    """Canaux de l'utilisateur courant."""
    return [
        {"id": c["id"], "name": c["name"], "type": c.get("type", "private")}
        for c in ctx.get("channels", [])
    ]


@router.post("/channels")
async def create_channel(
    name: str,
    channel_type: str = "shared",
    ctx: dict = Depends(get_user_context),
):
    """Crée un nouveau canal."""
    ch = await users.create_channel(
        name=name,
        channel_type=channel_type,
        owner_id=ctx["user"]["id"],
    )
    if not ch:
        raise HTTPException(status_code=500, detail="Failed to create channel")
    return {"id": ch["id"], "name": ch["name"], "type": ch.get("type", channel_type)}


@router.get("/sessions/{channel_id}")
async def list_sessions(channel_id: str, limit: int = 20):
    """Sessions d'un canal."""
    return await users.get_sessions_for_channel(channel_id, limit=limit)


@router.get("/stats")
async def stats():
    """Statistiques globales."""
    return await users.stats()
