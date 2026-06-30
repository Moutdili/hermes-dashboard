"""Pool de connexion PostgreSQL async."""
import asyncpg
from app.config import settings

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    """Retourne le pool singleton."""
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(
            host=settings.pg_host,
            port=settings.pg_port,
            user=settings.pg_user,
            password=settings.pg_password,
            database=settings.pg_database,
            min_size=2,
            max_size=10,
        )
    return _pool


async def close_pool():
    """Ferme le pool proprement."""
    global _pool
    if _pool:
        await _pool.close()
        _pool = None