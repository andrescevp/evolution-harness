# evolution-harness

**Multi-platform plugin** for [Antigravity CLI (agy)](https://antigravity.google),
[OpenAI Codex](https://developers.openai.com/codex/), [Claude Code](https://docs.anthropic.com/en/docs/claude-code),
and [OpenCode](https://opencode.ai) that makes agents **learn, remember, and
evolve** across sessions.

The harness captures session learnings as structured observations, distills
them into confidence-weighted evolution units, clusters them by domain, and
generates synthesis proposals for new or updated skills, agents, and commands.
All evolution notes are stored in an Obsidian vault (`./docs/evolve/`) and are
managed headless via `notesmd-cli` (or direct file writes when the CLI is
absent).

Extracted from `~/.agents` — the same evolution system (`evolve`, `state-sync`,
`run-notesmd-cli` skills; `observer`/`evolver` sub-agents; `evolve-*` commands)
that powers the personal agent harness.

---

## Content

### Skills

| Skill | Purpose |
|---|---|
| [`evolve`](core/skills/evolve/SKILL.md) | Full evolution pipeline: observation → unit → cluster → proposal. Bundled scripts: `scripts/capture.sh`, `scripts/create-unit.py`, `scripts/synthesize.py`. |
| [`state-sync`](core/skills/state-sync/SKILL.md) | Sync AGENTS.md, architecture docs, and vault notes after a dev cycle; captures learnings into the evolve system. |
| [`run-notesmd-cli`](core/skills/run-notesmd-cli/SKILL.md) | Headless Obsidian vault management via `notesmd-cli` (create/search/read/update notes, frontmatter, daily notes). |

### Sub-agents

| Agent | Role |
|---|---|
| `observer` | After a task, captures sanitized observations into `./docs/evolve/observations/` |
| `evolver` | Synthesizes observations into units and generates proposals for new/updated artifacts |

### Commands

| Command | Purpose |
|---|---|
| `evolve-status` | Report observations/units/clusters/proposals state, top confidence units, stale units |
| `evolve-synthesize` | Run the synthesis pipeline (cluster units → proposals) |
| `evolve-promote` | Promote project-scoped units to global scope when cross-project evidence exists |

---

## Repository layout

```
evolution-harness/
├── core/                     ← Canonical, platform-neutral content (source of truth)
│   ├── skills/               ← evolve/, state-sync/, run-notesmd-cli/
│   ├── agents/               ← evolver.body.md, observer.body.md + agents.json (frontmatter per platform)
│   └── commands/             ← evolve-*.md (OpenCode format)
├── plugins/                  ← Per-platform packages (generated + committed)
│   ├── agy/                  ← plugin.json · skills/ · agents/ · commands/*.toml
│   ├── codex/                ← plugin.json (Agent Plugins) · skills/
│   ├── claude/               ← .claude-plugin/plugin.json · skills/ · agents/
│   └── opencode/             ← package.json · skills/ · agents/ · commands/
├── .agents/plugins/marketplace.json   ← Codex / ChatGPT marketplace manifest
├── .claude-plugin/marketplace.json    ← Claude Code marketplace manifest
├── scripts/
│   ├── build.sh              ← Assemble plugins/ from core/ (deterministic)
│   └── validate.sh           ← Validate all manifests and components
├── install.sh                ← Auto-detect clients and install
└── AGENTS.md                 ← Repo conventions for contributors
```

---

## Installation

From the repo root:

```bash
bash install.sh                # detects opencode / claude / agy / codex
bash install.sh --dry-run      # preview only
bash install.sh --client claude
```

Per platform:

| Platform | Command |
|---|---|
| **OpenCode** | `bash install.sh --client opencode` — symlinks `skills/`, `agents/`, `commands/` into `~/.config/opencode/` |
| **Claude Code** | `claude plugin marketplace add "$PWD" && claude plugin install evolution-harness@evolution-harness` (manifest: `.claude-plugin/marketplace.json`) |
| **Antigravity (agy)** | `agy plugin install ./plugins/agy` — skills/agents/commands namespaced `/evolution-harness:*` |
| **Codex / ChatGPT** | `codex plugin marketplace add "$PWD" && codex plugin add evolution-harness --marketplace evolution-harness` (manifest: `.agents/plugins/marketplace.json`) |

All three repo marketplaces are committed so the same checkout works as a
Claude marketplace, a Codex marketplace, and a source for agy/OpenCode.

Optional: export `EVOLVE_HARNESS_ROOT` to the repo path so agents can resolve
the bundled scripts from any project:

```bash
export EVOLVE_HARNESS_ROOT="$HOME/workspace/evolution-harness"
```

### Prerequisite for notes

The skills manage the vault headless via `notesmd-cli`:

```bash
# Arch:      yay -S notesmd-cli-bin
# Homebrew:  brew install yakitrak/yakitrak/notesmd-cli
notesmd-cli add-vault /path/to/vault --set-default   # optional, headless setup
```

Without `notesmd-cli`, the evolve scripts fall back to direct file writes —
works everywhere.

---

## Usage

The evolution loop, in any client:

1. **Capture** — after meaningful sessions, ask `observer` to record what worked
   (or run `capture.sh` directly):
   ```bash
   bash scripts/capture.sh "build-agent" "implemented TDD workflow" \
     "Created tests before implementation for feature X" \
     "All tests passed, user confirmed approach was correct"
   ```
2. **Distill** — `evolver` (or `create-unit.py`) turns observations into
   confidence-weighted units (`0.3` tentative → `0.9` certain).
3. **Synthesize** — `/evolve-synthesize` clusters units by domain and generates
   proposals in `./docs/evolve/proposals/`.
4. **Review & apply** — only high-confidence proposals (≥ 0.7) become new
   skills, agents, or commands — always after review.
5. **Promote** — `/evolve-promote` moves project units to global scope once
   evidence exists in 2+ contexts.

Notes live in `./docs/evolve/{observations,units,clusters,proposals}/`
(project-relative vault; override with `OBSIDIAN_VAULT`).

---

## Development

- **Source of truth is `core/`.** Edit skills/agents/commands there — keep them
  platform-neutral (no `~/.agents` or client-specific paths; scripts are
  resolved from the skill base dir, `$EVOLVE_HARNESS_ROOT`, or legacy
  `~/.agents` fallback).
- After changing `core/`, regenerate every plugin and validate:
  ```bash
  bash scripts/build.sh
  bash scripts/validate.sh
  ```
- Manifests (`plugins/*/plugin.json`), plugin READMEs, `install.sh`, and
  `scripts/` are hand-authored and never overwritten by `build.sh`.
- Per-agent frontmatter (tools lists per platform) lives in
  `core/agents/agents.json`.

Generated artifacts are committed so the repo works out of the box — rebuild
only when `core/` changes.

## License

MIT — see [LICENSE](LICENSE).