#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
#  Hermes Dashboard — Deploy script
#  Build → Test → Deploy
# ═══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Hermes Dashboard — Deploy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 1: Backend tests ─────────────────────────────────
echo "▶ [1/4] Backend tests…"
cd backend
if [ -f .venv/bin/pytest ]; then
  .venv/bin/pytest -q --tb=short
else
  pytest -q --tb=short
fi
cd ..
echo "  ✅ Backend tests passed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 2: Frontend build + tests ────────────────────────
echo "▶ [2/4] Frontend build + tests…"
cd frontend
bun run build
bun run test
cd ..
echo "  ✅ Frontend build + tests passed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 3: Docker build ──────────────────────────────────
echo "▶ [3/4] Docker build…"
docker compose build
echo "  ✅ Docker images built"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 4: Deploy ────────────────────────────────────────
echo "▶ [4/4] Deploy…"
docker compose down
docker compose up -d --wait

# Wait for health
echo "  Waiting for health…"
for i in $(seq 1 30); do
  if curl -sf http://localhost:8899/api/health >/dev/null 2>&1; then
    echo "  ✅ Backend healthy"
    break
  fi
  sleep 2
done

if curl -sf http://localhost:3000 >/dev/null 2>&1; then
  echo "  ✅ Frontend healthy"
else
  echo "  ⚠️  Frontend not ready yet (may need a few more seconds)"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Deploy complete!"
echo ""
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:8899"
echo "  API docs : http://localhost:8899/docs"
echo ""
echo "  Logs     : docker compose logs -f"
echo "  Stop     : docker compose down"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"