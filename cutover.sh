#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
#  Hermes Dashboard — Cutover
#  Migration ancien dashboard (web-ui/server.py) → nouveau (hermes-dashboard)
# ═══════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

OLD_SERVER_PID=""
NEW_BACKEND_PID=""
NEW_FRONTEND_PID=""

cleanup() {
  echo "⚠️  Cutover interrompu — nettoyage…"
  [ -n "$NEW_FRONTEND_PID" ] && kill "$NEW_FRONTEND_PID" 2>/dev/null || true
  [ -n "$NEW_BACKEND_PID" ] && kill "$NEW_BACKEND_PID" 2>/dev/null || true
  # Relancer l'ancien serveur si on l'a tué
  if [ -n "$OLD_SERVER_PID" ] && [ -f ~/web-ui/backend/server.py ]; then
    echo "▶ Relancement ancien serveur…"
    cd ~/web-ui/backend && nohup python3 server.py >/dev/null 2>&1 &
  fi
  exit 1
}
trap cleanup INT TERM

echo "🔄 Hermes Dashboard — Cutover"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ─── Step 0: Pre-flight checks ─────────────────────────────
echo "▶ [0/5] Pre-flight checks…"

# Trouver l'ancien serveur sur le port 8899
OLD_SERVER_PID=$(ss -tlnp 2>/dev/null | grep ':8899' | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)
if [ -z "$OLD_SERVER_PID" ]; then
  echo "  ℹ️  Ancien serveur non trouvé sur :8899 (déjà arrêté ?)"
else
  echo "  ✅ Ancien serveur trouvé — PID $OLD_SERVER_PID"
fi

# Vérifier que le nouveau backend build
if [ ! -d backend/.venv ]; then
  echo "  ❌ Backend .venv manquant — lance 'pip install -e .[dev]' dans backend/"
  exit 1
fi
echo "  ✅ Backend .venv OK"

# Vérifier que le frontend est buildé
if [ ! -d frontend/.next ]; then
  echo "  ▶ Frontend pas buildé — build en cours…"
  cd frontend && bun run build && cd ..
fi
echo "  ✅ Frontend .next OK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 1: Backup ancien serveur ─────────────────────────
echo "▶ [1/5] Backup ancien dashboard…"
if [ -d ~/web-ui ]; then
  BACKUP_DIR=~/web-ui-backup-$(date +%Y%m%d-%H%M%S)
  cp -r ~/web-ui "$BACKUP_DIR" 2>/dev/null || true
  echo "  ✅ Backup créé: $BACKUP_DIR"
else
  echo "  ℹ️  ~/web-ui non trouvé — skip backup"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 2: Tests finaux ──────────────────────────────────
echo "▶ [2/5] Tests finaux…"
cd backend && .venv/bin/pytest -q --tb=short && cd ..
cd frontend && timeout 60 bun run test --reporter=line 2>/dev/null && cd ..
echo "  ✅ Tous les tests passent"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 3: Arrêter l'ancien serveur ──────────────────────
echo "▶ [3/5] Arrêt ancien serveur…"
if [ -n "$OLD_SERVER_PID" ]; then
  kill "$OLD_SERVER_PID" 2>/dev/null || true
  sleep 2
  # Vérifier qu'il est bien mort
  if ss -tlnp 2>/dev/null | grep -q ':8899'; then
    echo "  ⚠️  Port 8899 encore occupé — force kill…"
    kill -9 "$OLD_SERVER_PID" 2>/dev/null || true
    sleep 1
  fi
  echo "  ✅ Ancien serveur arrêté"
else
  echo "  ℹ️  Ancien serveur déjà arrêté"
fi
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 4: Démarrer le nouveau dashboard ─────────────────
echo "▶ [4/5] Démarrage nouveau dashboard…"

# Backend
cd backend
source .venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8899 >/tmp/hermes-backend.log 2>&1 &
NEW_BACKEND_PID=$!
deactivate 2>/dev/null || true
cd ..

echo "  ▶ Backend PID $NEW_BACKEND_PID — attente health…"
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:8899/api/health >/dev/null 2>&1; then
    echo "  ✅ Backend healthy"
    break
  fi
  sleep 2
  [ $i -eq 15 ] && { echo "  ❌ Backend n'a pas démarré"; cleanup; }
done

# Frontend
cd frontend
nohup node .next/standalone/server.js >/tmp/hermes-frontend.log 2>&1 &
NEW_FRONTEND_PID=$!
cd ..

echo "  ▶ Frontend PID $NEW_FRONTEND_PID — attente health…"
for i in $(seq 1 15); do
  if curl -sf http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo "  ✅ Frontend healthy"
    break
  fi
  sleep 2
  [ $i -eq 15 ] && { echo "  ⚠️  Frontend n'a pas démarré (check /tmp/hermes-frontend.log)"; }
done
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ─── Step 5: Vérification finale ───────────────────────────
echo "▶ [5/5] Vérification finale…"
echo ""
echo "  Backend  : $(curl -s http://127.0.0.1:8899/api/health 2>/dev/null || echo 'FAIL')"
echo "  Frontend : HTTP $(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000 2>/dev/null)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Cutover terminé !"
echo ""
echo "  📊 Dashboard : http://localhost:3000"
echo "  🔧 API docs  : http://localhost:8899/docs"
echo "  📋 Logs      : /tmp/hermes-backend.log, /tmp/hermes-frontend.log"
echo ""
echo "  Ancien dashboard backed up dans ~/web-ui-backup-*"
echo ""
echo "  Pour rollback: ./rollback.sh"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"