"""Tests Auth — middleware Tailscale IP, users, channels, sessions."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db import connection


@pytest.fixture
async def client():
    """Démarre l'app en mémoire, simule une connexion depuis fhp (Tailscale)."""
    await connection.close_pool()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await connection.close_pool()


class TestWhoami:
    async def test_whoami_tailscale_ip(self, client):
        """Une IP Tailscale doit résoudre un utilisateur (User direct, contrat frontend)."""
        r = await client.get("/api/auth/whoami", headers={"X-Forwarded-For": "100.76.54.29"})
        assert r.status_code == 200
        data = r.json()
        assert "id" in data
        assert "name" in data
        assert "ip" in data
        assert "channels" in data
        assert data["id"] == "100.76.54.29"

    async def test_whoami_localhost_defaults_to_fhp(self, client):
        """Localhost doit être résolu comme l'IP par défaut configurée."""
        r = await client.get("/api/auth/whoami")
        assert r.status_code == 200
        assert r.json()["id"] == "127.0.0.1"

    async def test_whoami_creates_guest_for_unknown_ip(self, client):
        """Une IP inconnue doit créer un utilisateur Guest."""
        r = await client.get("/api/auth/whoami", headers={"X-Forwarded-For": "100.99.99.99"})
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == "100.99.99.99"
        assert "Guest" in data["name"]

    async def test_whoami_returns_channels(self, client):
        """whoami doit retourner des channels."""
        r = await client.get("/api/auth/whoami", headers={"X-Forwarded-For": "100.76.54.29"})
        channels = r.json()["channels"]
        assert isinstance(channels, list)


class TestUsers:
    async def test_list_users(self, client):
        """Liste des utilisateurs — au moins 1 (fhp auto-créé)."""
        r = await client.get("/api/auth/users")
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        assert len(users) > 0

    async def test_user_has_fields(self, client):
        """Chaque utilisateur doit avoir les champs attendus (contrat frontend)."""
        r = await client.get("/api/auth/users")
        for u in r.json()[:5]:
            assert "id" in u
            assert "name" in u
            assert "ip" in u
            assert "channels" in u


class TestChannels:
    async def test_list_channels_for_user(self, client):
        """L'utilisateur fhp doit avoir au moins un canal."""
        r = await client.get("/api/auth/channels", headers={"X-Forwarded-For": "100.76.54.29"})
        assert r.status_code == 200
        channels = r.json()
        assert isinstance(channels, list)
        assert len(channels) > 0

    async def test_create_channel(self, client):
        """Création d'un canal shared."""
        r = await client.post(
            "/api/auth/channels",
            params={"name": "Test Channel", "channel_type": "shared"},
            headers={"X-Forwarded-For": "100.76.54.29"},
        )
        assert r.status_code == 200
        channel = r.json()
        assert channel["name"] == "Test Channel"
        assert channel["type"] == "shared"
        assert "id" in channel

    async def test_shared_channel_exists(self, client):
        """Le canal 'shared' doit exister (seeded par migration)."""
        from app.services.user_service import users
        channel = await users.get_channel("shared")
        assert channel is not None
        assert channel["type"] == "shared"


class TestSessions:
    async def test_create_and_list_session(self, client):
        """Crée une session puis liste les sessions du canal."""
        from app.services.user_service import users

        session = await users.create_session(
            channel_id="shared",
            user_id="100.76.54.29",
            title="Test Session",
        )
        assert session is not None
        assert session["title"] == "Test Session"

        sessions = await users.get_sessions_for_channel("shared")
        assert len(sessions) > 0
        assert any(s["title"] == "Test Session" for s in sessions)

        await users.delete_session(session["id"])


class TestStats:
    async def test_stats(self, client):
        """Stats retourne un dict avec les bons compteurs."""
        r = await client.get("/api/auth/stats")
        assert r.status_code == 200
        data = r.json()
        assert "users" in data
        assert "channels" in data
        assert "sessions" in data
        assert "messages" in data
        assert data["channels"] > 0

    async def test_stats_all_ints(self, client):
        """Tous les compteurs doivent être des int."""
        data = (await client.get("/api/auth/stats")).json()
        for key in ["users", "channels", "sessions", "messages"]:
            assert isinstance(data[key], int)


class TestIPResolution:
    async def test_get_client_ip_from_forwarded(self, client):
        """X-Forwarded-For doit être utilisé en priorité."""
        from app.middleware.auth import get_client_ip
        from unittest.mock import MagicMock

        request = MagicMock()
        request.headers = {"X-Forwarded-For": "100.111.222.333"}
        request.client = None

        ip = get_client_ip(request)
        assert ip == "100.111.222.333"

    async def test_get_client_ip_from_real_ip(self, client):
        """X-Real-IP doit être utilisé si pas de X-Forwarded-For."""
        from app.middleware.auth import get_client_ip
        from unittest.mock import MagicMock

        request = MagicMock()
        request.headers = {"X-Real-IP": "100.55.66.77"}
        request.client = None

        ip = get_client_ip(request)
        assert ip == "100.55.66.77"

    async def test_get_client_ip_localhost_defaults(self, client):
        """Localhost doit être résolu comme l'IP par défaut."""
        from app.middleware.auth import get_client_ip
        from unittest.mock import MagicMock

        request = MagicMock()
        request.headers = {}
        request.client = MagicMock()
        request.client.host = "127.0.0.1"

        ip = get_client_ip(request)
        assert ip == "127.0.0.1"

    async def test_is_tailscale_ip(self, client):
        """is_tailscale_ip doit reconnaître les IPs Tailscale."""
        from app.middleware.auth import is_tailscale_ip

        assert is_tailscale_ip("100.76.54.29") is True
        assert is_tailscale_ip("100.64.0.1") is True
        assert is_tailscale_ip("100.127.255.255") is True
        assert is_tailscale_ip("192.168.1.1") is False
        assert is_tailscale_ip("8.8.8.8") is False
        assert is_tailscale_ip("not-an-ip") is False
