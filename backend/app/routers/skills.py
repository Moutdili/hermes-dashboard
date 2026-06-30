"""Router Skills — liste, détail, sauvegarde."""
import os
import glob
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api/skills", tags=["skills"])

SKILLS_DIR = os.path.expanduser("~/.hermes/skills")


class SkillSaveRequest(BaseModel):
    content: str


def _find_skill_dir(name: str) -> str | None:
    """Cherche récursivement le dossier d'un skill par son nom."""
    matches = glob.glob(os.path.join(SKILLS_DIR, "**", name, "SKILL.md"), recursive=True)
    if matches:
        return os.path.dirname(matches[0])
    matches = glob.glob(os.path.join(SKILLS_DIR, "**", name, "skill.md"), recursive=True)
    if matches:
        return os.path.dirname(matches[0])
    return None


@router.get("")
async def list_skills():
    """Liste tous les skills installés."""
    import subprocess
    try:
        r = subprocess.run(
            ["hermes", "skills", "list"],
            capture_output=True, text=True, timeout=10,
            cwd=os.path.expanduser("~/.hermes"),
        )
        skills = []
        for line in r.stdout.split("\n"):
            line = line.strip()
            if not line or "─" in line or "Name" in line or "Installed" in line:
                continue
            parts = line.split("│")
            if len(parts) >= 3:
                skills.append({
                    "name": parts[1].strip(),
                    "source": parts[2].strip(),
                })
        return {"skills": skills}
    except Exception:
        return {"skills": []}


@router.get("/grouped")
async def list_skills_grouped():
    """Retourne les skills groupés par catégorie."""
    groups: dict[str, list] = {}
    for skill_dir in sorted(glob.glob(os.path.join(SKILLS_DIR, "*", "*", "SKILL.md"))):
        rel = os.path.relpath(os.path.dirname(skill_dir), SKILLS_DIR)
        parts = rel.split(os.sep)
        if len(parts) >= 2:
            category, name = parts[0], parts[1]
        else:
            category, name = "other", rel

        if category not in groups:
            groups[category] = []

        desc = ""
        try:
            content = open(skill_dir).read()
            for line in content.split("\n"):
                line = line.strip()
                if line.startswith("description:"):
                    desc = line.split(":", 1)[1].strip().strip('"').strip("'")
                    break
        except Exception:
            pass

        groups[category].append({
            "name": name,
            "description": desc,
            "path": os.path.dirname(skill_dir),
        })

    result = [
        {"category": k, "count": len(v), "skills": sorted(v, key=lambda x: x["name"])}
        for k, v in sorted(groups.items())
    ]
    return {
        "groups": result,
        "total_categories": len(result),
        "total_skills": sum(len(g["skills"]) for g in result),
    }


@router.get("/{skill_name}")
async def get_skill_content(skill_name: str):
    """Retourne le contenu d'un skill (SKILL.md)."""
    skill_dir = _find_skill_dir(skill_name)
    if skill_dir:
        skill_file = os.path.join(skill_dir, "SKILL.md")
        if not os.path.exists(skill_file):
            skill_file = os.path.join(skill_dir, "skill.md")
        if os.path.exists(skill_file):
            content = open(skill_file).read()
            return {"name": skill_name, "content": content, "path": skill_file}
    return {"name": skill_name, "content": "", "error": "Skill not found"}


@router.post("/{skill_name}/save")
async def save_skill(skill_name: str, req: SkillSaveRequest):
    """Sauvegarde le contenu d'un skill."""
    skill_dir = _find_skill_dir(skill_name)
    if skill_dir:
        skill_file = os.path.join(skill_dir, "SKILL.md")
    else:
        skill_dir = os.path.join(SKILLS_DIR, skill_name)
        skill_file = os.path.join(skill_dir, "SKILL.md")
    os.makedirs(skill_dir, exist_ok=True)
    with open(skill_file, "w") as f:
        f.write(req.content)
    return {"status": "saved", "name": skill_name, "path": skill_file}