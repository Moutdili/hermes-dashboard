"""Router system — health check."""
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["system"])


@router.get("/health")
async def health():
    """Health check — vérifie l'état du serveur et de la DB."""
    from app.db.connection import get_pool

    db_ok = True
    try:
        pool = await get_pool()
        await pool.fetchval("SELECT 1")
    except Exception:
        db_ok = False

    return {
        "status": "ok" if db_ok else "degraded",
        "db": "connected" if db_ok else "disconnected",
    }