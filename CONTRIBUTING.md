# Contributing — Hermes Dashboard

## Setup

```bash
# Clone
git clone <repo-url> && cd hermes-dashboard

# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"

# Frontend
cd ../frontend
bun install

# Docker (optional, for full stack)
docker compose up -d
```

## Development

### Backend

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8899
# API docs: http://localhost:8899/docs
```

### Frontend

```bash
cd frontend
bun run dev    # http://localhost:3000
```

Le frontend proxy `/api/*` vers `http://localhost:8899` (configuré dans `next.config.js`).

## Testing

```bash
# Backend — 75 tests
cd backend && pytest -v

# Frontend — 11 Playwright tests
cd frontend && bun run test
```

## Code Style

### Backend (Python)
- **FastAPI** routers + services separation
- **Pydantic v2** pour tous les models
- **asyncpg** pour DB (async, pool)
- **Type hints** obligatoires
- Functions async quand possible

### Frontend (TypeScript)
- **Next.js 14 App Router** — Server Components par défaut
- `'use client'` seulement quand nécessaire (interactivity, hooks)
- **Tailwind** utility-first, pas de CSS custom (sauf globals.css)
- **Types** dans `lib/api.ts` — pas de `any` sans justification
- Composants UI dans `components/ui/` — réutilisables et génériques

### Design System
- Dark theme only — palette DATK Glass
- Touch targets ≥44px sur mobile
- Composants: Button, Card, Modal, Input, Badge, Tabs, State
- Utiliser `cn()` pour merger les classes Tailwind

## Ajouter une page

1. Créer `app/<route>/page.tsx`
2. Ajouter `'use client'` si la page est interactive
3. Importer les composants UI depuis `@/components/ui/`
4. Ajouter la route dans `components/layout/Sidebar.tsx`
5. Ajouter un test smoke dans `tests/smoke.spec.ts`

```tsx
'use client';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/State';

export default function MyPage() {
  return (
    <div className="space-y-4 animate-fade-in">
      <h1 className="text-2xl font-bold text-tx-primary">My Page</h1>
      <Card>Content</Card>
    </div>
  );
}
```

## Ajouter un endpoint API

1. Créer ou étendre un router dans `backend/app/routers/`
2. Ajouter le Pydantic model dans `backend/app/models/`
3. Implémenter la logique dans `backend/app/services/`
4. Ajouter des tests dans `backend/tests/`
5. Ajouter le type + méthode dans `frontend/lib/api.ts`

## Commits

```
type: description concise

feat: nouvelle fonctionnalité
fix: correction de bug
refactor: refactor sans changement de comportement
docs: documentation
chore: maintenance
```

## Avant de push

```bash
# Backend
cd backend && pytest -q

# Frontend
cd frontend && bun run build && bun run test
```