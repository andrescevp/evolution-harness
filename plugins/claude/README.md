# evolution-harness — Claude Code

Claude Code plugin bundling the evolution harness: skills and sub-agents that
capture session learnings into an Obsidian vault (`./docs/evolve/`) and evolve
agent behavior over time.

## What's included

| Component | Contents |
|---|---|
| Skills | `evolve`, `state-sync`, `run-notesmd-cli` (`/evolution-harness:<skill>`) |
| Agents | `observer`, `evolver` (subagents, available in `/context`) |

## Installation

Plugins install from marketplaces. Register this repository checkout as a
marketplace, then install:

```bash
claude plugin marketplace add "$PWD"         # PWD = evolution-harness repo root
claude plugin install evolution-harness@evolution-harness
claude plugin list                            # verify
```

The marketplace manifest is `.claude-plugin/marketplace.json` at the repo
root. Skills are available as `/evolution-harness:<skill>`; agents (subagents)
appear in `/context`.

For development, validate locally:

```bash
claude plugin validate "$PWD/plugins/claude" --strict
```

## Notes storage

Evolution notes live in `./docs/evolve/` (project-relative vault,
`OBSIDIAN_VAULT`-overridable). The `run-notesmd-cli` skill manages the vault
headless; the evolve scripts fall back to direct file writes when the CLI is
absent.

## Regenerating

Component content is generated from `../../core/` by `../../scripts/build.sh`.
Edit `core/`, then run `bash scripts/build.sh` at the repo root and reinstall.