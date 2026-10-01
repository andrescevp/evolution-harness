---
name: eh-run-notesmd-cli
description: >
  Use this skill when managing an Obsidian vault from the command line using
  `notesmd-cli` — creating, reading, updating, moving, and deleting notes,
  managing YAML frontmatter (tags, aliases, properties, relations), opening
  daily notes with append support, searching titles and content with
  non-interactive JSON output for scripts, printing notes to stdout, and
  listing vault contents, all without requiring Obsidian to be running (works
  headless). Also use when integrating Obsidian vault operations into agent
  workflows, CI/CD pipelines, or shell scripts, or in headless/server
  environments where the Obsidian GUI is unavailable.
license: MIT
compatibility: opencode, copilot, antigravity
allowed-tools: bash, read, write
metadata:
  audience: developers
  workflow: document-management
---

# NotesMD CLI Integration

Manage an Obsidian vault programmatically using [`notesmd-cli`](https://github.com/Yakitrak/notesmd-cli) — create, search, read, update, move, and delete notes, manage frontmatter, and automate vault operations **without requiring Obsidian to be running**.

## Prerequisites

```bash
# Install notesmd-cli (Arch Linux)
yay -S notesmd-cli-bin

# Or via Homebrew (macOS/Linux)
brew tap yakitrak/yakitrak
brew install yakitrak/yakitrak/notesmd-cli

# Or build from source (requires Go 1.19+)
git clone https://github.com/Yakitrak/notesmd-cli.git
cd notesmd-cli && go build -o notesmd-cli .
sudo install -m 755 notesmd-cli /usr/local/bin/
```

### Vault registration

If Obsidian is installed, vaults are auto-detected. For headless environments, register manually:

```bash
notesmd-cli add-vault /path/to/vault --set-default
```

The vault path defaults to `{project_root}/docs/` (see eh-evolve skill). Override with `--vault "{name}"` per command.

## Architecture

### Vault structure

```
~/vaults/my-vault/           ← Vault root
  .obsidian/                 ← Config (plugins, themes, settings)
  notes/                     ← Any folder structure works
    meeting-2026-05-28.md    ← Markdown files = notes
    projects/
      prj-alpha.md
  templates/                 ← Template folder (configurable)
```

### Note format (Markdown + YAML frontmatter)

```markdown
---
tags: [meeting, project-alpha]
aliases: [Alpha kickoff]
date: 2026-05-28
owner: andres
status: draft
---
# Meeting: Project Alpha Kickoff

Key decisions...
```

## CLI Commands Reference

### Note operations

```bash
# Create a new note (or overwrite if --overwrite passed)
notesmd-cli create "notes/quick-thought.md" --content "# Quick Thought\n\nInitial idea..."

# Create with frontmatter
notesmd-cli create "notes/new-note.md" --content "---
tags: [draft]
---
# New Note

Content here."

# Append to an existing note
notesmd-cli create "notes/existing.md" --content "## New section" --append

# Overwrite an existing note
notesmd-cli create "notes/existing.md" --content "New content" --overwrite

# Create and open in editor
notesmd-cli create "notes/note.md" --content "..." --open --editor

# Print note contents (read-only)
notesmd-cli print "notes/quick-thought.md"

# Move / Rename (updates all internal wiki-links)
notesmd-cli move "old-name.md" "new-name.md"

# Delete a note
notesmd-cli delete "notes/old-draft.md"
```

### Daily notes

Obsidian does **not** need to be running. The CLI reads `.obsidian/daily-notes.json` for folder/format/template config.

```bash
# Create or open today's daily note
notesmd-cli daily

# Append content to today's daily note
notesmd-cli daily --content "- [ ] Review PR #42"

# Append with heading
notesmd-cli daily --content "## Standup notes\n- Deployed v2.3\n- Started refactor"

# Open daily note in editor
notesmd-cli daily --editor

# Target a specific vault
notesmd-cli daily --vault "work"
```

### Search

```bash
# Interactive fuzzy search (opens selected note in Obsidian)
notesmd-cli search

# Search with editor picker
notesmd-cli search --editor

# Search note content (interactive picker)
notesmd-cli search-content "meeting notes"

# Non-interactive grep-style output (for scripts)
notesmd-cli search-content "deployment" --no-interactive

# JSON output for scripts
notesmd-cli search-content "api endpoint" --format json

# Paginated JSON results
notesmd-cli search-content "refactor" --format json --page 1 --page-size 50
```

### Frontmatter management

notesmd-cli has **native frontmatter** commands — no need for HTTP API or sed hacks:

```bash
# Print frontmatter of a note
notesmd-cli frontmatter "notes/meeting.md" --print

# Edit a frontmatter field (creates if it doesn't exist)
notesmd-cli frontmatter "notes/meeting.md" --edit --key "status" --value "done"

# Delete a frontmatter field
notesmd-cli frontmatter "notes/meeting.md" --delete --key "draft"

# Work with a specific vault
notesmd-cli frontmatter "notes/meeting.md" --print --vault "work"
```

### Vault operations

```bash
# Register a vault (headless setup)
notesmd-cli add-vault /path/to/vault
notesmd-cli add-vault /path/to/vault --set-default

# Remove a vault (does not delete files)
notesmd-cli remove-vault "vault-name"
notesmd-cli remove-vault /path/to/vault

# List registered vaults
notesmd-cli list-vaults
notesmd-cli list-vaults --json
notesmd-cli list-vaults --path-only
notesmd-cli list-vaults --default --path-only

# Set default vault
notesmd-cli set-default-vault "vault-name"

# List vault contents
notesmd-cli list
notesmd-cli list "subfolder"

# Open a note in Obsidian (or editor with --editor)
notesmd-cli open "note-name"
notesmd-cli open "note-name" --section "Heading Text"
notesmd-cli open "path/to/note.md" --editor
```

### Editor flag

All commands that open notes (`open`, `daily`, `search`, `search-content`, `create`, `move`) support `--editor` to open in `$EDITOR` instead of Obsidian. Set default:

```bash
notesmd-cli set-default-vault --open-type editor
```

## Comparison: Obsidian CLI vs notesmd-cli

| Feature | obsidian CLI | notesmd-cli |
|---------|-------------|-------------|
| Requires Obsidian running | ✅ Yes | ❌ No |
| Create/Update notes | ✅ | ✅ |
| Daily notes | ✅ (with append) | ✅ (with `--content`) |
| Search content | ✅ | ✅ (+ non-interactive, JSON) |
| Frontmatter management | ❌ (manual) | ✅ (built-in) |
| Move/Rename with link update | ❌ | ✅ |
| Delete notes | ❌ | ✅ |
| List vault contents | ❌ | ✅ |
| Vault registration | Auto only | ✅ Manual too |
| Headless/server | ❌ | ✅ |
| Print note to stdout | ❌ | ✅ |
| `--editor` flag | ❌ | ✅ |

## References

- [notesmd-cli GitHub](https://github.com/Yakitrak/notesmd-cli)
- `references/api-reference.md` — Local HTTP API fallback for complex operations
- `references/metadata-management.md` — Frontmatter fields, relations, properties
- `references/automation-scripts.md` — Shell scripts for daily standup, bulk tagging, reports
