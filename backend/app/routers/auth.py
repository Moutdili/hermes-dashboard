"""Router Auth — whoami, users, channels, sessions."""
from fastapi import APIRouter, Depends, HTTPException, status
from app.middleware.auth import get_user_context
from app.services.user_service import users
from app.models.user import UserContextResponse, User, Channel, Session, StatsResponse

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/whoami", response_model=UserContextResponse)
async def whoami(ctx: dict = Depends(get_user_context)):
    """Retourne l'utilisateur résolu + canal actif + canaux disponibles."""
    return {
        "user": ctx["user"],
        "channel": ctx["channel"],
        "channels": ctx["channels"],
    }


@router.get("/users", response_model=list[User])
async def list_users():
    """Liste tous les utilisateurs connus."""
    return await users.list_users()


@router.get("/channels", response_model=list[Channel])
async def list_channels(ctx: dict = Depends(get_user_context)):
    """Liste les canaux accessibles à l'utilisateur courant."""
    return ctx["channels"]


@router.post("/channels", response_model=Channel)
async def create_channel(
    name: str,
    channel_type: str = "shared",
    ctx: dict = Depends(get_user_context),
):
    """Crée un nouveau canal."""
    return await users.create_channel(
        name=name,
        channel_type=channel_type,
        owner_id=ctx["user"]["id"],
    )


@router.get("/sessions/{channel_id}", response_model=list[Session])
async def list_sessions(channel_id: str, limit: int = 20):
    """Liste les sessions d'un canal."""
    return await users.get_sessions_for_channel(channel_id, limit=limit)


@router.get("/stats", response_model=StatsResponse)
async def stats():
    """Statistiques globales du dashboard."""
    return await users.stats()