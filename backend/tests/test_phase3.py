"""Tests Phase 3 — Skills, Cron, Sessions, Chat."""
import pytest
import json
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db import connection


@pytest.fixture
async def client():
    await connection.close_pool()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await connection.close_pool()


# ═══ Skills ═══

class TestSkills:
    async def test_list_skills(self, client):
        r = await client.get("/api/skills")
        assert r.status_code == 200
        assert "skills" in r.json()

    async def test_skills_grouped(self, client):
        r = await client.get("/api/skills/grouped")
        assert r.status_code == 200
        data = r.json()
        assert "groups" in data
        assert "total_categories" in data
        assert "total_skills" in data
        assert data["total_skills"] > 0

    async def test_get_skill_content(self, client):
        r = await client.get("/api/skills/grouped")
        groups = r.json().get("groups", [])
        if not groups:
            pytest.skip("No skills installed")
        skill_name = groups[0]["skills"][0]["name"]
        r = await client.get(f"/api/skills/{skill_name}")
        assert r.status_code == 200
        data = r.json()
        assert data["name"] == skill_name
        assert "content" in data

    async def test_nonexistent_skill(self, client):
        r = await client.get("/api/skills/nonexistent-skill-xyz")
        assert r.status_code == 200
        assert "error" in r.json()

    async def test_skills_grouped_have_descriptions(self, client):
        """Au moins quelques skills doivent avoir une description."""
        r = await client.get("/api/skills/grouped")
        groups = r.json()["groups"]
        all_skills = [s for g in groups for s in g["skills"]]
        with_desc = [s for s in all_skills if s.get("description")]
        assert len(with_desc) > 0


# ═══ Cron ═══

class TestCron:
    async def test_list_crons(self, client):
        r = await client.get("/api/crons")
        assert r.status_code == 200
        data = r.json()
        assert "crons" in data
        assert "total" in data

    async def test_cron_output_nonexistent(self, client):
        r = await client.get("/api/crons/nonexistent-job/output")
        assert r.status_code == 200
        data = r.json()
        assert "error" in data or data.get("output") == ""


# ═══ Sessions ═══

class TestSessions:
    async def test_list_sessions(self, client):
        """Liste des sessions — nécessite auth (Tailscale IP)."""
        r = await client.get("/api/sessions", headers={"X-Forwarded-For": "100.76.54.29"})
        assert r.status_code == 200
        data = r.json()
        assert "hermes_sessions" in data
        assert "dashboard_sessions" in data
        assert "total" in data

    async def test_session_messages_nonexistent(self, client):
        r = await client.get("/api/sessions/nonexistent-session/messages")
        assert r.status_code == 200
        data = r.json()
        # Soit messages vide, soit erreur
        assert "messages" in data or "error" in data


# ═══ Chat WebSocket ═══

class TestChatWebSocket:
    async def test_websocket_connect(self):
        """Le WebSocket /api/chat/ws doit accepter la connexion."""
        from starlette.testclient import TestClient

        with TestClient(app) as test_client:
            with test_client.websocket_connect("/api/chat/ws") as ws:
                ws.send_text(json.dumps({"type": "ping"}))
                msg = ws.receive_json()
                assert msg["type"] == "pong"

    async def test_websocket_message(self):
        """Envoyer un message doit retourner un ack + done."""
        from starlette.testclient import TestClient

        with TestClient(app) as test_client:
            with test_client.websocket_connect("/api/chat/ws") as ws:
                ws.send_text(json.dumps({
                    "type": "message",
                    "content": "Hello test",
                    "channel": "shared",
                }))
                ack = ws.receive_json()
                assert ack["type"] == "ack"
                assert "session_id" in ack
                done = ws.receive_json()
                assert done["type"] == "done"


# ═══ OpenAPI — tous les routers présents ═══

class TestOpenAPIComplete:
    async def test_all_routers_in_schema(self, client):
        """Vérifie que les 7 routers sont dans le schéma OpenAPI."""
        r = await client.get("/openapi.json")
        schema = r.json()
        paths = schema["paths"]

        # Knowledge
        assert "/api/knowledge/search" in paths
        # Auth
        assert "/api/auth/whoami" in paths
        # Skills
        assert "/api/skills" in paths
        assert "/api/skills/grouped" in paths
        # Cron
        assert "/api/crons" in paths
        # Sessions
        assert "/api/sessions" in paths
        # System
        assert "/api/health" in paths