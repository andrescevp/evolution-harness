---
description: Show current evolution units, confidence levels, and synthesis status
---

Load the `eh-evolve` skill and read the evolve vault at `./docs/evolve/` and report current state:
1. Count observations, units, clusters, and proposals
2. List top units by confidence (top 5)
3. List domain distribution (units per domain)
4. Report any proposals ready for review (status: proposed)
5. Check for stale units (low confidence + old)

If clusters need refreshing, use `evolve-synthesize` command instead of calling scripts directly.

Return a compact Markdown summary of the evolve system state.
