---
name: eh-evolve
description: >
  Use this skill when an agent needs to capture learnings, reflect on sessions,
  evolve its behavior, or improve the repository's skills/agents/commands based
  on observed patterns — capture sanitized session observations into Obsidian
  notes with structured frontmatter, distill them into confidence-weighted
  evolution units, cluster related units by domain into synthesis proposals,
  and promote project-scoped patterns to global scope when validated across
  contexts. Trigger on "evolve", "learn from this", "capture this",
  "create an instinct", "synthesize learnings", "promote pattern", or when the
  agent completes a task and should record what worked — also reactively after
  resolving errors, discovering better workflows, or receiving user
  corrections. Notes are stored in `./docs/evolve/` (project-relative vault).
license: MIT
compatibility: opencode, copilot, antigravity
allowed-tools: bash, read, write, edit
metadata:
  audience: agents
  workflow: self-evolution
---

## The Evolution Model

### Observation → Unit → Cluster → Proposal

```
Session activity → capture.ts → observations/*.md
observations/    → create-unit.ts → units/*.md (confidence-weighted)
units/           → synthesize.ts → clusters/ + proposals/
proposals/       → agent review → new/updated skills, agents, commands
```

> The pipeline is written in TypeScript and compiled to `dist/scripts/*.js`.
> Run the compiled JavaScript. On a fresh checkout build once from the
> repository root: `pnpm install --ignore-scripts && pnpm build`.

### Evolution Units

Atomic learned behaviors with frontmatter:

```yaml
kind: evolve-unit
id: evu-20260528-a1b2c3
confidence: 0.72        # 0.3=tentative, 0.9=certain
scope: project           # project | global
domain: workflow         # workflow, code-style, testing, git, debugging, docs
client: opencode
status: candidate        # candidate | active | deprecated | promoted
project_location: "/home/user/my-project"   # auto-detected, env-overridable
tags: [evolve, unit, topic/workflow]        # topic derived from domain
```

### Confidence Model

| Level | Range | Meaning |
|-------|-------|---------|
| Low | 0.3-0.5 | Single observation, needs more evidence |
| Medium | 0.5-0.7 | Multiple observations, consistent pattern |
| High | 0.7-0.9 | Strong evidence, user confirmed |
| Certain | 0.9-1.0 | Explicit user instruction or rule |

### Scope and Promotion

- **project**: Applies to current project/context only
- **global**: Applies across all projects (promoted after evidence in 2+ contexts)

### Tag Scheme

All evolve notes include a `tags` field in the frontmatter for correlation and search:

| Note type | Tag format | Topic source | Example |
|-----------|-----------|-------------|---------|
| Observation | `[evolve, observation, topic/<slug>]` | Action (slug-safe) | `topic/implemented-tdd-workflow` |
| Unit | `[evolve, unit, topic/<domain>]` | Domain field | `topic/testing` |
| Proposal | `[evolve, proposal, topic/<cluster>]` | Cluster name | `topic/synthesis-test` |

Tags use a simple YAML list format for easy parsing and Obsidian Dataview compatibility.

## Workflow

### 1. Capture observation

After a meaningful session event:

```bash
# run from the eh-evolve skill directory
node dist/scripts/capture.js "build-agent" "implemented TDD workflow" \
  "Created tests before implementation for feature X" \
  "All tests passed, user confirmed approach was correct"
```

### 2. Create evolution unit

When patterns emerge from observations:

```bash
node dist/scripts/create-unit.js "Prefer TDD workflow" \
  "Always create tests before implementation" \
  0.85 "testing" "global" "obs-20260528-001" "obs-20260528-002"
```

### 3. Synthesize proposals

When enough units exist in a domain:

```bash
node dist/scripts/synthesize.js
```

### 4. Review and apply

Review generated proposals in `./docs/evolve/proposals/`. Apply manually or with agent assistance.

## Gotchas

- **notesmd-cli does not require Obsidian running** — the eh-run-notesmd-cli skill works headless. Scripts write directly to vault files as fallback if notesmd-cli is unavailable.
- **Secrets are sanitized** by `capture.ts` (tokens, passwords, API keys redacted)
- **Confidence decays** if a unit is never reinforced; review stale units periodically
- **Scope defaults to project** — promote explicitly when pattern is cross-project
- **Vault path** defaults to `{project_root}/docs/` (auto-detected by scripts); override with `OBSIDIAN_VAULT` env var
- **Project location** is auto-detected in all three scripts (`capture.ts`, `create-unit.ts`, `synthesize.ts`) and stored in the `project_location` frontmatter field. Detection order: `EVOLVE_PROJECT_LOCATION` env var → `git rev-parse --show-toplevel` → `$PWD`. Override by setting `EVOLVE_PROJECT_LOCATION` in the environment.
- **Build before use** — the scripts are TypeScript sources; run the compiled `dist/scripts/*.js` output. `pnpm build` must run after a fresh clone or after editing `scripts/**/*.ts`. Tests run with Node's built-in runner: `node --test dist/evals/*.test.js`.

## Reference triggers

| Reference | When to use | File |
|-----------|-------------|------|
| Note schemas | Creating observation or unit notes and need exact field definitions | `references/note-schemas.md` |
| ECC adaptation | Understanding the ECC-to-Obsidian mapping and design decisions | `references/ecc-adaptation.md` |

## Available scripts

TypeScript sources live in `scripts/`; run the compiled output in `dist/scripts/`.

- `scripts/capture.ts` → `dist/scripts/capture.js` — Record a sanitized observation. Usage: `node dist/scripts/capture.js <agent> <action> <context> <outcome>`
- `scripts/create-unit.ts` → `dist/scripts/create-unit.js` — Create an evolution unit. Usage: `node dist/scripts/create-unit.js <title> <action> <confidence> [domain] [scope] [evidence...]`
- `scripts/synthesize.ts` → `dist/scripts/synthesize.js` — Cluster units and generate proposals. Usage: `node dist/scripts/synthesize.js`

Shared modules live in `scripts/lib/` (paths, sanitization, frontmatter parsing, note builders).

## Verification

- [ ] Vault at `./docs/evolve/` exists with subfolders
- [ ] `pnpm build` compiles `scripts/**/*.ts` and `evals/**/*.ts` into `dist/`
- [ ] `node --test dist/evals/*.test.js` passes
- [ ] `capture.ts` creates valid observation notes with sanitized content
- [ ] `create-unit.ts` produces valid frontmatter with all required fields
- [ ] `synthesize.ts` clusters units and generates proposals
- [ ] All scripts exit cleanly with helpful error messages on invalid input
