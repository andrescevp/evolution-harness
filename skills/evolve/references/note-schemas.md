# Note Schemas

## Vault Directory Structure

All evolve notes live under `./docs/evolve/` (relative to project root):

```
docs/
  evolve/
    observations/    ← Raw session observations (capture.sh)
    units/           ← Distilled evolution units (create-unit.py)
    clusters/        ← Grouped units by domain (synthesize.py)
    proposals/       ← Generated synthesis proposals (synthesize.py)
```

---

## Observation Schema

Created by `scripts/capture.sh`. One observation per meaningful session event.

```yaml
---
kind: observation
id: obs-20260528-143022-123       # {date}-{time}-{random}
agent: senior-engineer             # agent that performed the action
action: implemented-tdd-workflow   # short action description
date: 2026-05-28                   # creation date
timestamp: 2026-05-28T14:30:22     # ISO-8601 timestamp
project_location: "/home/user/project"  # auto-detected project root
tags: [evolve, observation, topic/tdd-workflow]  # topic derived from action
outcome: "All tests passed"        # sanitized outcome description
---
```

### Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `kind` | yes | Always `observation` |
| `id` | yes | Unique ID: `obs-{YYYYMMDD}-{HHMMSS}-{random3}` |
| `agent` | yes | Name of the agent that generated the observation |
| `action` | yes | Short slug-safe description of what happened |
| `date` | yes | Date in `YYYY-MM-DD` format |
| `timestamp` | yes | ISO-8601 full timestamp |
| `project_location` | yes | Absolute path to project root (auto-detected) |
| `tags` | yes | `[evolve, observation, topic/<slug>]` |
| `outcome` | yes | Sanitized outcome or result |

---

## Evolution Unit Schema

Created by `scripts/create-unit.py`. A distilled, confidence-weighted pattern extracted from one or more observations.

```yaml
---
kind: evolve-unit
id: evu-20260528-a1b2c3            # {evu}-{date}-{random6}
title: Prefer TDD workflow
confidence: 0.72                    # 0.3=tentative, 0.9=certain
scope: project                      # project | global
domain: testing                     # workflow, code-style, testing, git, debugging, docs
client: opencode                    # client where pattern was observed
source: session-observation         # how this unit was created
project_location: "/home/user/project"
tags: [evolve, unit, topic/testing]
evidence:                           # observation IDs that support this unit
  - obs-20260528-143022-123
  - obs-20260528-103011-456
status: candidate                   # candidate | active | deprecated | promoted
targets:                            # what should be created if promoted
  - skill
created: 2026-05-28
---
```

### Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `kind` | yes | Always `evolve-unit` |
| `id` | yes | Unique ID: `evu-{YYYYMMDD}-{hex6}` |
| `confidence` | yes | Float 0.0–1.0 (see confidence model in SKILL.md) |
| `scope` | yes | `project` or `global` |
| `domain` | yes | Domain category: `workflow`, `code-style`, `testing`, `git`, `debugging`, `docs` |
| `client` | yes | Client identifier (e.g., `opencode`, `copilot`, `antigravity`) |
| `source` | yes | How the unit was created: `session-observation`, `manual`, `import` |
| `project_location` | yes | Absolute path to project root |
| `tags` | yes | `[evolve, unit, topic/<domain>]` |
| `evidence` | no | List of observation IDs supporting this unit |
| `status` | yes | `candidate` (default), `active`, `deprecated`, `promoted` |
| `targets` | no | Artifact types to generate on promotion: `skill`, `agent`, `command` |
| `created` | yes | Date in `YYYY-MM-DD` format |

---

## Synthesis Proposal Schema

Created by `scripts/synthesize.py`. Groups related units and suggests concrete artifacts.

```yaml
---
kind: synthesis-proposal
id: prop-20260528-testing          # {prop}-{date}-{domain}
cluster: testing                    # domain name used for clustering
unit_count: 3                       # number of units in the cluster
avg_confidence: 0.78                # average confidence across units
status: proposed                    # proposed | accepted | rejected | implemented
date: 2026-05-28                    # creation date
project_location: "/home/user/project"
tags: [evolve, proposal, topic/testing]
---
```

### Field reference

| Field | Required | Description |
|-------|----------|-------------|
| `kind` | yes | Always `synthesis-proposal` |
| `id` | yes | Unique ID: `prop-{YYYYMMDD}-{domain}` |
| `cluster` | yes | Domain name used for clustering |
| `unit_count` | yes | Number of units in the cluster |
| `avg_confidence` | yes | Average confidence across cluster units |
| `status` | yes | `proposed` (default), `accepted`, `rejected`, `implemented` |
| `date` | yes | Date in `YYYY-MM-DD` format |
| `project_location` | yes | Absolute path to project root |
| `tags` | yes | `[evolve, proposal, topic/<domain>]` |
