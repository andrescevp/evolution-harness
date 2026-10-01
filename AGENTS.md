# AGENTS.md — evolution-harness repository conventions

This repository packages the **evolution harness** (from `~/.agents`) as a
multi-platform plugin for agy (Antigravity), codex, claude, and opencode.

## Layout & invariants

- `core/` is the **canonical source of truth**:
  - `core/skills/<slug>/` — SKILL.md + bundled `scripts/` + `references/`
  - `core/agents/<name>.body.md` — platform-neutral agent bodies
  - `core/agents/agents.json` — per-platform frontmatter (tools, descriptions)
  - `core/commands/*.md` — OpenCode-format slash commands
- `plugins/<platform>/` are **generated from `core/`** by `scripts/build.sh`:
  - `agy/` (plugin.json, skills/, agents/, commands/*.toml),
    `codex/` (plugin.json, skills/), `claude/` (.claude-plugin/plugin.json,
    skills/, agents/), `opencode/` (package.json, skills/, agents/, commands/)
- **Manifests and per-platform READMEs are hand-authored** in `plugins/` and
  must not be regenerated or moved: `build.sh` only touches `skills/`,
  `agents/`, and `commands/` subdirectories.
- Marketplace manifests are committed and hand-authored:
  `.agents/plugins/marketplace.json` (Codex/ChatGPT) and
  `.claude-plugin/marketplace.json` (Claude Code). Keep `name` keys in sync
  with the plugin name (`evolution-harness`).

## Workflow

1. Edit content in `core/` only.
2. Regenerate: `bash scripts/build.sh`
3. Validate: `bash scripts/validate.sh` (must pass before committing)
4. Commit generated plugins alongside core changes.

## Content rules

- Skills must stay platform-neutral: `SKILL.md` frontmatter uses `name` and
  `description`; body must avoid client-specific syntax.
- Never hardcode `~/.agents` paths. Script resolution order documented in the
  skill: skill base directory → `$EVOLVE_HARNESS_ROOT/...` → legacy fallback.
- Agent tool lists per platform live in `core/agents/agents.json`:
  `opencode` (map), `agy` (flat array), `claude` (comma list).
- Respect the global coding rules: TDD where applicable, files ≤ 300 lines,
  clean code.
- Never commit secrets, `.env*`, or credentials (see .gitignore).

## Platform validation references

- Claude: `claude plugin validate ./plugins/claude --strict`
- agy: `agy plugin validate ./plugins/agy`
- Codex/OpenCode: structural checks in `scripts/validate.sh`