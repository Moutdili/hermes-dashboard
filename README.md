# Hermes Dashboard

Control center for [Hermes Agent](https://hermes-agent.nousresearch.com) — modern web UI built with FastAPI + Next.js.

## Stack

| Layer | Tech |
|-------|------|
| Backend | FastAPI + asyncpg + Pydantic v2 |
| Frontend | Next.js 14 + TypeScript + Tailwind CSS |
| Database | PostgreSQL 16 |
| Tooling | Bun (frontend), pip (backend) |
| Tests | pytest (75 backend), Playwright (11 frontend) |
| Deploy | Docker Compose |

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────┐
│  Next.js    │────▶│  FastAPI     │────▶│ PostgreSQL │
│  :3000      │ API │  :8899       │     │  :5432     │
│  SSR/static │     │  7 routers   │     │  pgvector  │
└─────────────┘     └──────────────┘     └────────────┘
```

### Backend routers
- `/api/knowledge/*` — vault search, tags, folders, graph, notes
- `/api/skills/*` — skill browser, grouped view, detail, save
- `/api/cron/*` — scheduled jobs list + output
- `/api/sessions/*` — session history + messages
- `/api/chat/ws` — WebSocket real-time chat
- `/api/auth/*` — Tailscale IP auth
- `/api/health`, `/api/status` — system health

### Frontend pages
- `/` — Dashboard (stats, quick links)
- `/knowledge` — Search + tags + folders
- `/knowledge/[id]` — Note detail with markdown rendering
- `/chat` — Real-time WebSocket chat
- `/skills` — Skill browser grouped by category
- `/cron` — Cron jobs with output viewer
- `/sessions` — Session history with message viewer
- `/graph` — D3.js force-directed knowledge graph
- `/settings` — System + profile settings

## Quick Start

### Docker (recommended)

```bash
cp backend/.env.example backend/.env
docker compose up -d --wait

# Frontend : http://localhost:3000
# Backend  : http://localhost:8899
# API docs : http://localhost:8899/docs
```

### Deploy script

```bash
./deploy.sh   # tests → build → deploy
```

### Dev mode

```bash
# Backend
cd backend
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8899

# Frontend
cd frontend
bun install
bun run dev
```

## Design System

Dark-only theme — **DATK Glass** palette:

| Token | Value |
|-------|-------|
| `bg-root` | `#060b14` |
| `bg-surface` | `#0f1729` |
| `bg-elevated` | `#131d33` |
| `ac-cyan` | `#22d3ee` |
| `ac-purple` | `#a78bfa` |
| `ac-green` | `#34d399` |
| `ac-amber` | `#fbbf24` |
| `ac-rose` | `#fb7185` |

UI components: Button, Card, Modal, Input, Badge, Tabs, State (loading/empty/error).

## Testing

```bash
# Backend (75 tests)
cd backend && pytest -v

# Frontend (11 Playwright tests)
cd frontend && bun run test
```

## CI

GitHub Actions runs on every push:
1. Backend tests (PostgreSQL service container)
2. Frontend build + Playwright tests
3. Docker build smoke (compose up → health check → compose down)

## Project Structure

```
hermes-dashboard/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app + lifespan
│   │   ├── config.py             # Pydantic settings
│   │   ├── routers/              # 7 API routers
│   │   ├── services/             # Business logic
│   │   ├── models/               # Pydantic models
│   │   ├── db/                   # asyncpg pool
│   │   └── middleware/           # Auth
│   ├── tests/                    # 75 tests
│   ├── Dockerfile                # Multi-stage Python
│   └── pyproject.toml
├── frontend/
│   ├── app/                      # 11 Next.js pages
│   ├── components/               # UI + layout + knowledge + chat
│   ├── lib/                      # API client + WS + utils
│   ├── styles/                   # Tailwind + DATK globals
│   ├── tests/                    # 11 Playwright tests
│   ├── Dockerfile                # Multi-stage Bun → Node
│   └── package.json
├── .github/workflows/ci.yml      # 3 CI jobs
├── docker-compose.yml            # backend + frontend + postgres
├── deploy.sh                     # Build → test → deploy
└── README.md
```