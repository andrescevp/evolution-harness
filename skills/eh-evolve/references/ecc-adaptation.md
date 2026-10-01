# ECC-to-Evolve Adaptation

## Background

ECC (Evolutionary Cognitive Cycle) was the predecessor to the current `eh-evolve` skill. It used a different note structure, tag scheme, and pipeline. This document maps ECC concepts to the current evolve system for migration and reference.

## Concept Mapping

| ECC Concept | Evolve Equivalent | Notes |
|---|---|---|
| `instinct` | `evolve-unit` | Atomic learned pattern with confidence weighting |
| `observation` | `observation` | Same concept, updated frontmatter schema |
| `synthesis` | `synthesis-proposal` | Clustered units → actionable proposal |
| `ecc_*.md` files | `evolve/<type>/<id>.md` | Flat `ecc_*` prefix replaced by subdirectory organization |
| `confidence` 0–100 | `confidence` 0.0–1.0 | Scaled from integer percentage to float |
| Global-only scope | `scope: project \| global` | Added project-level scope; global requires promotion |
| Manual promotion | `synthesize.py` pipeline | Automated clustering replaces manual review |

## Directory Structure Migration

```
## ECC (old)                         ## Evolve (new)
~/MyVault/                           ./docs/
  ecc_observations/                    evolve/
  ecc_instincts/                         observations/
  ecc_synthesis/                          units/
                                          clusters/
                                          proposals/
```

## Frontmatter Migration

### Observation (ECC → Evolve)

```yaml
# ECC (old)
---
kind: ecc_observation
id: obs_001
agent: senior-engineer
action: implemented feature
confidence: 85
---
```

```yaml
# Evolve (new)
---
kind: observation
id: obs-20260528-143022-123
agent: senior-engineer
action: implemented-feature
date: 2026-05-28
timestamp: 2026-05-28T14:30:22
project_location: "/home/user/project"
tags: [evolve, observation, topic/implemented-feature]
outcome: ""
---
```

### Instinct/Unit (ECC → Evolve)

```yaml
# ECC (old)
---
kind: ecc_instinct
id: inst_001
title: Prefer TDD
confidence: 85
domain: workflow
---
```

```yaml
# Evolve (new)
---
kind: evolve-unit
id: evu-20260528-a1b2c3
confidence: 0.85
scope: project
domain: workflow
client: opencode
source: session-observation
project_location: "/home/user/project"
tags: [evolve, unit, topic/workflow]
evidence: []
status: candidate
targets: [skill]
created: 2026-05-28
---
```

## Key Design Decisions

1. **Project-relative vault** — ECC used `~/MyVault/` (global). Evolve uses `./docs/` (project-relative), making learnings portable with the project.
2. **Confidence as float** — Enables finer granularity and easier math for clustering averages.
3. **Scope levels** — Patterns start as `project` and require cross-context evidence to promote to `global`, preventing premature generalization.
4. **Tags for Dataview** — Structured `[evolve, type, topic/<slug>]` tags enable Obsidian Dataview queries across all note types.
5. **Automated synthesis** — `synthesize.py` replaces manual review for initial clustering; human review only for the final proposal.

## Migration Script

To migrate existing ECC notes from `~/MyVault/ecc_*` to `./docs/evolve/*`:

```bash
# This is a manual process — review each file after migration
ECC_SRC="$HOME/MyVault"
EVO_DST="./docs/evolve"

# Migrate observations
for f in "$ECC_SRC"/ecc_observations/*.md; do
  [ -f "$f" ] || continue
  # Read, transform frontmatter, write to new location
  echo "Manual review needed: $f → $EVO_DST/observations/"
done
```

> **Note:** Automatic migration is not provided because frontmatter schemas differ significantly. Manual review ensures no data loss and proper re-classification.
