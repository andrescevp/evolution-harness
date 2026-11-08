# AGENTS.md — evolution-harness repository conventions

This repository packages the **evolution harness** (from `~/.agents`) as a
multi-platform plugin for agy (Antigravity), codex, claude, and opencode —
with the OpenCode V2 plugin at the repository root (`index.ts` + `package.json`)
as the first-class surface.

## Layout & invariants

- `index.ts` + `package.json` — the OpenCode V2 plugin package at the repo
  root. `package.json` exposes `"." -> ./index.ts`; the only runtime
  dependency is `@opencode/plugin`. Do not move the plugin into a subfolder.
- `skills/<slug>/` — canonical SKILL.md skills (SKILL.md + bundled `scripts/`
  + `references/`). Platform-neutral; shared by every client.
  `skills/eh-evolve/scripts/` holds TypeScript sources and `evals/` holds
  `node:test` suites; both compile to `skills/eh-evolve/dist/` (gitignored).
  Agents run the compiled `dist/scripts/*.js`, never the `.ts` sources.
  **Convention: all skill and agent names are prefixed with `eh-`**
  (`eh-evolve`, `eh-state-sync`, `eh-run-notesmd-cli`, `eh-evolver`,
  `eh-observer`). New evolution-harness skills/agents must follow the prefix;
  commands keep the bare `evolve-*` naming.
- **The upstream `~/.agents` harness keeps its un-prefixed names**
  (`evolve`, `state-sync`, `run-notesmd-cli`, `evolver`, `observer`) — never
  rename, prefix, or symlink content there. This repo's `eh-` prefix applies
  only to its own files; legacy fallback references to
  `~/.agents/skills/evolve/scripts/...` must stay pointing at the original
  un-prefixed paths.
- `agents/<name>.md` — OpenCode-format subagents (`mode: subagent`,
  `tools:` map) with `eh-` prefixed names and `model`/`variant` frontmatter
  (OpenCode's agent loader requires a model). Installed by `install.sh` into
  each platform's conventional agent directory: OpenCode gets the full file
  (symlink), Claude Code and Antigravity get copies with the model lines
  stripped. OpenCode agents cannot be registered via the V2 plugin API.
- `commands/<name>.md` — OpenCode-format slash commands. Registered for
  OpenCode by the plugin; converted to TOML for agy by `install.sh`.
- No generated directories or sub-packages (`core/`, `plugins/`,
  `opencode-plugin/`, marketplaces) — content at the root IS the plugin.
  The only generated directory is `skills/eh-evolve/dist/` (compiled skill
  pipeline, gitignored). Do not reintroduce per-platform copies.
- `install.sh` builds the skill pipeline, then creates symlinks (plus agy TOML
  conversion) — no copies.

## Workflow

1. Edit content in `skills/`, `agents/`, or `commands/` directly.
2. Run `bash scripts/validate.sh` — must pass before committing.
3. Plugin code changes: `pnpm typecheck` (after `pnpm install --ignore-scripts`
   on fresh clones — pnpm 11 blocks dependency build scripts locally).
4. Skill pipeline changes: `pnpm build` then `pnpm test` (build + compiled
   `node:test` evals). The `dist/` output is never committed.

## Content rules

- Skills stay platform-neutral: `SKILL.md` frontmatter uses `name` and
  `description`; body avoids client-specific syntax.
- Skill pipeline scripts are TypeScript (ESM, `.js` import specifiers) compiled
  with `tsconfig.skills.json`. Keep sources and evals under 300 lines; shared
  logic goes in `skills/eh-evolve/scripts/lib/`.
- Script resolution order documented in skills/agents: skill base directory →
  `$EVOLVE_HARNESS_ROOT/...` → legacy `~/.agents` fallback. Never hardcode
  `~/.agents` as the only path.
- Respect the global coding rules: TDD where applicable, files ≤ 300 lines,
  clean code.
- Never commit secrets, `.env*`, or credentials (see .gitignore).
- Keep `@opencode/plugin` pinned to a version that passes local
  supply-chain policies.

## Platform validation references

- OpenCode: the root plugin package typechecks via `pnpm typecheck`; the
  plugin smoke test runs with `node scripts/test-plugin.ts`
- Layout/content: `bash scripts/validate.sh`
- agy: `agy plugin validate` does not apply (no plugin.json) — symlinked
  skills/agents are the native convention
- Claude: skills/agents/commands load from `~/.claude/` on session start