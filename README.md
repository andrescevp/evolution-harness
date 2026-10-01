# evolution-harness

**An OpenCode V2 plugin that makes your agent learn, remember, and evolve across sessions.**

The harness captures what worked (and what didn't) during your sessions, stores it
as structured notes in an Obsidian vault (`./docs/evolve/`), distills them into
confidence-weighted evolution units, and synthesizes proposals that improve the
harness itself — new or updated skills, agents, and commands.

Everything ships as a single OpenCode V2 plugin package: **skills**, **agents**,
and **commands** at the repository root, registered by `index.ts` at runtime.
The same content can also be installed into Claude Code, Antigravity CLI, and
Codex (see [Additional clients](#additional-clients)).

Published at **github.com/andrescevp/evolution-harness** · tag **v1.0.0**.

---

## The harness at a glance

| Component | Name | What it does |
|---|---|---|
| Skill | `eh-evolve` | Full evolution pipeline: observation → unit → cluster → proposal. Bundled scripts: `capture.sh`, `create-unit.py`, `synthesize.py` |
| Skill | `eh-state-sync` | Syncs `AGENTS.md`, architecture docs, and vault notes after a dev cycle; feeds learnings into the pipeline |
| Skill | `eh-run-notesmd-cli` | Manages the evolution vault headless via `notesmd-cli` (no Obsidian GUI needed) |
| Agent | `eh-observer` | After a task, captures sanitized observations into `./docs/evolve/observations/` |
| Agent | `eh-evolver` | Turns observations into units and generates proposals for new/updated artifacts |
| Command | `/evolve-status` | Reports observations/units/clusters/proposals state, top confidence units, stale units |
| Command | `/evolve-synthesize` | Runs the synthesis pipeline (cluster units → proposals) |
| Command | `/evolve-promote` | Promotes project-scoped units to global scope when cross-project evidence exists |

## Repository layout

```
evolution-harness/             ← the OpenCode V2 plugin package
├── index.ts                   ← Plugin.define: registers skills + commands at runtime
├── package.json               ← name: evolution-harness, exports "." -> ./index.ts
├── skills/                    ← canonical SKILL.md skills (platform-neutral standard)
│   ├── eh-evolve/             ← SKILL.md + scripts/ + references/
│   ├── eh-state-sync/
│   └── eh-run-notesmd-cli/
├── agents/                    ← eh-observer.md, eh-evolver.md (OpenCode agent format)
├── commands/                  ← evolve-*.md (OpenCode slash-command format)
├── scripts/validate.sh        ← repository validation (layout, content, plugin integrity)
├── scripts/test-plugin.mjs    ← functional smoke test for the plugin (mock ctx)
├── install.sh                 ← installs the same content into other clients (optional)
└── AGENTS.md                  ← repo conventions for contributors
```

No build step, no generated directories, no copies: the plugin, skills, agents,
and commands live at the repository root and are consumed from there.

---

## Installation (OpenCode V2)

A **git clone** of the published repository goes directly into OpenCode's plugin
folder — the plugin, skills, and commands are served from it:

```bash
git clone git@github.com:andrescevp/evolution-harness.git \
  ~/.config/opencode/plugins/evolution-harness
cd ~/.config/opencode/plugins/evolution-harness
pnpm install --ignore-scripts      # installs @opencode/plugin (see note)
ln -sfn "$PWD/agents/eh-evolver.md" ~/.config/opencode/agents/eh-evolver.md
ln -sfn "$PWD/agents/eh-observer.md" ~/.config/opencode/agents/eh-observer.md
```

**Restart OpenCode.** Plugins load at startup and agents are read at server
start, so the harness only appears in a new session.

Dev mode (live edits, no clone): `bash install.sh --client opencode` symlinks
the repo root into the plugin folder instead.

> **Why agents are symlinked and not registered by the plugin**: the V2 plugin
> API can register skills (`ctx.skill.transform`) and commands
> (`ctx.command.transform`) but the agent editor has no `add` — OpenCode agents
> must ship via the conventional `~/.config/opencode/agents/` directory. Agent
> files also require a `model` frontmatter or the loader drops them, which is
> why `eh-evolver`/`eh-observer` carry `model: opencode-go/deepseek-v4-flash`
> (adjust to your provider of choice).

Optional — let agents resolve the bundled scripts from any project:

```bash
export EVOLVE_HARNESS_ROOT="$HOME/.config/opencode/plugins/evolution-harness"
```

### Prerequisite for notes

The harness manages the vault headless via `notesmd-cli`:

```bash
# Arch:      yay -S notesmd-cli-bin
# Homebrew:  brew install yakitrak/yakitrak/notesmd-cli
notesmd-cli add-vault /path/to/vault --set-default   # optional, headless setup
```

Without `notesmd-cli`, the evolve scripts fall back to direct file writes —
everything still works.

---

## Usage in OpenCode

The evolution loop:

1. **Capture** — after a meaningful session, ask `@eh-observer` to record what
   worked (or run the skill's script directly):
   ```bash
   bash scripts/capture.sh "build-agent" "implemented TDD workflow" \
     "Created tests before implementation for feature X" \
     "All tests passed, user confirmed approach was correct"
   ```
2. **Distill** — `@eh-evolver` (or `create-unit.py`) turns observations into
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

## How the plugin works

Per the [OpenCode plugin docs](https://opencode.ai/v2/docs/build/plugins/):

- `package.json` exposes `"." -> ./index.ts`; the only runtime import is
  `@opencode/plugin`.
- `index.ts` defines `Plugin.define({ id: "evolution-harness", setup })`.
- **Skills** → `ctx.skill.transform`: frontmatter parsed from each
  `skills/*/SKILL.md`, `path` set to the skill directory so bundled scripts and
  references stay resolvable.
- **Commands** → `ctx.command.transform`: each `commands/*.md` becomes a slash
  command whose `execute` prompts the session with the command body.
- The repository root is located from `$EVOLVE_HARNESS_ROOT`, the plugin
  directory (`index.ts`'s own path), or its parent — whichever holds
  `skills/` + `commands/` — so the plugin works identically from a clone or a
  symlink.

---

## Additional clients

The same root content installs into other agent CLIs via `install.sh`
(auto-detects installed CLIs, or target one with `--client`):

| Platform | Installed | Location |
|---|---|---|
| **Claude Code** | skills, agents (model stripped), commands | `~/.claude/{skills,agents,commands}/` |
| **Antigravity (agy)** | skills, agents (model stripped), TOML commands | `~/.gemini/{skills,agents,commands}/` |
| **Codex** | skills | `~/.codex/skills/` |

Claude/Antigravity receive copies with the OpenCode-specific `model`/`variant`
lines stripped so their own model defaults apply; Antigravity commands are
converted to TOML (`~/.gemini/commands/*.toml`). Stale symlinks from previous
installs are cleaned up automatically.

---

## Development & release workflow

1. **Develop in a working copy** (e.g. `~/workspace/evolution-harness`): edit
   `skills/`, `agents/`, `commands/`, or `index.ts` directly.
2. **Validate** before committing:
   ```bash
   bash scripts/validate.sh        # layout, content, frontmatter, plugin smoke test
   pnpm typecheck                  # tsc --noEmit (after pnpm install --ignore-scripts)
   node scripts/test-plugin.mjs    # functional smoke test (mock ctx)
   ```
3. **Push & release**:
   ```bash
   git push origin main
   git tag vX.Y.Z && git push origin vX.Y.Z
   gh release create vX.Y.Z --title "vX.Y.Z" --notes "…"   # optional, needs gh auth
   ```
4. **Update the installed clone**:
   ```bash
   git -C ~/.config/opencode/plugins/evolution-harness pull
   # or re-clone for a truly fresh install
   ```

> **Deps note**: `pnpm install --ignore-scripts` is required because pnpm 11
> blocks dependency build scripts by default (supply-chain policy); nothing in
> this package needs them. `@opencode/plugin` is pinned to `2.0.20`.

## Naming conventions

- All skills and agents in this repository are prefixed `eh-`
  (`eh-evolve`, `eh-state-sync`, `eh-run-notesmd-cli`, `eh-evolver`,
  `eh-observer`); commands keep bare `evolve-*` names.
- The upstream `~/.agents` harness keeps its **un-prefixed** names (`evolve`,
  `state-sync`, `run-notesmd-cli`, `evolver`, `observer`) — never rename or
  prefix content there. Legacy script-resolution fallbacks in this repo point
  at `~/.agents/skills/evolve/scripts/...` unchanged.

## License

MIT — see [LICENSE](LICENSE).