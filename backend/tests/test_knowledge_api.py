"""Tests pour le Knowledge Vault API — version async."""
import pytest
import httpx

API_BASE = "http://localhost:8899"


@pytest.fixture
async def client():
    async with httpx.AsyncClient(base_url=API_BASE, timeout=10) as c:
        yield c


class TestHealth:
    async def test_health(self, client):
        r = await client.get("/api/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] in ("ok", "degraded")


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
        for result in r.json()["results"]:
            assert result["folder"] == "skills"

    async def test_search_limit(self, client):
        for limit in [1, 3, 5]:
            r = await client.get("/api/knowledge/search", params={"q": "bug bounty", "limit": limit})
            assert len(r.json()["results"]) <= limit


class TestGraph:
    async def test_graph_has_nodes(self, client):
        r = await client.get("/api/knowledge/graph")
        data = r.json()
        assert len(data["nodes"]) > 0
        assert len(data["edges"]) > 0


class TestTags:
    async def test_tags_non_empty(self, client):
        r = await client.get("/api/knowledge/tags")
        assert len(r.json()["tags"]) > 0

    async def test_tags_sorted_by_count(self, client):
        tags = r.json()["tags"] if (r := await client.get("/api/knowledge/tags")) else []
        counts = [t["count"] for t in tags[:10]]
        assert counts == sorted(counts, reverse=True)


class TestFolders:
    async def test_folders_non_empty(self, client):
        r = await client.get("/api/knowledge/folders")
        assert len(r.json()["folders"]) > 0

    async def test_skills_folder_exists(self, client):
        folders = (await client.get("/api/knowledge/folders")).json()["folders"]
        skills = [f for f in folders if f["folder"] == "skills"]
        assert len(skills) == 1
        assert skills[0]["count"] > 300


class TestNoteById:
    async def test_note_1_exists(self, client):
        r = await client.get("/api/knowledge/notes/1")
        assert r.status_code == 200
        assert r.json()["note"]["id"] == 1

    async def test_nonexistent_note(self, client):
        r = await client.get("/api/knowledge/notes/99999")
        assert "error" in r.json()


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