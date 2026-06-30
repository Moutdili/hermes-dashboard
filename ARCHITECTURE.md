# Architecture — Hermes Dashboard

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     User (Browser / PWA)                     │
└────────────┬───────────────────────────────┬────────────────┘
             │ HTTP /api/*                   │ WS /api/chat/ws
             ▼                               ▼
┌──────────────────────┐     ┌──────────────────────────────────┐
│   Next.js 14         │     │        FastAPI Backend            │
│   App Router         │     │                                   │
│                      │     │  Routers:                         │
│  29 pages            │────▶│   /api/knowledge/*                │
│  SSR + static        │     │   /api/skills/*                   │
│  Dark theme DATK     │     │   /api/cron/*                     │
│  PWA (SW + manifest) │     │   /api/sessions/*                 │
│                      │     │   /api/chat/ws (WebSocket)        │
│  Components:         │     │   /api/auth/* (Tailscale IP)      │
│   ui/ (7 composants) │     │   /api/health, /api/status        │
│   layout/ (3)        │     │                                   │
│   knowledge/ (3)     │     │  Services:                        │
│   chat/ (1)          │     │   knowledge_vault.py              │
│   shared/ (2)        │     │   user_service.py                 │
│                      │     │                                   │
│  Lib:                │     │  Middleware:                      │
│   api.ts (fetch)     │     │   auth.py (Tailscale IP)          │
│   ws.ts (WebSocket)  │     │                                   │
│   utils.ts           │     │  DB: asyncpg pool                 │
└──────────────────────┘     └──────────────┬───────────────────┘
                                            │
                                            ▼
                                 ┌────────────────────┐
                                 │  PostgreSQL 16     │
                                 │  ville_en_vogue    │
                                 │  pgvector + GIN    │
                                 └────────────────────┘
```

## Couches

### 1. Frontend (Next.js 14)

**App Router** — Server Components par défaut, `'use client'` pour les pages interactives.

```
frontend/
├── app/                    # 29 pages
│   ├── layout.tsx          # Root layout (Shell + PWA)
│   ├── page.tsx            # Dashboard home
│   ├── knowledge/          # Search + [id] detail
│   ├── chat/               # WebSocket real-time
│   ├── skills/             # Grouped browser + modal
│   ├── graph/              # D3.js force graph
│   ├── terminal/           # Interactive terminal
│   ├── ...                 # 22 autres pages
│   └── ...
├── components/
│   ├── ui/                 # Button, Card, Modal, Input, Badge, Tabs, State
│   ├── layout/             # Sidebar (6 sections), Navbar, Shell
│   ├── knowledge/          # SearchBar, NoteCard, GraphView
│   ├── chat/               # ChatWindow
│   └── shared/             # MarkdownRenderer, CodeBlock
├── lib/
│   ├── api.ts              # Typed fetch client (15+ endpoints)
│   ├── ws.ts               # WebSocket client (auto-reconnect)
│   └── utils.ts            # cn(), formatDate(), debounce()
├── styles/
│   └── globals.css         # Tailwind + DATK palette + animations
└── public/
    ├── manifest.json       # PWA manifest
    ├── sw.js               # Service worker (cache-first)
    └── icon.svg            # App icon
```

**Design system — DATK Glass:**
- Dark only (`color-scheme: dark`)
- Backgrounds: `#060b14` → `#0f1729` → `#131d33` → `#18243d`
- Accents: cyan `#22d3ee`, purple `#a78bfa`, green `#34d399`, amber `#fbbf24`, rose `#fb7185`
- Glass effect: `backdrop-filter: blur(12px) saturate(180%)`
- Touch targets ≥44px sur mobile

### 2. Backend (FastAPI)

```
backend/
├── app/
│   ├── main.py              # App factory + lifespan + pool asyncpg
│   ├── config.py            # Pydantic settings (.env)
│   ├── routers/             # 7 routers (knowledge, skills, cron, sessions, chat, auth, system)
│   ├── services/            # knowledge_vault, user_service
│   ├── models/              # 10+ Pydantic models
│   ├── db/                  # connection.py (asyncpg pool)
│   └── middleware/          # auth.py (Tailscale IP)
├── tests/                   # 75 tests pytest
├── Dockerfile               # Multi-stage Python
└── pyproject.toml
```

**Router → Service → DB:**
- Routers gèrent HTTP (validation, response models)
- Services gèrent la business logic
- DB layer: asyncpg pool avec prepared statements

### 3. Database (PostgreSQL 16)

- **Host:** vv-db (195.15.243.29) via tunnel SSH ou réseau Docker
- **DB:** `ville_en_vogue`
- **Extensions:** pgvector, GIN indexes pour tsvector
- **Tables:**
  - `dash_users`, `dash_channels`, `dash_channel_members`
  - `dash_sessions`, `dash_messages`
  - `dash_memory`
  - Vault: `knowledge_notes` (tsvector + GIN pour FTS)

### 4. PWA

- **Manifest:** `public/manifest.json` — standalone, dark theme
- **Service Worker:** `public/sw.js` — cache-first pour static, network-first pour API
- **Registration:** inline script dans `layout.tsx`
- **Offline:** pages statiques servies depuis le cache

## Flux de données

### Recherche Knowledge
```
User tape query → SearchBar (debounce 300ms)
  → api.searchNotes(q) → GET /api/knowledge/search?q=...
  → FastAPI router → knowledge_vault service
  → PostgreSQL tsvector + GIN (FTS5 équivalent)
  → Results JSON → NoteCard components render
```

### Chat temps réel
```
User envoie message → ChatWindow.send()
  → WsClient.send() → WS /api/chat/ws
  → FastAPI WebSocket handler → bridge Hermes Agent
  → Streaming tokens → WsClient.on('message')
  → MessageBubble update en temps réel
```

### Auth Tailscale
```
Request arrive → auth middleware
  → Check X-Tailscale-IP header (ou Tailscale network)
  → get_user_context() → user from dash_users
  → Inject user dans request.state
  → Router handler accède via dependency
```

## Tests

| Layer | Tool | Count |
|-------|------|-------|
| Backend | pytest + httpx.AsyncClient | 75 |
| Frontend | Playwright (smoke) | 11 |
| Total | — | **86** |

## CI/CD

```
push → GitHub Actions
  ├── backend-tests (PostgreSQL service + pytest)
  ├── frontend-tests (Bun + Playwright)
  └── docker-build (compose up → health → down)
```

## Déploiement

```bash
./deploy.sh   # tests → build → docker compose up
```

- Backend: port 8899
- Frontend: port 3000
- PostgreSQL: port 5432
- Healthchecks sur les 3 services
- Réseau bridge `hermes-net`