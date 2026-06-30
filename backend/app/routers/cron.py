"""Router Cron — liste et output des cron jobs."""
import os
import sys
import json
from pathlib import Path
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api/crons", tags=["cron"])

HERMES_HOME = os.path.expanduser("~/.hermes")
CRON_OUTPUT_DIR = os.path.join(HERMES_HOME, "cron", "output")
HERMES_CRON_DUMP = os.path.join(HERMES_HOME, "scripts", "dump-crons-json.py")


@router.get("")
async def list_crons():
    """Liste tous les cron jobs avec leur dernier statut et output résumé."""
    import subprocess
    try:
        result = subprocess.run(
            [sys.executable, HERMES_CRON_DUMP],
            capture_output=True, text=True, timeout=15,
            cwd=HERMES_HOME,
        )
        crons = []
        if result.returncode == 0:
            try:
                crons = json.loads(result.stdout)
            except Exception:
                pass

        enriched = []
        for c in crons:
            jid = c.get("job_id", c.get("id", ""))
            c["output_preview"] = ""
            c["output_file"] = ""
            if jid:
                out_dir = Path(CRON_OUTPUT_DIR) / jid
                if out_dir.exists():
                    files = sorted(out_dir.glob("*.md"), reverse=True)
                    if files:
                        latest = files[0]
                        c["output_file"] = str(latest)
                        try:
                            c["output_preview"] = latest.read_text()[:500]
                        except Exception:
                            pass
            enriched.append(c)

        return {"crons": enriched, "total": len(enriched)}
    except Exception as e:
        return {"error": str(e), "crons": []}


@router.get("/{job_id}/output")
async def get_cron_output(job_id: str):
    """Retourne le dernier output d'un cron spécifique."""
    out_dir = Path(CRON_OUTPUT_DIR) / job_id
    if not out_dir.exists():
        return {"job_id": job_id, "output": "", "error": "No output directory"}
    files = sorted(out_dir.glob("*.md"), reverse=True)
    if not files:
        return {"job_id": job_id, "output": "", "error": "No output files"}
    try:
        content = files[0].read_text()
        return {
            "job_id": job_id,
            "output": content,
            "file": str(files[0]),
            "timestamp": datetime.fromtimestamp(files[0].stat().st_mtime).isoformat(),
        }
    except Exception as e:
        return {"job_id": job_id, "output": "", "error": str(e)}