"""Router Skills — liste, détail, sauvegarde. Contrat aligné frontend."""
import os
import glob
import yaml
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import settings

router = APIRouter(prefix="/api/skills", tags=["skills"])

SKILLS_DIR = os.path.expanduser("~/.hermes/skills")


class SkillSaveRequest(BaseModel):
    content: str


def _find_skill_dir(name: str) -> str | None:
    """Cherche récursivement le dossier d'un skill par son nom."""
    for ext in ("SKILL.md", "skill.md"):
        matches = glob.glob(os.path.join(SKILLS_DIR, "**", name, ext), recursive=True)
        if matches:
            return os.path.dirname(matches[0])
    return None


def _parse_skill_md(path: str) -> dict:
    """Parse SKILL.md YAML frontmatter + markdown body."""
    desc = ""
    category = "other"
    tags: list[str] = []
    name = os.path.basename(os.path.dirname(path))
    try:
        content = open(path).read()
        if content.startswith("---"):
            parts = content.split("---", 2)
            if len(parts) >= 3:
                try:
                    fm = yaml.safe_load(parts[1]) or {}
                    desc = fm.get("description", "")
                    category = fm.get("category", "other")
                    tags = fm.get("tags", [])
                except Exception:
                    pass
    except Exception:
        pass
    return {"name": name, "description": desc, "category": category, "tags": tags}


@router.get("")
async def list_skills():
    """Liste tous les skills → Skill[] direct."""
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
                    "description": "",
                    "category": parts[2].strip(),
                    "tags": [],
                })
        return skills
    except Exception:
        return []


@router.get("/grouped")
async def list_skills_grouped():
    """Retourne les skills groupés → SkillGroup[] direct."""
    groups: dict[str, list] = {}
    for skill_md in sorted(glob.glob(os.path.join(SKILLS_DIR, "*", "*", "SKILL.md"))):
        parsed = _parse_skill_md(skill_md)
        cat = parsed["category"]
        if cat not in groups:
            groups[cat] = []
        groups[cat].append(parsed)

    return [
        {"category": k, "skills": sorted(v, key=lambda x: x["name"])}
        for k, v in sorted(groups.items())
    ]


@router.get("/{skill_name}")
async def get_skill_content(skill_name: str):
    """Retourne le contenu d'un skill → SkillDetail direct."""
    skill_dir = _find_skill_dir(skill_name)
    if skill_dir:
        skill_file = os.path.join(skill_dir, "SKILL.md")
        if not os.path.exists(skill_file):
            skill_file = os.path.join(skill_dir, "skill.md")
        if os.path.exists(skill_file):
            content = open(skill_file).read()
            parsed = _parse_skill_md(skill_file)
            return {**parsed, "content": content}
    raise HTTPException(status_code=404, detail="Skill not found")


@router.post("/{skill_name}/save")
async def save_skill(skill_name: str, req: SkillSaveRequest):
    """Sauvegarde le contenu d'un skill → {success: true}."""
    skill_dir = _find_skill_dir(skill_name)
    if skill_dir:
        skill_file = os.path.join(skill_dir, "SKILL.md")
    else:
        skill_dir = os.path.join(SKILLS_DIR, skill_name)
        skill_file = os.path.join(skill_dir, "SKILL.md")
    os.makedirs(skill_dir, exist_ok=True)
    with open(skill_file, "w") as f:
        f.write(req.content)
    return {"success": True}
