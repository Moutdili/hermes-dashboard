"""Knowledge Vault service — PostgreSQL FTS."""
import json
from collections import Counter
from typing import Any

from app.db.connection import get_pool


class KnowledgeVault:
    """Accès au vault de connaissances (PostgreSQL tsvector + GIN)."""

    async def search(
        self, query: str, limit: int = 20, folder: str | None = None, note_type: str | None = None
    ) -> list[dict[str, Any]]:
        pool = await get_pool()
        sql = """
            SELECT
                id, path, title, type, folder, tags, content, created, updated, size,
                ts_rank(search_vector, plainto_tsquery('french', $1)) AS rank,
                ts_headline('french', COALESCE(content, ''), plainto_tsquery('french', $1),
                    'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20, ShortWord=3, MaxFragments=3') AS snippet
            FROM vault_notes
            WHERE search_vector @@ plainto_tsquery('french', $1)
        """
        params: list[Any] = [query]
        idx = 2
        if folder:
            sql += f" AND folder = ${idx}"
            params.append(folder)
            idx += 1
        if note_type:
            sql += f" AND type = ${idx}"
            params.append(note_type)
            idx += 1
        sql += f" ORDER BY rank DESC LIMIT ${idx}"
        params.append(limit)

        rows = await pool.fetch(sql, *params)
        return [dict(r) for r in rows]

    async def get_graph(self) -> dict[str, list]:
        pool = await get_pool()
        nodes = await pool.fetch(
            "SELECT id, path, title, type, folder FROM vault_notes ORDER BY type, folder"
        )
        edges = await pool.fetch("""
            SELECT l.source_path, l.target_path, n1.id as source_id, n2.id as target_id
            FROM vault_links l
            LEFT JOIN vault_notes n1 ON n1.path = l.source_path
            LEFT JOIN vault_notes n2 ON n2.path = l.target_path
        """)
        return {"nodes": [dict(n) for n in nodes], "edges": [dict(e) for e in edges]}

    async def get_tags(self) -> list[dict]:
        pool = await get_pool()
        rows = await pool.fetch("SELECT tags FROM vault_notes WHERE tags != '[]'")
        counter: Counter = Counter()
        for r in rows:
            try:
                for tag in json.loads(r["tags"]):
                    counter[tag] += 1
            except Exception:
                pass
        return [{"tag": t, "count": c} for t, c in counter.most_common(100)]

    async def get_folders(self) -> list[dict]:
        pool = await get_pool()
        rows = await pool.fetch(
            "SELECT folder, COUNT(*) as count, SUM(size) as total_size FROM vault_notes GROUP BY folder ORDER BY folder"
        )
        return [{"folder": r["folder"] or "/", "count": r["count"], "size": r["total_size"]} for r in rows]

    async def get_note_by_id(self, note_id: int) -> dict | None:
        pool = await get_pool()
        row = await pool.fetchrow("SELECT * FROM vault_notes WHERE id = $1", note_id)
        return dict(row) if row else None

    async def get_notes_list(
        self, folder: str | None = None, note_type: str | None = None, limit: int = 50, offset: int = 0
    ) -> tuple[list[dict], int]:
        pool = await get_pool()
        sql = "SELECT * FROM vault_notes WHERE 1=1"
        params: list[Any] = []
        idx = 1
        if folder:
            sql += f" AND folder = ${idx}"
            params.append(folder)
            idx += 1
        if note_type:
            sql += f" AND type = ${idx}"
            params.append(note_type)
            idx += 1
        sql += f" ORDER BY type, folder, title LIMIT ${idx} OFFSET ${idx + 1}"
        params.extend([limit, offset])

        rows = await pool.fetch(sql, *params)
        total = await pool.fetchval("SELECT COUNT(*) FROM vault_notes")
        return [dict(r) for r in rows], total


# Singleton
vault = KnowledgeVault()