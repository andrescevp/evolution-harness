# evolution-harness — OpenCode

Evolution harness for OpenCode: skills, sub-agents, and slash commands for the
evolve system. Installed through the conventional OpenCode directories, which
`install.sh` symlinks into `~/.config/opencode/`.

## What's included

| Component | Target | Contents |
|---|---|---|
| Skills | `~/.config/opencode/skills/<name>` | `evolve`, `state-sync`, `run-notesmd-cli` |
| Agents | `~/.config/opencode/agents/<name>.md` | `observer`, `evolver` |
| Commands | `~/.config/opencode/commands/<name>.md` | `evolve-status`, `evolve-synthesize`, `evolve-promote` |

## Installation

```bash
# From the repo root (symlinks into ~/.config/opencode/, no copying)
bash install.sh --client opencode
```

Or manually:

```bash
ln -s "$PWD/plugins/opencode/skills/evolve"          ~/.config/opencode/skills/evolve
ln -s "$PWD/plugins/opencode/skills/state-sync"      ~/.config/opencode/skills/state-sync
ln -s "$PWD/plugins/opencode/skills/run-notesmd-cli" ~/.config/opencode/skills/run-notesmd-cli
ln -s "$PWD/plugins/opencode/agents/evolver.md" ~/.config/opencode/agents/evolver.md
ln -s "$PWD/plugins/opencode/agents/observer.md" ~/.config/opencode/agents/observer.md
ln -s "$PWD/plugins/opencode/commands/"*.md ~/.config/opencode/commands/
```

Restart OpenCode; skills load via the `skill` tool, agents via `@agent`, and
commands as `/evolve-*` slash commands.

> Note: OpenCode plugin packages are code-first (JS/TS). Skills, agents, and
> commands are consumed through the conventional directories above, matching
> how `~/.agents` is wired today.

## Regenerating

Component content is generated from `../../core/` by `../../scripts/build.sh`.
Edit `core/`, then run `bash scripts/build.sh` at the repo root; the symlinks
pick up changes automatically.