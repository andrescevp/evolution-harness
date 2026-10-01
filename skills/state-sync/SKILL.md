---
name: state-sync
description: >
  Update knowledge management systems and relational markdown documentation to
  reflect architecture changes made during a development cycle — identify new,
  removed, or refactored modules and new conventions from the diff, update
  project AGENTS.md, architecture decision records, and Obsidian vault notes,
  and capture accumulated learnings into the evolve system so documentation
  reflects current state, not stale assumptions. Use when preparing a release,
  syncing documentation after feature completion, invoked by /release as
  step 1, or when the user asks "sync docs", "update documentation state",
  "bring docs up to date", or "update project documentation".
license: MIT
compatibility: opencode, copilot, antigravity
allowed-tools: bash, read, write
metadata:
  audience: developers
  workflow: development
---

## Core Rules

- Read `./docs/plans/<plan-slug>/plan.md` to understand what was implemented
- Read the project `AGENTS.md` if it exists
- Diff the current project state against what documentation describes
- For each change detected:
  - Update `AGENTS.md` if new conventions, patterns, or constraints were introduced
  - Update any architecture decision records or design docs in the project
   - If an Obsidian vault is configured (`OBSIDIAN_VAULT` or `./docs/`), update relevant notes
- Use the `create-documentation` skill for Obsidian/markdown formatting conventions when applicable
- If the evolve system is active, capture significant learnings via the `observer` agent
- Do not modify source code — documentation only

## Change Detection

1. Check `git diff --stat <last-release-tag>..HEAD` for changed files
2. Identify new modules, removed modules, or restructured directories
3. Check for new configuration files, scripts, or tooling
4. Review any new patterns or conventions visible in the diff
5. Compare against what `AGENTS.md` describes — flag discrepancies

## Output Template

```markdown
# State Synchronization Report

## Changes Detected
| Change | Type | Files Affected |
|---|---|---|
| [description] | New module / Removed / Refactored / Convention | `path/...` |

## Documentation Updates Needed
- [ ] `AGENTS.md` — [specific section and update needed]
- [ ] Architecture docs — [specific file and update]
- [ ] `./docs/` vault — [specific notes]
- [ ] Evolve system — [observations to capture]

## Applied Updates
- [List of files modified and what changed]
```

## Safety

- Do not modify source code, tests, or configuration files
- Do not delete documentation without confirmation
- If an `AGENTS.md` does not exist, do not create one without asking
- Prefer updating existing documentation over creating new files
