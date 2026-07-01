"""Router system — health check + status."""
import os
import time
import platform as _platform
from fastapi import APIRouter

router = APIRouter(prefix="/api", tags=["system"])

_START_TIME = time.time()


def _count_skills() -> int:
    """Count installed skills from the filesystem."""
    import glob as _glob
    try:
        skills_dir = os.path.expanduser("~/.hermes/skills")
        return len(_glob.glob(os.path.join(skills_dir, "*", "*", "SKILL.md")))
    except Exception:
        return 0


def _count_crons() -> int:
    """Count cron jobs from output directories."""
    try:
        cron_output = os.path.expanduser("~/.hermes/cron/output")
        if os.path.isdir(cron_output):
            return len([d for d in os.listdir(cron_output) if os.path.isdir(os.path.join(cron_output, d))])
    except Exception:
        pass
    return 0


async def _count_sessions() -> int:
    """Count active sessions from the database."""
    try:
        from app.db.connection import get_pool
        pool = await get_pool()
        return await pool.fetchval(
            "SELECT COUNT(*) FROM dash_sessions WHERE updated_at > NOW() - INTERVAL '24 hours'"
        )
    except Exception:
        return 0


def _format_uptime(seconds: float) -> str:
    """Format uptime seconds into a human-readable string."""
    days, rem = divmod(int(seconds), 86400)
    hours, rem = divmod(rem, 3600)
    minutes, _ = divmod(rem, 60)
    parts = []
    if days:
        parts.append(f"{days}j")
    if hours:
        parts.append(f"{hours}h")
    if minutes or not parts:
        parts.append(f"{minutes}m")
    return " ".join(parts)


@router.get("/health")
async def health():
    """Health check — verifies server and database status."""
    from app.db.connection import get_pool

    database_ok = False
    try:
        pool = await get_pool()
        await pool.fetchval("SELECT 1")
        database_ok = True
    except Exception:
        pass

    return {
        "status": "ok" if database_ok else "degraded",
        "database": "ok" if database_ok else "down",
        "version": "0.1.0",
    }


@router.get("/status")
async def status():
    """System status — platform, uptime, counts."""
    return {
        "platform": f"{_platform.system()} {_platform.release()}",
        "uptime": _format_uptime(time.time() - _START_TIME),
        "active_sessions": await _count_sessions(),
        "skills_count": _count_skills(),
        "cron_count": _count_crons(),
    }
