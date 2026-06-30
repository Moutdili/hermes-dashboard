"""FastAPI app factory + lifespan."""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path

from app.db.connection import get_pool, close_pool
from app.routers import knowledge, system


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    pool = await get_pool()
    print(f"✅ PostgreSQL pool initialized ({pool.get_size()} connections)")
    yield
    # Shutdown
    await close_pool()
    print("✅ PostgreSQL pool closed")


app = FastAPI(
    title="Hermes Dashboard API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS — localhost + Tailscale
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: restrict to Tailscale IPs in prod
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(knowledge.router)
app.include_router(system.router)


# Static frontend (dev — Next.js s'occupe du prod)
_frontend = Path(__file__).parent.parent.parent / "frontend" / "out"
if _frontend.exists():
    app.mount("/", StaticFiles(directory=str(_frontend), html=True), name="frontend")