# evolution-harness — Antigravity CLI (agy)

Evolution harness plugin for Google Antigravity CLI: captures session learnings,
distills evolution units, and evolves agent behavior. Evolution notes are managed
in an Obsidian vault (`./docs/evolve/`) — headless via `notesmd-cli`.

## What's included

| Component | Contents |
|---|---|
| Skills | `evolve`, `state-sync`, `run-notesmd-cli` |
| Agents | `observer` (captures learnings), `evolver` (synthesizes proposals) |
| Commands | `evolve-status`, `evolve-synthesize`, `evolve-promote` (TOML) |

## Installation

```bash
agy plugin install "$PWD/plugins/agy"
agy plugin list
```

Skills are namespaced: `/evolution-harness:evolve`, `/evolution-harness:state-sync`,
`/evolution-harness:run-notesmd-cli`. Agents are invoked as subagents
(`observer`, `evolver`); commands as `/evolution-harness:evolve-status`.

## Notes storage

The evolve skill stores notes in `./docs/evolve/` relative to the project root
(override with `OBSIDIAN_VAULT`). Vault operations use `notesmd-cli`; if it is
unavailable, scripts fall back to direct file writes. See the `run-notesmd-cli`
skill for vault management.

## Regenerating

Component content is generated from `../../core/` by `../../scripts/build.sh`.
Edit `core/`, then run `bash scripts/build.sh` at the repo root and reinstall.