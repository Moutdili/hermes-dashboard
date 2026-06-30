"""Pydantic models — validation et réponses typées pour l'API Knowledge."""
from pydantic import BaseModel, Field


class NoteSummary(BaseModel):
    """Résumé d'une note (liste/recherche)."""
    id: int
    path: str
    title: str
    type: str = "note"
    folder: str = ""
    tags: str = "[]"
    size: int = 0


class NoteDetail(NoteSummary):
    """Note complète avec contenu."""
    content: str = ""
    created: str = ""
    updated: str = ""


class SearchResult(NoteSummary):
    """Résultat de recherche avec rank et snippet."""
    rank: float = 0.0
    snippet: str = ""


class SearchResponse(BaseModel):
    """Réponse de /api/knowledge/search."""
    query: str
    results: list[SearchResult]
    count: int


class GraphNode(BaseModel):
    """Node du graphe de liens."""
    id: int
    path: str
    title: str
    type: str
    folder: str


class GraphEdge(BaseModel):
    """Edge du graphe de liens."""
    source_path: str
    target_path: str
    source_id: int | None = None
    target_id: int | None = None


class GraphResponse(BaseModel):
    """Réponse de /api/knowledge/graph."""
    nodes: list[GraphNode]
    edges: list[GraphEdge]


class Tag(BaseModel):
    """Tag avec fréquence."""
    tag: str
    count: int


class TagsResponse(BaseModel):
    """Réponse de /api/knowledge/tags."""
    tags: list[Tag]


class Folder(BaseModel):
    """Dossier avec compteurs."""
    folder: str
    count: int
    size: int | None = None


class FoldersResponse(BaseModel):
    """Réponse de /api/knowledge/folders."""
    folders: list[Folder]


class NotesListResponse(BaseModel):
    """Réponse de /api/knowledge/notes."""
    notes: list[NoteDetail]
    total: int
    limit: int
    offset: int


class ErrorResponse(BaseModel):
    """Réponse d'erreur standard."""
    error: str