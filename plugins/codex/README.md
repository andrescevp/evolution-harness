# evolution-harness — OpenAI Codex / ChatGPT

Portable Agent Plugin bundling the evolution harness skills for Codex and
ChatGPT. Skills are auto-discovered from `./skills/`.

## Skills

- `evolve` — capture observations → evolution units → synthesis proposals
- `state-sync` — sync docs and AGENTS.md after a development cycle
- `run-notesmd-cli` — manage the Obsidian evolution vault headless

## Installation

Register the repository checkout as a marketplace, then install:

```bash
codex plugin marketplace add "$PWD"          # PWD = evolution-harness repo root
codex plugin add evolution-harness --marketplace evolution-harness
codex plugin list                             # verify installed, enabled
```

The marketplace manifest is `.agents/plugins/marketplace.json` at the repo
root. For ChatGPT, add the same repo as a local marketplace in the desktop app.
Skills are auto-discovered from `./skills/` — no `skills` field is required
in the manifest.

## Regenerating

Component content is generated from `../../core/` by `../../scripts/build.sh`.
Edit `core/`, then run `bash scripts/build.sh` at the repo root.