# evolution-harness

**Multi-platform plugin** for [OpenCode V2](https://opencode.ai/v2/docs/build/plugins/) (first-class),
[Antigravity CLI (agy)](https://antigravity.google), [OpenAI Codex](https://developers.openai.com/codex/),
and [Claude Code](https://docs.anthropic.com/en/docs/claude-code) that makes agents
**learn, remember, and evolve** across sessions.

The harness captures session learnings as structured observations, distills them
into confidence-weighted evolution units, clusters them by domain, and generates
synthesis proposals for new or updated skills, agents, and commands. All
evolution notes live in an Obsidian vault (`./docs/evolve/`) and are managed
headless via `notesmd-cli` (with direct file-write fallback when the CLI is
absent).

Published at **github.com/andrescevp/evolution-harness** · current release **v1.0.0**.

---

## Content

| Component | Path | Contents |
|---|---|---|
| Skills | `skills/` | `eh-evolve` (observation → unit → cluster → proposal, with bundled `scripts/`), `eh-state-sync`, `eh-run-notesmd-cli` |
| Agents | `agents/` | `eh-observer` (captures sanitized learnings), `eh-evolver` (synthesizes proposals). OpenCode-format frontmatter incl. `model: opencode-go/deepseek-v4-flash` — **required** by the OpenCode agent loader; `install.sh` strips the model lines when installing for Claude Code / Antigravity |
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
├── install.sh                 ← detect clients and install into conventional dirs
└── AGENTS.md                  ← repo conventions for contributors
```

No generated directories, no per-platform copies, no sub-package: `skills/`,
`agents/`, `commands/`, and the plugin entry (`index.ts`) all live at the
repository root.

---

## Installation

### OpenCode V2 (primary — hard clone)

A **git clone** of the published repository lives directly in the plugin folder;
the plugin, skills, and commands are served from it:

```bash
git clone git@github.com:andrescevp/evolution-harness.git \
  ~/.config/opencode/plugins/evolution-harness
cd ~/.config/opencode/plugins/evolution-harness
pnpm install --ignore-scripts      # installs @opencode/plugin (see deps note below)
ln -sfn "$PWD/agents/eh-evolver.md" ~/.config/opencode/agents/eh-evolver.md
ln -sfn "$PWD/agents/eh-observer.md" ~/.config/opencode/agents/eh-observer.md
```

**Restart OpenCode** — plugins load at startup and agents are read at server
start, so they only appear in new sessions.

Dev-mode alternative (live edits without cloning): `bash install.sh --client opencode`
symlinks the repo root into the plugin folder instead.

### Claude Code · Antigravity (agy) · Codex

`install.sh` auto-detects the installed CLIs and installs the harness:

```bash
bash install.sh                # auto-detects opencode / claude / agy / codex
bash install.sh --dry-run      # preview only
bash install.sh --client claude
```

| Platform | What gets installed | Where |
|---|---|---|
| **OpenCode (dev mode)** | repo root as plugin (skills + commands at runtime), agents | `~/.config/opencode/plugins/evolution-harness` (symlink) + `~/.config/opencode/agents/` |
| **Claude Code** | skills, agents (model stripped), commands | `~/.claude/{skills,agents,commands}/` |
| **Antigravity (agy)** | skills, agents (model stripped), TOML commands | `~/.gemini/{skills,agents,commands}/` |
| **Codex** | skills | `~/.codex/skills/` |

> **Why agents are symlinked for OpenCode**: the V2 plugin API can register
> skills (`ctx.skill.transform`) and commands (`ctx.command.transform`), but the
> agent editor has no `add` — OpenCode agents must ship via the conventional
> `~/.config/opencode/agents/` directory. Agent files need a `model` frontmatter
> or the loader drops them (that's why `eh-evolver`/`eh-observer` carry
> `model: opencode-go/deepseek-v4-flash`); `install.sh` strips it for
> Claude/Antigravity copies so their own model defaults apply.
>
> **Why agy commands are converted**: Antigravity/Gemini commands are TOML;
> `install.sh` converts `commands/*.md` to `~/.gemini/commands/*.toml`.
>
> **Deps note**: `pnpm install --ignore-scripts` is used because pnpm 11 blocks
> dependency build scripts by default (supply-chain policy); nothing in this
> package needs them. `@opencode/plugin` is pinned to `2.0.20` (policy-safe).

Optional — let agents resolve the bundled scripts from any project:

```bash
export EVOLVE_HARNESS_ROOT="$HOME/.config/opencode/plugins/evolution-harness"
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

- `package.json` exposes `"." -> ./index.ts`; the only runtime import is
  `@opencode/plugin`.
- `index.ts` defines `Plugin.define({ id: "evolution-harness", setup })`.
- Registers the three skills via `ctx.skill.transform` (frontmatter parsed,
  `path` set to the skill directory so bundled scripts stay resolvable).
- Registers the three commands via `ctx.command.transform`; each command
  executes by prompting the session with the command body.
- Locates the repository root from `$EVOLVE_HARNESS_ROOT`, the plugin
  directory (`index.ts`'s own path), or its parent — whichever holds
  `skills/` + `commands/` (works identically from a clone or symlink).

---

## Development & release workflow

1. **Develop in a working copy** (e.g. `~/workspace/evolution-harness`):
   edit `skills/`, `agents/`, `commands/`, or `index.ts` directly.
2. **Validate** before committing:
   ```bash
   bash scripts/validate.sh        # layout, content, frontmatter, plugin smoke test
   pnpm typecheck                  # tsc --noEmit on index.ts (after pnpm install --ignore-scripts)
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