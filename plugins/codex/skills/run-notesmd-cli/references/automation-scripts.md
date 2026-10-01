# Automation Scripts

## Daily standup log

Save as `scripts/daily-standup.sh`:

```bash
#!/bin/bash
# Append standup entry to daily note using notesmd-cli
DATE=$(date +%Y-%m-%d)
ENTRY="## Standup $DATE
- Yesterday: $1
- Today: $2
- Blockers: ${3:-none}"

notesmd-cli daily --content "$ENTRY"
```

Usage: `./scripts/daily-standup.sh "Deployed v2.3" "Start refactor" "Waiting on API keys"`

## Bulk tag manager

Save as `scripts/bulk-tag.sh`:

```bash
#!/bin/bash
# Add a tag to all notes matching a search term
TAG="$1"
SEARCH_TERM="$2"
VAULT_PATH="${3:-$HOME/vaults/main}"

# Find matching files and add tag via frontmatter command
notesmd-cli search-content "$SEARCH_TERM" --format json --no-interactive | \
  python3 -c "
import sys, json
results = json.load(sys.stdin)
for r in results:
    name = r.get('name', '')
    if name:
        print(name)
" | while read -r note; do
  notesmd-cli frontmatter "$note" --edit --key "tags" --value "[$TAG]"
  echo "Tagged: $note"
done
```

## Metadata report

Save as `scripts/metadata-report.sh`:

```bash
#!/bin/bash
# Generate a report of all notes with metadata using notesmd-cli
VAULT_PATH="${1:-$HOME/vaults/main}"

echo "# Vault Metadata Report"
echo "Generated: $(date)"
echo ""

notesmd-cli list --vault "$(basename "$VAULT_PATH")" 2>/dev/null | while read -r note; do
  [ -z "$note" ] && continue
  TITLE=$(basename "$note" .md)
  TAGS=$(notesmd-cli frontmatter "$note" --print 2>/dev/null | grep "^tags:" | cut -d' ' -f2- || echo "none")
  echo "- **$TITLE** | tags: $TAGS"
done
```

## Create note from template

Save as `scripts/template-note.sh`:

```bash
#!/bin/bash
# Create a new note from a template file
TEMPLATE="$1"
NOTE_NAME="$2"
TITLE="${3:-$NOTE_NAME}"

if [ ! -f "$TEMPLATE" ]; then
  echo "Template not found: $TEMPLATE"
  exit 1
fi

# Read template, replace placeholders, create note
CONTENT=$(sed "s/{{TITLE}}/$TITLE/g; s/{{DATE}}/$(date +%Y-%m-%d)/g" "$TEMPLATE")
notesmd-cli create "$NOTE_NAME" --content "$CONTENT" --open --editor
```
