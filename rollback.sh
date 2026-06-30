#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════
#  Hermes Dashboard — Rollback
#  Restaure l'ancien dashboard en cas de problème
# ═══════════════════════════════════════════════════════════

echo "◀️  Hermes Dashboard — Rollback"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Arrêter le nouveau dashboard
echo "▶ Arrêt nouveau dashboard…"
fuser -k 8899/tcp 2>/dev/null && echo "  ✅ Backend arrêté" || echo "  ℹ️  Backend déjà arrêté"
fuser -k 3000/tcp 2>/dev/null && echo "  ✅ Frontend arrêté" || echo "  ℹ️  Frontend déjà arrêté"
sleep 2

# Trouver le backup le plus récent
LATEST_BACKUP=$(ls -dt ~/web-ui-backup-* 2>/dev/null | head -1)
if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ Aucun backup trouvé dans ~/web-ui-backup-*"
  echo "  L'ancien dashboard n'a pas pu être restauré."
  exit 1
fi
echo "  ✅ Backup trouvé: $LATEST_BACKUP"

# Restaurer
echo "▶ Restauration ancien dashboard…"
if [ -d ~/web-ui ]; then
  mv ~/web-ui ~/web-ui-new-$(date +%Y%m%d-%H%M%S)
fi
cp -r "$LATEST_BACKUP" ~/web-ui
echo "  ✅ Ancien dashboard restauré dans ~/web-ui"

# Relancer l'ancien serveur
echo "▶ Redémarrage ancien serveur…"
cd ~/web-ui/backend
nohup python3 server.py >/tmp/old-server.log 2>&1 &
echo "  ✅ Ancien serveur démarré (PID $!)"

sleep 3
if curl -sf http://127.0.0.1:8899/api/health >/dev/null 2>&1; then
  echo "  ✅ Ancien serveur healthy"
else
  echo "  ⚠️  Ancien serveur pas encore ready — check /tmp/old-server.log"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "◀️  Rollback terminé — ancien dashboard actif sur :8899"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"