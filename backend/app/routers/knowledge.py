"""Router API Knowledge — 6 endpoints, contrat aligné frontend."""
from fastapi import APIRouter, Query, HTTPException, status
from app.services.knowledge_vault import vault

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


def _tag_to_frontend(row: dict) -> dict:
    """Backend {tag, count} → frontend {name, count}."""
    return {"name": row["tag"], "count": row["count"]}


def _folder_to_frontend(row: dict) -> dict:
    """Backend {folder, count, size} → frontend {name, count, path}."""
    return {
        "name": row.get("folder", "/"),
        "count": row["count"],
        "path": row.get("folder", "/"),
    }


def _link_to_frontend(edge: dict) -> dict:
    """Backend edge → frontend link {source, target}."""
    return {
        "source": str(edge.get("source_id", "")),
        "target": str(edge.get("target_id", "")),
    }


@router.get("/search")
async def search(
    q: str = Query("", description="Recherche full-text"),
    type: str | None = None,
    folder: str | None = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Recherche full-text → SearchResult[] direct."""
    return await vault.search(q, limit=limit, folder=folder, note_type=type)


@router.get("/graph")
async def graph():
    """Retourne {nodes, links} → contrat frontend GraphData."""
    data = await vault.get_graph()
    return {
        "nodes": data["nodes"],
        "links": [_link_to_frontend(e) for e in data.get("edges", [])],
    }


@router.get("/tags")
async def tags():
    """Tous les tags → Tag[] direct."""
    rows = await vault.get_tags()
    return [_tag_to_frontend(r) for r in rows]


@router.get("/folders")
async def folders():
    """Arborescence → Folder[] direct."""
    rows = await vault.get_folders()
    return [_folder_to_frontend(r) for r in rows]


@router.get("/notes/{note_id}")
async def note(note_id: int):
    """Retourne une note → NoteDetail direct."""
    result = await vault.get_note_by_id(note_id)
    if result:
        return result
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


@router.get("/notes")
async def notes(
    folder: str | None = None,
    type: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Liste toutes les notes → NoteDetail[] direct."""
    rows, total = await vault.get_notes_list(folder=folder, note_type=type, limit=limit, offset=offset)
    return rows
