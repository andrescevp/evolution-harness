# Metadata & Frontmatter Management

notesmd-cli has **native frontmatter commands** — no HTTP API or sed required.

## Reading frontmatter

```bash
# Print frontmatter of any note
notesmd-cli frontmatter "notes/meeting.md" --print

# Print frontmatter with a specific vault
notesmd-cli frontmatter "notes/meeting.md" --print --vault "work"

# For programmatic access, combine with jq-like parsing
notesmd-cli frontmatter "notes/meeting.md" --print | grep "^status:" | cut -d' ' -f2-
```

## Editing frontmatter

```bash
# Edit a field (creates if it doesn't exist)
notesmd-cli frontmatter "notes/meeting.md" --edit --key "status" --value "done"

# Delete a field
notesmd-cli frontmatter "notes/meeting.md" --delete --key "draft"

# Edit a list field (tags, aliases, etc.)
notesmd-cli frontmatter "notes/meeting.md" --edit --key "tags" --value "[meeting, important, reviewed]"
```

## Reading note content

```bash
# Print full note content
notesmd-cli print "notes/meeting.md"

# Print from specific vault
notesmd-cli print "notes/meeting.md" --vault "work"
```

## Common metadata fields

| Field        | YAML type    | Description                                    |
|--------------|-------------|------------------------------------------------|
| `tags`       | list/string | Content categories: `[meeting, important]`     |
| `aliases`    | list        | Alternative titles for linking: `[Alpha kickoff]` |
| `date`       | date        | Note date: `2026-05-28`                        |
| `owner`      | string      | Responsible person                             |
| `status`     | string      | Workflow state: `draft`, `review`, `done`      |
| `cssclass`   | string      | CSS class for custom styling                   |
| `publish`    | boolean     | Whether to include in Obsidian Publish         |

## Relations (wiki-links)

Obsidian uses `[[wikilink]]` syntax for relations. These create bidirectional links:

```markdown
Related projects: [[prj-alpha]], [[prj-beta]]
See also: [[architecture-decisions]]
```

- **Backlinks**: Obsidian tracks incoming links automatically
- **Unlinked mentions**: Obsidian detects note names in text even without `[[]]` syntax
- **move command**: `notesmd-cli move` automatically updates all internal wiki-links

## Properties (Obsidian 1.4+)

Obsidian 1.4+ supports typed properties as an alternative to YAML frontmatter:

```yaml
---
property1: value          # text property
property2: 42             # number property
property3: true           # checkbox property
property4: [a, b, c]      # list property
property5: 2026-05-28     # date property
---
```

Properties are indexed and searchable. Use `notesmd-cli frontmatter --edit` to manage them.
