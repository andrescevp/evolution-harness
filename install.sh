#!/usr/bin/env bash
# install.sh — evolution-harness multi-platform installer
# Detects available agent CLIs and installs the evolution harness plugin
# for each client found (opencode | claude | agy | codex).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
DRY_RUN=false

usage() {
  cat <<EOF
evolution-harness installer — Evolution harness multi-platform plugin

Usage: $0 [OPTIONS]

Options:
  --help           Show this help message
  --dry-run        Show what would be installed without installing
  --client NAME    Install only for a specific client
                   (opencode|claude|agy|codex)

Without --client, detects all available CLIs and installs for each.
EOF
  exit 0
}

detect_clients() {
  local available=()
  command -v opencode >/dev/null 2>&1 && available+=("opencode")
  command -v claude >/dev/null 2>&1 && available+=("claude")
  command -v agy >/dev/null 2>&1 && available+=("agy")
  command -v codex >/dev/null 2>&1 && available+=("codex")
  printf '%s\n' "${available[@]}"
}

install_opencode() {
  local src="$REPO_ROOT/plugins/opencode"
  local skills_dir="${HOME}/.config/opencode/skills"
  local agents_dir="${HOME}/.config/opencode/agents"
  local commands_dir="${HOME}/.config/opencode/commands"
  echo "[opencode] Symlinking skills, agents, commands from $src"
  $DRY_RUN || mkdir -p "$skills_dir" "$agents_dir" "$commands_dir"
  for skill in evolve state-sync run-notesmd-cli; do
    $DRY_RUN || ln -sfn "$src/skills/$skill" "$skills_dir/$skill"
    echo "[opencode]   skill: $skill"
  done
  for agent in evolver observer; do
    $DRY_RUN || ln -sfn "$src/agents/$agent.md" "$agents_dir/$agent.md"
    echo "[opencode]   agent: $agent"
  done
  for cmd in "$src/commands/"*.md; do
    $DRY_RUN || ln -sfn "$cmd" "$commands_dir/$(basename "$cmd")"
    echo "[opencode]   command: $(basename "$cmd")"
  done
  echo "[opencode] Done. Restart OpenCode to load them."
}

install_claude() {
  echo "[claude] Register the repo as a marketplace and install:"
  if $DRY_RUN; then
    echo "[claude] Would run:"
    echo "[claude]   claude plugin marketplace add \"$REPO_ROOT\""
    echo "[claude]   claude plugin install evolution-harness@evolution-harness"
  else
    if command -v claude >/dev/null 2>&1; then
      claude plugin marketplace add "$REPO_ROOT" >/dev/null 2>&1 || true
      claude plugin install evolution-harness@evolution-harness
    else
      echo "[claude] 'claude' CLI not found — plugin dir is ready at $REPO_ROOT/plugins/claude"
    fi
  fi
}

install_agy() {
  local src="$REPO_ROOT/plugins/agy"
  echo "[agy] Installing plugin from $src"
  if $DRY_RUN; then
    echo "[agy] Would run: agy plugin install $src"
  else
    if command -v agy >/dev/null 2>&1; then
      agy plugin install "$src" 2>/dev/null \
        || echo "[agy] Plugin directory registered. Use 'agy plugin list' to verify."
    else
      echo "[agy] 'agy' CLI not found — plugin dir is ready at $src"
    fi
  fi
}

install_codex() {
  echo "[codex] Register the repo as a marketplace and install:"
  echo ""
  echo "  codex plugin marketplace add \"$REPO_ROOT\""
  echo "  codex plugin add evolution-harness --marketplace evolution-harness"
  echo ""
  echo "[codex] Restart Codex or run 'codex plugin list' to verify. Skills: evolve, state-sync, run-notesmd-cli."
}

# Parse args
CLIENTS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --help) usage ;;
    --dry-run) DRY_RUN=true; shift ;;
    --client) CLIENTS+=("$2"); shift 2 ;;
    *) echo "Unknown option: $1"; usage ;;
  esac
done

if [[ ${#CLIENTS[@]} -eq 0 ]]; then
  mapfile -t CLIENTS < <(detect_clients)
fi

if [[ ${#CLIENTS[@]} -eq 0 ]]; then
  echo "No supported agent CLIs detected."
  echo "Install one of: opencode, claude, agy (antigravity), codex"
  exit 0
fi

echo "evolution-harness installer"
echo "Repo root: $REPO_ROOT"
$DRY_RUN && echo "DRY RUN — no changes will be made"
echo ""

for client in "${CLIENTS[@]}"; do
  case "$client" in
    opencode) install_opencode ;;
    claude) install_claude ;;
    agy) install_agy ;;
    codex) install_codex ;;
    *) echo "Unknown client: $client (supported: opencode, claude, agy, codex)" ;;
  esac
  echo ""
done

cat <<EOF
Optional: export EVOLVE_HARNESS_ROOT="$REPO_ROOT" in your shell profile so
agents can always resolve the bundled evolve scripts
(\$EVOLVE_HARNESS_ROOT/skills/evolve/scripts/...).

Installation complete.
EOF