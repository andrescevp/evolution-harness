## Reference triggers

Use these detailed references only when the specific sub-task requires them:

| Reference | When to use | File |
|-----------|-------------|------|
| Metadata management | User needs to read/update frontmatter, tags, relations, backlinks, or properties | `references/metadata-management.md` |
| Automation scripts | User wants to automate vault operations with shell scripts (daily standup, bulk tagging, metadata reports) | `references/automation-scripts.md` |

## Gotchas

- **Vault not registered**: If `notesmd-cli` returns "vault not found", register it first: `notesmd-cli add-vault /path/to/vault --set-default`
- **Vault path resolution**: The CLI uses the vault's base directory as working directory, not `$PWD`. Use `--vault` to target a specific vault.
- **Frontmatter validation**: Invalid YAML breaks frontmatter parsing. Validate: `python3 -c "import yaml; yaml.safe_load(open('file.md').read().split('---')[1])"`
- **Wiki-links are case-insensitive but path-sensitive**: `[[Note Name]]` must match the filename (without `.md`).
- **Large vaults**: `search-content` can be slow on vaults with 10,000+ notes. Use `--page` and `--page-size` for pagination.
- **Concurrent edits**: The CLI and Obsidian GUI can conflict if both modify the same note simultaneously. Prefer CLI for automation and GUI for manual editing.
- **Excluded files**: notesmd respects Obsidian's excluded files setting. `search` and `search-content` skip excluded paths.

## Verification

Before relying on notesmd-cli in automation:

- [ ] `notesmd-cli list-vaults` shows your vault(s)
- [ ] `notesmd-cli daily` creates/opens today's note
- [ ] `notesmd-cli search-content "test" --no-interactive` returns results
- [ ] `notesmd-cli frontmatter "any-note" --print` shows frontmatter
