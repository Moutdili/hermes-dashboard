"""Router Cron — liste et output des cron jobs. Contrat aligné frontend."""
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


def _cron_to_frontend(c: dict) -> dict:
    """Backend cron dump → frontend CronJob."""
    return {
        "id": c.get("job_id", c.get("id", "")),
        "name": c.get("name", c.get("prompt", "")[:60]),
        "schedule": c.get("schedule", ""),
        "prompt": c.get("prompt", ""),
        "status": c.get("status", "unknown"),
        "last_run": c.get("last_run"),
        "next_run": c.get("next_run"),
    }


@router.get("")
async def list_crons():
    """Liste tous les cron jobs → CronJob[] direct (filesystem, compatible Docker)."""
    crons = []
    # Try filesystem first (works in Docker with volume mount)
    out_dir = Path(CRON_OUTPUT_DIR)
    if out_dir.exists():
        for job_dir in sorted(out_dir.iterdir()):
            if job_dir.is_dir():
                files = sorted(job_dir.glob("*.md"), reverse=True)
                last_output = ""
                last_run = None
                if files:
                    last_run = datetime.fromtimestamp(files[0].stat().st_mtime).isoformat()
                    try:
                        last_output = files[0].read_text()[:200]
                    except Exception:
                        pass
                crons.append({
                    "id": job_dir.name,
                    "name": job_dir.name,
                    "schedule": "",
                    "prompt": "",
                    "status": "unknown",
                    "last_run": last_run,
                    "next_run": None,
                })

    # Fallback: try dump script
    if not crons:
        import subprocess
        try:
            result = subprocess.run(
                [sys.executable, HERMES_CRON_DUMP],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode == 0:
                try:
                    raw = json.loads(result.stdout)
                    crons = [_cron_to_frontend(c) for c in raw]
                except Exception:
                    pass
        except Exception:
            pass

    return crons


@router.get("/{job_id}/output")
async def get_cron_output(job_id: str):
    """Dernier output d'un cron → CronOutput."""
    out_dir = Path(CRON_OUTPUT_DIR) / job_id
    if not out_dir.exists():
        return {"id": job_id, "output": "", "timestamp": ""}
    files = sorted(out_dir.glob("*.md"), reverse=True)
    if not files:
        return {"id": job_id, "output": "", "timestamp": ""}
    try:
        content = files[0].read_text()
        return {
            "id": job_id,
            "output": content,
            "timestamp": datetime.fromtimestamp(files[0].stat().st_mtime).isoformat(),
        }
    except Exception:
        return {"id": job_id, "output": "", "timestamp": ""}
