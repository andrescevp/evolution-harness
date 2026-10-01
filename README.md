# evolution-harness

**Multi-platform plugin** for [Antigravity CLI (agy)](https://antigravity.google),
[OpenAI Codex](https://developers.openai.com/codex/), [Claude Code](https://docs.anthropic.com/en/docs/claude-code),
and — first-class — [OpenCode V2](https://opencode.ai/v2/docs/build/plugins/) that makes agents
**learn, remember, and evolve** across sessions.

The harness captures session learnings as structured observations, distills them
into confidence-weighted evolution units, clusters them by domain, and generates
synthesis proposals for new or updated skills, agents, and commands. All
evolution notes live in an Obsidian vault (`./docs/evolve/`) and are managed
headless via `notesmd-cli` (with direct file-write fallback when the CLI is
absent).

Extracted from `~/.agents` — the same evolution system for `opencode`,
`claude`, `agy`, and `codex`.

---

## Content (at the repository root)

| Component | Path | Contents |
|---|---|---|
| Skills | `skills/` | `eh-evolve` (observation → unit → cluster → proposal, with bundled `scripts/`), `eh-state-sync`, `eh-run-notesmd-cli` |
| Agents | `agents/` | `eh-observer` (captures sanitized learnings), `eh-evolver` (synthesizes proposals) |
| Commands | `commands/` | `evolve-status`, `evolve-synthesize`, `evolve-promote` |
| OpenCode V2 plugin | `index.ts` (+ `package.json`) | plugin entry at the repo root; registers the skills and commands at runtime |

## Repository layout

```
evolution-harness/             ← the OpenCode V2 plugin package (package.json + index.ts)
├── index.ts                   ← Plugin.define: registers skills + commands at runtime
├── package.json               ← name: evolution-harness, exports "." -> ./index.ts
├── skills/                    ← canonical skills (SKILL.md standard, platform-neutral)
│   ├── eh-evolve/             ← SKILL.md + scripts/ (capture.sh, create-unit.py, synthesize.py) + references/
│   ├── eh-state-sync/
│   └── eh-run-notesmd-cli/
├── agents/                    ← eh-observer.md, eh-evolver.md (OpenCode-format subagents)
├── commands/                  ← evolve-*.md slash commands (OpenCode format)
├── scripts/validate.sh        ← repository validation (layout, content, plugin integrity)
├── scripts/test-plugin.mjs    ← functional smoke test for the plugin (mock ctx)
├── install.sh                 ← detect clients and symlink into conventional dirs
└── AGENTS.md                  ← repo conventions for contributors
```

No generated directories, no per-platform copies, no sub-package: `skills/`,
`agents/`, `commands/`, and the plugin entry (`index.ts`) all live at the
repository root.

---

## Installation

```bash
bash install.sh                # auto-detects opencode / claude / agy / codex
bash install.sh --dry-run      # preview only
bash install.sh --client opencode
```

Everything is installed as **symlinks** into each client's conventional
directories, so edits in this repo apply immediately.

| Platform | What gets installed | Where |
|---|---|---|
| **OpenCode V2** | the repo root as plugin (skills + commands registered at runtime), agents | `~/.config/opencode/plugins/evolution-harness` (symlink to repo) + `~/.config/opencode/agents/` |
| **Claude Code** | skills, agents, commands | `~/.claude/{skills,agents,commands}/` |
| **Antigravity (agy)** | skills, agents, TOML commands | `~/.gemini/{skills,agents,commands}/` |
| **Codex** | skills | `~/.codex/skills/` |

> **Why agents are symlinked for OpenCode**: the V2 plugin API can register
> skills (`ctx.skill.transform`) and commands (`ctx.command.transform`), but the
> agent editor has no `add` — OpenCode agents must ship via the conventional
> `~/.config/opencode/agents/` directory.
>
> **Why agy commands are converted**: Antigravity/Gemini commands are TOML;
> `install.sh` converts `commands/*.md` to `~/.gemini/commands/*.toml`.

Optional: export `EVOLVE_HARNESS_ROOT` so agents resolve the bundled scripts
from any project:

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

Without `notesmd-cli`, the evolve scripts fall back to direct file writes.

---

## Usage

The evolution loop, in any client:

1. **Capture** — after meaningful sessions, ask `eh-observer` to record what worked
   (or run `capture.sh` directly):
   ```bash
   bash scripts/capture.sh "build-agent" "implemented TDD workflow" \
     "Created tests before implementation for feature X" \
     "All tests passed, user confirmed approach was correct"
   ```
2. **Distill** — `eh-evolver` (or `create-unit.py`) turns observations into
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

## OpenCode V2 plugin

The plugin follows the [OpenCode plugin docs](https://opencode.ai/v2/docs/build/plugins/),
with the package at the repository root:

- `package.json` exposes `"." -> ./index.ts`; the only import is
  `@opencode/plugin`.
- `index.ts` defines `Plugin.define({ id: "evolution-harness", setup })`.
- Registers the three skills via `ctx.skill.transform` (frontmatter parsed,
  `path` set to the skill directory so bundled scripts stay resolvable).
- Registers the three commands via `ctx.command.transform`; each command
  executes by prompting the session with the command body.
- Locates the repository root from `$EVOLVE_HARNESS_ROOT`, the plugin
  directory (`index.ts`'s own path), or its parent — whichever holds
  `skills/` + `commands/`.

Develop:

```bash
pnpm install --ignore-scripts  # installs @opencode/plugin + typescript (pnpm 11 / supply-chain policy)
pnpm typecheck                 # tsc --noEmit on index.ts
node scripts/test-plugin.mjs   # functional smoke test (mock ctx)
```

---

## Development

- **Edit content directly at the root** — `skills/`, `agents/`, `commands/`.
  Keep everything platform-neutral: `SKILL.md` frontmatter uses `name` +
  `description`; no client-specific syntax; scripts resolve from the skill
  base dir → `$EVOLVE_HARNESS_ROOT` → legacy `~/.agents` fallback.
- After changes run `bash scripts/validate.sh` (must pass before committing);
  it includes the plugin smoke test (`node scripts/test-plugin.mjs`).
- Agent tool lists match OpenCode format (`mode: subagent`, `tools:` map);
  the installer keeps per-client semantics at the symlink/conversion layer.

## License

MIT — see [LICENSE](LICENSE).