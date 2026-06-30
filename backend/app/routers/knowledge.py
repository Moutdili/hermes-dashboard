"""Router API Knowledge — 6 endpoints avec Pydantic response_model."""
from fastapi import APIRouter, Query, HTTPException, status
from app.services.knowledge_vault import vault
from app.models.knowledge import (
    SearchResponse, GraphResponse, TagsResponse,
    FoldersResponse, NotesListResponse, NoteDetail, ErrorResponse,
)

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("/search", response_model=SearchResponse)
async def search(
    q: str = Query("", description="Recherche full-text"),
    type: str | None = None,
    folder: str | None = None,
    limit: int = Query(20, ge=1, le=100),
):
    """Recherche full-text dans le knowledge vault (PostgreSQL tsvector)."""
    results = await vault.search(q, limit=limit, folder=folder, note_type=type)
    return {"query": q, "results": results, "count": len(results)}


@router.get("/graph", response_model=GraphResponse)
async def graph():
    """Retourne le graph de liens entre notes (wikilinks)."""
    return await vault.get_graph()


@router.get("/tags", response_model=TagsResponse)
async def tags():
    """Tous les tags avec leur fréquence."""
    return {"tags": await vault.get_tags()}


@router.get("/folders", response_model=FoldersResponse)
async def folders():
    """Arborescence des dossiers du vault."""
    return {"folders": await vault.get_folders()}


@router.get("/notes/{note_id}", response_model=dict[str, NoteDetail] | ErrorResponse)
async def note(note_id: int):
    """Retourne une note spécifique par ID."""
    result = await vault.get_note_by_id(note_id)
    if result:
        return {"note": result}
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Note not found")


@router.get("/notes", response_model=NotesListResponse)
async def notes(
    folder: str | None = None,
    type: str | None = None,
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    """Liste toutes les notes avec filtres optionnels."""
    rows, total = await vault.get_notes_list(
        folder=folder, note_type=type, limit=limit, offset=offset
    )
    return {"notes": rows, "total": total, "limit": limit, "offset": offset}