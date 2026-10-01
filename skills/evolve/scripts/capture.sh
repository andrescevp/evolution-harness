#!/bin/bash
# Capture a sanitized observation into the evolve vault
# Usage: ./capture.sh "agent_name" "action" "context" "outcome"
set -euo pipefail

# Detect project location: env override > git top-level > cwd
detect_project_location() {
  if [ -n "${EVOLVE_PROJECT_LOCATION:-}" ]; then
    echo "$EVOLVE_PROJECT_LOCATION"
    return
  fi
  if command -v git >/dev/null 2>&1 && git rev-parse --show-toplevel >/dev/null 2>&1; then
    git rev-parse --show-toplevel
  else
    pwd
  fi
}

PROJECT_ROOT="$(detect_project_location)"
VAULT="${OBSIDIAN_VAULT:-$PROJECT_ROOT/docs}"
EVOLVE_DIR="$VAULT/evolve/observations"

AGENT="${1:-unknown}"
ACTION="${2:-unknown}"
CONTEXT="${3:-}"
OUTCOME="${4:-}"

# Sanitize: strip env vars, secrets, tokens
sanitize() {
  echo "$1" | sed -E 's/([A-Za-z0-9+/=]{40,})/[REDACTED_TOKEN]/g' \
    | sed -E 's/(SECRET|TOKEN|PASSWORD|API_KEY|CREDENTIAL)=[^ ]+/[REDACTED]/gi'
}

# Generate a slug-safe topic tag from the action string
slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g' | sed -E 's/^-+|-+$//g'
}

mkdir -p "$EVOLVE_DIR"

TS=$(date +%Y%m%d-%H%M%S)
ID="obs-${TS}-$(printf '%03d' $RANDOM)"
FILE="$EVOLVE_DIR/${ID}.md"

CTX=$(sanitize "$CONTEXT")
OUT=$(sanitize "$OUTCOME")
TOPIC_SLUG=$(slugify "$ACTION")

cat > "$FILE" << NOTE
---
kind: observation
id: ${ID}
agent: ${AGENT}
action: ${ACTION}
date: $(date +%Y-%m-%d)
timestamp: $(date -Iseconds)
project_location: "${PROJECT_ROOT}"
tags: [evolve, observation, topic/${TOPIC_SLUG}]
outcome: "${OUT}"
---

# ${AGENT}: ${ACTION}

## Context
${CTX}

## Outcome
${OUT}
NOTE

echo "$ID"
echo "Observation saved: $FILE" >&2
