"""Fixtures partagées — reset le pool asyncpg entre chaque test."""
import pytest
from app.db import connection


@pytest.fixture(autouse=True)
async def reset_pg_pool():
    """Reset le pool asyncpg avant chaque test (évite 'attached to a different loop')."""
    await connection.close_pool()
    yield
    await connection.close_pool()