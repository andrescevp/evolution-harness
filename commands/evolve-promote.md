---
description: Promote project-scoped evolution units to global scope
---

Load the `eh-evolve` skill and scan `./docs/evolve/units/` for project-scoped units (`scope: project`) that appear in 2+ different contexts. Promote qualifying units to `scope: global` by updating their frontmatter.

Process:
1. List all project-scoped units from `./docs/evolve/units/`
2. Group by domain and action similarity
3. If 2+ units share the same domain/action pattern, promote the highest-confidence one to global
4. Update the unit's frontmatter: `scope: global`, add promotion timestamp
5. Report promoted units

Safety: Never promote without sufficient cross-project evidence. Default to keeping units project-scoped unless clear global applicability is demonstrated.
