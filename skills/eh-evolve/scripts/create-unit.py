#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///
"""Create an evolution unit note in the project docs/ evolve vault."""
import sys, os, uuid, subprocess
from datetime import datetime

def detect_project_location() -> str:
    """Resolve the project root: env override > git top-level > cwd."""
    override = os.environ.get("EVOLVE_PROJECT_LOCATION")
    if override:
        return override
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--show-toplevel"],
            capture_output=True, text=True, check=False,
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip()
    except (FileNotFoundError, subprocess.SubprocessError):
        pass
    return os.getcwd()

def get_vault() -> str:
    """Resolve vault path: env override > {project_root}/docs."""
    override = os.environ.get("OBSIDIAN_VAULT")
    if override:
        return override
    return os.path.join(detect_project_location(), "docs")

def create_unit(title: str, action: str, confidence: float, domain: str,
                scope: str = "project", evidence: list = None, client: str = "opencode",
                targets: list = None, project_location: str = None) -> str:
    vault = get_vault()
    units_dir = os.path.join(vault, "evolve", "units")
    os.makedirs(units_dir, exist_ok=True)

    uid = f"evu-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6]}"
    evidence_links = "\n".join(f"  - [[{e}]]" for e in (evidence or []))
    targets_yaml = "\n".join(f"  - {t}" for t in (targets or ["skill"]))
    project_loc = project_location if project_location else detect_project_location()

    note = f"""---
kind: evolve-unit
id: {uid}
confidence: {confidence}
scope: {scope}
domain: {domain}
client: {client}
source: session-observation
project_location: "{project_loc}"
tags: [evolve, unit, topic/{domain}]
evidence:
{evidence_links}
status: candidate
targets:
{targets_yaml}
created: {datetime.now().strftime('%Y-%m-%d')}
---
# {title}

## Action
{action}

## Evidence
{evidence_links if evidence_links else '_(pending evidence links)_'}
"""
    filepath = os.path.join(units_dir, f"{uid}.md")
    with open(filepath, "w") as f:
        f.write(note)
    return uid

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: create-unit.py <title> <action> <confidence> [domain] [scope] [evidence_id...]")
        print("Example: create-unit.py 'Prefer plan-first' 'Create plan.md before impl' 0.72 workflow project obs-001 obs-002")
        sys.exit(1)

    title = sys.argv[1]
    action = sys.argv[2]
    confidence = float(sys.argv[3])
    domain = sys.argv[4] if len(sys.argv) > 4 else "workflow"
    scope = sys.argv[5] if len(sys.argv) > 5 else "project"
    evidence = sys.argv[6:] if len(sys.argv) > 6 else []

    uid = create_unit(title, action, confidence, domain, scope, evidence)
    print(uid)
