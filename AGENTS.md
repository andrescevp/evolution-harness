# AGENTS.md — evolution-harness repository conventions

This repository packages the **evolution harness** (from `~/.agents`) as a
multi-platform plugin for agy (Antigravity), codex, claude, and opencode —
with the OpenCode V2 plugin (`opencode-plugin/`) as the first-class surface.

## Layout & invariants

- `skills/<slug>/` — canonical SKILL.md skills (SKILL.md + bundled `scripts/`
  + `references/`). Platform-neutral; shared by every client.
- `agents/<name>.md` — OpenCode-format subagents (`mode: subagent`,
  `tools:` map). Installed by `install.sh` into each platform's conventional
  agent directory; OpenCode agents cannot be registered via the V2 plugin API.
- `commands/<name>.md` — OpenCode-format slash commands. Registered for
  OpenCode by the plugin; converted to TOML for agy by `install.sh`.
- `opencode-plugin/` — OpenCode V2 plugin package. It must keep
  `Plugin.define` as the default export and only depend on `@opencode/plugin`.
  It resolves the repo root via `$EVOLVE_HARNESS_ROOT` → plugin parent dirs.
- No generated directories (`core/`, `plugins/`, marketplaces) — content at
  the root IS the plugin. Do not reintroduce per-platform copies.
- `install.sh` only creates symlinks (plus agy TOML conversion) — no copies.

## Workflow

1. Edit content in `skills/`, `agents/`, or `commands/` directly.
2. Run `bash scripts/validate.sh` — must pass before committing.
3. Plugin code changes: `cd opencode-plugin && pnpm typecheck`.

## Content rules

- Skills stay platform-neutral: `SKILL.md` frontmatter uses `name` and
  `description`; body avoids client-specific syntax.
- Script resolution order documented in skills/agents: skill base directory →
  `$EVOLVE_HARNESS_ROOT/...` → legacy `~/.agents` fallback. Never hardcode
  `~/.agents` as the only path.
- Respect the global coding rules: TDD where applicable, files ≤ 300 lines,
  clean code.
- Never commit secrets, `.env*`, or credentials (see .gitignore).
- Keep `opencode-plugin` pinned to a `@opencode/plugin` version that passes
  local supply-chain policies.

## Platform validation references

- OpenCode: `opencode-plugin/` typechecks via `pnpm typecheck`
- Layout/content: `bash scripts/validate.sh`
- agy: `agy plugin validate` does not apply (no plugin.json) — symlinked
  skills/agents are the native convention
- Claude: skills/agents/commands load from `~/.claude/` on session start