"""Tests API Knowledge — contrat frontend aligné (réponses plates, pas de wrappers)."""
import pytest
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


class TestHealth:
    async def test_health(self, client):
        r = await client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] in ("ok", "degraded")
        assert "database" in data


class TestSearch:
    async def test_search_returns_results(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "bug bounty", "limit": 5})
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list)
        assert len(data) > 0

    async def test_search_has_snippet_with_highlights(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "bug bounty", "limit": 3})
        results = r.json()
        for result in results:
            assert "title" in result
            assert "snippet" in result

    async def test_search_filter_folder(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "skill", "folder": "skills", "limit": 10})
        assert r.status_code == 200
        for result in r.json():
            assert "id" in result

    async def test_search_filter_type(self, client):
        r = await client.get("/api/knowledge/search", params={"q": "bug", "type": "skill", "limit": 10})
        assert r.status_code == 200
        for result in r.json():
            assert "type" in result

    async def test_search_limit_respected(self, client):
        for limit in [1, 3, 5]:
            r = await client.get("/api/knowledge/search", params={"q": "bug bounty", "limit": limit})
            assert len(r.json()) <= limit


class TestGraph:
    async def test_graph_has_nodes(self, client):
        r = await client.get("/api/knowledge/graph")
        data = r.json()
        assert len(data["nodes"]) > 0
        assert len(data["links"]) >= 0

    async def test_graph_nodes_have_ids(self, client):
        r = await client.get("/api/knowledge/graph")
        for node in r.json()["nodes"]:
            assert "id" in node
            assert "title" in node


class TestTags:
    async def test_tags_non_empty(self, client):
        r = await client.get("/api/knowledge/tags")
        tags = r.json()
        assert isinstance(tags, list)
        assert len(tags) > 0

    async def test_tags_sorted_by_count(self, client):
        tags = (await client.get("/api/knowledge/tags")).json()
        for i in range(len(tags) - 1):
            assert tags[i]["count"] >= tags[i + 1]["count"]

    async def test_tags_have_fields(self, client):
        tags = (await client.get("/api/knowledge/tags")).json()
        for t in tags:
            assert "name" in t
            assert "count" in t


class TestFolders:
    async def test_folders_non_empty(self, client):
        r = await client.get("/api/knowledge/folders")
        folders = r.json()
        assert isinstance(folders, list)
        assert len(folders) > 0

    async def test_skills_folder_exists(self, client):
        folders = (await client.get("/api/knowledge/folders")).json()
        skills = [f for f in folders if f["name"] == "skills"]
        assert len(skills) > 0

    async def test_folders_have_fields(self, client):
        folders = (await client.get("/api/knowledge/folders")).json()
        for f in folders:
            assert "name" in f
            assert "count" in f


class TestNoteById:
    async def test_note_1_exists(self, client):
        r = await client.get("/api/knowledge/notes/1")
        assert r.status_code == 200
        note = r.json()
        assert note["id"] == 1

    async def test_note_has_all_fields(self, client):
        r = await client.get("/api/knowledge/notes/1")
        note = r.json()
        assert "id" in note
        assert "title" in note
        assert "content" in note
        assert "path" in note

    async def test_note_404(self, client):
        r = await client.get("/api/knowledge/notes/999999")
        assert r.status_code == 404


class TestNotesList:
    async def test_list_with_limit(self, client):
        r = await client.get("/api/knowledge/notes", params={"limit": 3})
        data = r.json()
        assert isinstance(data, list)
        assert len(data) == 3

    async def test_pagination(self, client):
        p1 = (await client.get("/api/knowledge/notes", params={"limit": 2, "offset": 0})).json()
        p2 = (await client.get("/api/knowledge/notes", params={"limit": 2, "offset": 2})).json()
        ids1 = {n["id"] for n in p1}
        ids2 = {n["id"] for n in p2}
        assert ids1.isdisjoint(ids2)

    async def test_filter_by_folder(self, client):
        r = await client.get("/api/knowledge/notes", params={"folder": "skills", "limit": 5})
        for note in r.json():
            assert note["folder"] == "skills"

    async def test_filter_by_type(self, client):
        r = await client.get("/api/knowledge/notes", params={"type": "skill", "limit": 5})
        for note in r.json():
            assert note["type"] == "skill"


class TestResilience:
    async def test_search_empty_query_does_not_crash(self, client):
        r = await client.get("/api/knowledge/search")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    async def test_search_bad_input(self, client):
        # SQL injection attempt should not crash
        r = await client.get("/api/knowledge/search", params={"q": "'; DROP TABLE vault_notes;--"})
        assert r.status_code in (200, 422)
