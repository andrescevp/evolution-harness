#!/usr/bin/env bash
# install.sh — evolution-harness multi-platform installer
# Detects available agent CLIs and installs the evolution harness
# for each client found (opencode | claude | agy | codex).
#
# Everything is installed as symlinks into each client's conventional
# directories — no copies, so changes in this repo apply immediately.
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

symlink() { # src dest label
  if $DRY_RUN; then
    echo "  would link: $1 -> $2"
    return
  fi
  # Replace an existing symlink instead of nesting inside the target dir.
  if [[ -L "$2" ]]; then
    rm "$2"
  fi
  if [[ -e "$2" ]]; then
    echo "  skip (existing file/dir, not a symlink): $2"
    return
  fi
  ln -s "$1" "$2"
  echo "  linked: $(basename "$2")"
}

install_opencode() {
  local src="$REPO_ROOT"
  local plugins_dir="${HOME}/.config/opencode/plugins"
  local agents_dir="${HOME}/.config/opencode/agents"
  echo "[opencode] Installing V2 plugin + agents from $src"
  $DRY_RUN || mkdir -p "$plugins_dir" "$agents_dir"
  echo "  plugin: $src/opencode-plugin -> $plugins_dir/evolution-harness (registers skills + commands)"
  symlink "$src/opencode-plugin" "$plugins_dir/evolution-harness"
  echo "  agents:"
  for agent in evolver observer; do
    symlink "$src/agents/$agent.md" "$agents_dir/$agent.md"
  done
  echo "[opencode] Skills (evolve, state-sync, run-notesmd-cli) and commands (/evolve-*) are registered by the plugin."
  echo "[opencode] Restart OpenCode to load them."
}

install_claude() {
  local src="$REPO_ROOT"
  echo "[claude] Symlinking skills, agents, commands"
  for sub in skills agents commands; do
    $DRY_RUN || mkdir -p "${HOME}/.claude/$sub"
  done
  for skill in evolve state-sync run-notesmd-cli; do
    symlink "$src/skills/$skill" "${HOME}/.claude/skills/$skill"
  done
  for agent in evolver observer; do
    symlink "$src/agents/$agent.md" "${HOME}/.claude/agents/$agent.md"
  done
  for cmd in "$src/commands/"*.md; do
    symlink "$cmd" "${HOME}/.claude/commands/$(basename "$cmd")"
  done
  echo "[claude] Restart Claude Code; skills load as /evolution-harness:<skill>."
}

install_agy() {
  local src="$REPO_ROOT"
  echo "[agy] Symlinking skills, agents; converting commands to TOML"
  for sub in skills agents commands; do
    $DRY_RUN || mkdir -p "${HOME}/.gemini/$sub"
  done
  for skill in evolve state-sync run-notesmd-cli; do
    symlink "$src/skills/$skill" "${HOME}/.gemini/skills/$skill"
  done
  for agent in evolver observer; do
    symlink "$src/agents/$agent.md" "${HOME}/.gemini/agents/$agent.md"
  done
  if ! $DRY_RUN; then
    for cmd in "$src/commands/"*.md; do
      local name
      name="$(basename "$cmd" .md)"
      local desc
      desc="$(sed -n 's/^description: //p' "$cmd" | head -1)"
      local prompt
      prompt="$(awk 'BEGIN{c=0} /^---$/{c++; next} c==2 {print}' "$cmd")"
      {
        printf '# Symlinked from evolution-harness commands/%s.md\n' "$name"
        printf 'name = "%s"\n' "$name"
        printf 'description = "%s"\n' "$desc"
        printf 'prompt = """\n%s"""\n' "$prompt"
      } > "${HOME}/.gemini/commands/$name.toml"
      echo "  wrote: ~/.gemini/commands/$name.toml"
    done
  else
    echo "  would write: ~/.gemini/commands/{evolve-status,evolve-synthesize,evolve-promote}.toml"
  fi
  echo "[agy] Skills/agents are namespaced /evolution-harness:*."
}

install_codex() {
  local src="$REPO_ROOT"
  echo "[codex] Symlinking skills (Codex has no agent/command files)"
  $DRY_RUN || mkdir -p "${HOME}/.codex/skills"
  for skill in evolve state-sync run-notesmd-cli; do
    symlink "$src/skills/$skill" "${HOME}/.codex/skills/$skill"
  done
  echo "[codex] Restart Codex or start a new session to load the skills."
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