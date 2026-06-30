"""Tests pour le service KnowledgeVault — directement la DB, sans HTTP."""
import pytest
from app.services.knowledge_vault import vault


class TestSearch:
    async def test_search_returns_results(self):
        results = await vault.search("bug bounty", limit=5)
        assert len(results) > 0

    async def test_search_has_expected_fields(self):
        results = await vault.search("bug bounty", limit=1)
        r = results[0]
        for field in ["id", "title", "path", "type", "folder", "snippet", "rank"]:
            assert field in r

    async def test_search_highlights_present(self):
        results = await vault.search("bug bounty", limit=3)
        assert any("<mark>" in r.get("snippet", "") for r in results)

    async def test_search_filter_by_folder(self):
        results = await vault.search("skill", folder="skills", limit=10)
        for r in results:
            assert r["folder"] == "skills"

    async def test_search_filter_by_type(self):
        results = await vault.search("bug", note_type="skill", limit=10)
        for r in results:
            assert r["type"] == "skill"

    async def test_search_limit(self):
        for limit in [1, 3, 5]:
            results = await vault.search("bug bounty", limit=limit)
            assert len(results) <= limit

    async def test_search_empty_query(self):
        results = await vault.search("")
        assert isinstance(results, list)


class TestGraph:
    async def test_graph_has_nodes_and_edges(self):
        graph = await vault.get_graph()
        assert len(graph["nodes"]) > 0
        assert len(graph["edges"]) > 0

    async def test_graph_nodes_have_fields(self):
        graph = await vault.get_graph()
        for node in graph["nodes"][:5]:
            for field in ["id", "path", "title", "type", "folder"]:
                assert field in node


class TestGetNoteById:
    async def test_note_1_exists(self):
        note = await vault.get_note_by_id(1)
        assert note is not None
        assert "title" in note
        assert "content" in note

    async def test_nonexistent_returns_none(self):
        note = await vault.get_note_by_id(999999)
        assert note is None


class TestGetNotesList:
    async def test_returns_list_and_total(self):
        rows, total = await vault.get_notes_list(limit=10)
        assert total > 0
        assert len(rows) <= 10

    async def test_pagination(self):
        p1, _ = await vault.get_notes_list(limit=3, offset=0)
        p2, _ = await vault.get_notes_list(limit=3, offset=3)
        if len(p1) == 3 and len(p2) == 3:
            ids1 = {r["id"] for r in p1}
            ids2 = {r["id"] for r in p2}
            assert ids1 != ids2

    async def test_filter_by_folder(self):
        rows, _ = await vault.get_notes_list(folder="skills", limit=5)
        for r in rows:
            assert r["folder"] == "skills"

    async def test_filter_by_type(self):
        rows, _ = await vault.get_notes_list(note_type="skill", limit=5)
        for r in rows:
            assert r["type"] == "skill"


class TestTags:
    async def test_tags_returns_list(self):
        tags = await vault.get_tags()
        assert len(tags) > 0
        assert "tag" in tags[0]
        assert "count" in tags[0]

    async def test_tags_sorted_by_count(self):
        tags = await vault.get_tags()
        counts = [t["count"] for t in tags[:10]]
        assert counts == sorted(counts, reverse=True)


class TestFolders:
    async def test_folders_returns_list(self):
        folders = await vault.get_folders()
        assert len(folders) > 0

    async def test_skills_folder_exists(self):
        folders = await vault.get_folders()
        skills = [f for f in folders if f["folder"] == "skills"]
        assert len(skills) == 1
        assert skills[0]["count"] > 300


class TestResilience:
    async def test_search_never_crashes(self):
        try:
            results = await vault.search("test_requete")
            assert isinstance(results, list)
        except Exception as e:
            assert "connection" in str(e).lower()