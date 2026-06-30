"""Router API Knowledge — 6 endpoints."""
from fastapi import APIRouter, Query
from app.services.knowledge_vault import vault

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("/search")
async def search(
    q: str = Query("", description="Recherche full-text"),
    type: str | None = None,
    folder: str | None = None,
    limit: int = 20,
):
    """Recherche full-text dans le knowledge vault."""
    results = await vault.search(q, limit=limit, folder=folder, note_type=type)
    return {"query": q, "results": results, "count": len(results)}


@router.get("/graph")
async def graph():
    """Retourne le graph de liens entre notes."""
    return await vault.get_graph()


@router.get("/tags")
async def tags():
    """Tous les tags avec leur fréquence."""
    return {"tags": await vault.get_tags()}


@router.get("/folders")
async def folders():
    """Arborescence des dossiers du vault."""
    return {"folders": await vault.get_folders()}


@router.get("/notes/{note_id}")
async def note(note_id: int):
    """Retourne une note spécifique par ID."""
    result = await vault.get_note_by_id(note_id)
    if result:
        return {"note": result}
    return {"error": "Note not found"}


@router.get("/notes")
async def notes(
    folder: str | None = None,
    type: str | None = None,
    limit: int = 50,
    offset: int = 0,
):
    """Liste toutes les notes avec filtres optionnels."""
    rows, total = await vault.get_notes_list(
        folder=folder, note_type=type, limit=limit, offset=offset
    )
    return {"notes": rows, "total": total, "limit": limit, "offset": offset}