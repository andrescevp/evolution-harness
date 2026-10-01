---
description: Cluster evolution units and generate synthesis proposals for new artifacts
---

Run the synthesis pipeline via the `evolve` skill:
1. Load all candidate evolution units from `./docs/evolve/units/`
2. Cluster by domain (workflow, code-style, testing, git, debugging, docs, etc.)
3. Generate synthesis proposals in `./docs/evolve/proposals/`
4. Report clusters found and proposals generated

The `evolve` skill bundles `scripts/synthesize.py`. Resolve the skill's base directory as documented in the skill (skill resources, `$EVOLVE_HARNESS_ROOT/skills/evolve/scripts/`, or legacy `~/.agents/skills/evolve/scripts/`), then run:

```bash
uv run scripts/synthesize.py
```

After synthesis, review each proposal and ask whether to proceed with artifact generation. Only generate artifacts (skills, agents, commands) for high-confidence proposals (>= 0.7 avg confidence).