#!/usr/bin/env python3
# /// script
# dependencies = []
# requires-python = ">=3.10"
# ///
"""Cluster evolution units and generate synthesis proposals."""
import os, sys, glob, subprocess
from datetime import datetime
from collections import defaultdict

MIN_CONFIDENCE = float(os.environ.get("EVOLVE_MIN_CONFIDENCE", "0.5"))
MIN_CLUSTER_SIZE = int(os.environ.get("EVOLVE_MIN_CLUSTER", "2"))

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

def parse_frontmatter(content: str) -> dict:
    parts = content.split("---")
    if len(parts) < 3:
        return {}
    fm = {}
    for line in parts[1].strip().split("\n"):
        line = line.strip()
        if ":" in line:
            k, v = line.split(":", 1)
            fm[k.strip()] = v.strip()
    return fm

def load_units(units_dir):
    units = []
    for f in glob.glob(os.path.join(units_dir, "*.md")):
        with open(f) as fh:
            content = fh.read()
        fm = parse_frontmatter(content)
        if fm.get("status") == "candidate" and float(fm.get("confidence", 0)) >= MIN_CONFIDENCE:
            units.append({"file": f, "fm": fm, "content": content})
    return units

def cluster_by_domain(units):
    clusters = defaultdict(list)
    for u in units:
        domain = u["fm"].get("domain", "general")
        clusters[domain].append(u)
    return {k: v for k, v in clusters.items() if len(v) >= MIN_CLUSTER_SIZE}

def generate_proposal(cluster_name, cluster_units, proposals_dir, project_location: str = None):
    os.makedirs(proposals_dir, exist_ok=True)
    pid = f"prop-{datetime.now().strftime('%Y%m%d')}-{cluster_name}"
    avg_conf = sum(float(u["fm"].get("confidence", 0)) for u in cluster_units) / len(cluster_units)
    unit_links = "\n".join(f"- [[{u['fm'].get('id', 'unknown')}]]" for u in cluster_units)
    project_loc = project_location if project_location else detect_project_location()

    proposal = f"""---
kind: synthesis-proposal
id: {pid}
cluster: {cluster_name}
unit_count: {len(cluster_units)}
avg_confidence: {avg_conf:.2f}
status: proposed
date: {datetime.now().strftime('%Y-%m-%d')}
project_location: "{project_loc}"
tags: [evolve, proposal, topic/{cluster_name}]
---
# Synthesis Proposal: {cluster_name}

## Source Units
{unit_links}

## Summary
{len(cluster_units)} evolution units in domain "{cluster_name}" with average confidence {avg_conf:.2f}.

## Suggested Artifacts
"""
    if cluster_name in ("workflow", "git", "testing"):
        proposal += "- **Command**: /evolve-synthesize could trigger automated clustering\n"
    if cluster_name in ("code-style", "documentation", "testing"):
        proposal += f"- **Skill**: New skill for {cluster_name} conventions\n"

    filepath = os.path.join(proposals_dir, f"{pid}.md")
    with open(filepath, "w") as f:
        f.write(proposal)
    return pid

if __name__ == "__main__":
    vault = get_vault()
    units_dir = os.path.join(vault, "evolve", "units")
    proposals_dir = os.path.join(vault, "evolve", "proposals")

    if not os.path.isdir(units_dir):
        print(f"Units directory not found: {units_dir}")
        sys.exit(0)

    units = load_units(units_dir)
    if not units:
        print("No candidate units found with sufficient confidence.")
        sys.exit(0)

    clusters = cluster_by_domain(units)
    if not clusters:
        print(f"No clusters found (need >= {MIN_CLUSTER_SIZE} units per domain).")
        sys.exit(0)

    print(f"Found {len(units)} candidate units in {len(clusters)} clusters:\n")
    for domain, cluster_units in sorted(clusters.items()):
        pid = generate_proposal(domain, cluster_units, proposals_dir)
        print(f"  {domain}: {len(cluster_units)} units (avg confidence: {sum(float(u['fm'].get('confidence',0)) for u in cluster_units)/len(cluster_units):.2f}) -> {pid}")

    print(f"\nProposals saved to {proposals_dir}/")
