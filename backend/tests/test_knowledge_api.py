"""Tests API intégrés — utilisent httpx.AsyncClient avec l'app FastAPI en mémoire."""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.db import connection


@pytest.fixture
async def client():
    """Démarre l'app FastAPI en mémoire pour les tests."""
    await connection.close_pool()
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    await connection.close_pool()


class TestHealth:
    async def test_health(self, client):
        r = await client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] in ("ok", "degraded")
        assert "db" in data


class TestSearch:
    async def test_search_returns_results(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "bug bounty", "limit": 5})
        assert r.status_code == 200
        data = r.json()
        assert data["count"] > 0
        assert len(data["results"]) > 0

    async def test_search_has_snippet_with_highlights(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "bug bounty", "limit": 3})
        results = r.json()["results"]
        assert any("<mark>" in r.get("snippet", "") for r in results)

    async def test_search_filter_folder(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "skill", "folder": "skills", "limit": 10})
        assert r.status_code == 200
        for result in r.json()["results"]:
            assert result["folder"] == "skills"

    async def test_search_filter_type(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "bug", "type": "skill", "limit": 10})
        assert r.status_code == 200
        for result in r.json()["results"]:
            assert result["type"] == "skill"

    async def test_search_limit_respected(self, client):
        for limit in [1, 3, 5]:
            r = await client.get("/api/knowledge/search", params={"q": "bug bounty", "limit": limit})
            assert len(r.json()["results"]) <= limit

    async def test_search_limit_validation_min(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "test", "limit": 0})
        assert r.status_code == 422

    async def test_search_limit_validation_max(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "test", "limit": 100})
        assert r.status_code == 200  # 100 is the max, should be OK
        r = await client.get("/api/knowledge/search", params={"q": "test", "limit": 101})
        assert r.status_code == 422


class TestGraph:
    async def test_graph_has_nodes(self, client):
        r = await client.get("/api/knowledge/graph")
        data = r.json()
        assert len(data["nodes"]) > 0
        assert len(data["edges"]) > 0

    async def test_graph_nodes_have_fields(self, client):
        r = await client.get("/api/knowledge/graph")
        for node in r.json()["nodes"][:5]:
            for field in ["id", "path", "title", "type", "folder"]:
                assert field in node


class TestTags:
    async def test_tags_non_empty(self, client):
        r = await client.get("/api/knowledge/tags")
        assert len(r.json()["tags"]) > 0

    async def test_tags_sorted_by_count(self, client):
        tags = (await client.get("/api/knowledge/tags")).json()["tags"]
        counts = [t["count"] for t in tags[:10]]
        assert counts == sorted(counts, reverse=True)

    async def test_tags_have_fields(self, client):
        tags = (await client.get("/api/knowledge/tags")).json()["tags"]
        for t in tags[:5]:
            assert "tag" in t
            assert "count" in t


class TestFolders:
    async def test_folders_non_empty(self, client):
        r = await client.get("/api/knowledge/folders")
        assert len(r.json()["folders"]) > 0

    async def test_skills_folder_exists(self, client):
        folders = (await client.get("/api/knowledge/folders")).json()["folders"]
        skills = [f for f in folders if f["folder"] == "skills"]
        assert len(skills) == 1
        assert skills[0]["count"] > 300

    async def test_folders_have_fields(self, client):
        folders = (await client.get("/api/knowledge/folders")).json()["folders"]
        for f in folders[:5]:
            assert "folder" in f
            assert "count" in f
            assert "size" in f


class TestNoteById:
    async def test_note_1_exists(self, client):
        r = await client.get("/api/knowledge/notes/1")
        assert r.status_code == 200
        assert r.json()["note"]["id"] == 1
        assert "title" in r.json()["note"]
        assert "content" in r.json()["note"]

    async def test_nonexistent_note_404(self, client):
        r = await client.get("/api/knowledge/notes/99999")
        assert r.status_code == 404

    async def test_note_has_all_fields(self, client):
        r = await client.get("/api/knowledge/notes/1")
        note = r.json()["note"]
        for field in ["id", "path", "title", "type", "folder", "tags", "content", "created", "updated", "size"]:
            assert field in note


class TestNotesList:
    async def test_list_with_limit(self, client):
        r = await client.get("/api/knowledge/notes", params={"limit": 3})
        data = r.json()
        assert data["total"] > 0
        assert len(data["notes"]) <= 3

    async def test_pagination(self, client):
        p1 = (await client.get("/api/knowledge/notes", params={"limit": 2, "offset": 0})).json()
        p2 = (await client.get("/api/knowledge/notes", params={"limit": 2, "offset": 2})).json()
        ids1 = {n["id"] for n in p1["notes"]}
        ids2 = {n["id"] for n in p2["notes"]}
        assert ids1 != ids2

    async def test_filter_by_folder(self, client):
        r = await client.get("/api/knowledge/notes", params={"folder": "skills", "limit": 5})
        for note in r.json()["notes"]:
            assert note["folder"] == "skills"

    async def test_filter_by_type(self, client):
        r = await client.get("/api/knowledge/notes", params={"type": "skill", "limit": 5})
        for note in r.json()["notes"]:
            assert note["type"] == "skill"

    async def test_limit_validation(self, client):
        r = await client.get("/api/knowledge/notes", params={"limit": 0})
        assert r.status_code == 422
        r = await client.get("/api/knowledge/notes", params={"limit": 201})
        assert r.status_code == 422

    async def test_offset_validation(self, client):
        r = await client.get("/api/knowledge/notes", params={"offset": -1})
        assert r.status_code == 422


class TestOpenAPI:
    async def test_docs_available(self, client):
        r = await client.get("/docs")
        assert r.status_code == 200

    async def test_openapi_schema(self, client):
        r = await client.get("/openapi.json")
        assert r.status_code == 200
        schema = r.json()
        assert schema["info"]["title"] == "Hermes Dashboard API"
        # Vérifie que les 6 endpoints knowledge sont présents
        paths = schema["paths"]
        assert "/api/knowledge/search" in paths
        assert "/api/knowledge/graph" in paths
        assert "/api/knowledge/tags" in paths
        assert "/api/knowledge/folders" in paths
        assert "/api/knowledge/notes" in paths
        assert "/api/knowledge/notes/{note_id}" in paths