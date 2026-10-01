#!/usr/bin/env bash
# validate.sh — validate every platform plugin of the evolution harness.
# Checks manifest JSON validity, component presence, frontmatter, and
# that generated content is in sync with core/ (via scripts/build.sh).
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
failures=0

fail() { echo "FAIL: $*" >&2; failures=$((failures + 1)); }
ok()   { echo "  ok: $*"; }

check_json() {
  if jq -e . "$1" >/dev/null 2>&1; then ok "valid JSON: $1"; else fail "invalid JSON: $1"; fi
}

echo "== Manifests =="
check_json "$REPO_ROOT/plugins/agy/plugin.json"
check_json "$REPO_ROOT/plugins/codex/plugin.json"
check_json "$REPO_ROOT/plugins/claude/.claude-plugin/plugin.json"
check_json "$REPO_ROOT/plugins/opencode/package.json"
check_json "$REPO_ROOT/core/agents/agents.json"
check_json "$REPO_ROOT/.agents/plugins/marketplace.json"
check_json "$REPO_ROOT/.claude-plugin/marketplace.json"

echo "== Skills (all four platforms) =="
for plat in agy codex claude opencode; do
  for skill in evolve state-sync run-notesmd-cli; do
    f="$REPO_ROOT/plugins/$plat/skills/$skill/SKILL.md"
    if [[ -f "$f" && $(head -1 "$f") == "---" ]]; then
      ok "skill $plat/$skill"
    else
      fail "missing skill: $f"
    fi
  done
done

echo "== Agents (agy, claude, opencode) =="
for plat in agy claude opencode; do
  for agent in evolver observer; do
    f="$REPO_ROOT/plugins/$plat/agents/$agent.md"
    if [[ -f "$f" ]] && grep -q "^name: $agent$" "$f" && grep -q "^description:" "$f"; then
      ok "agent $plat/$agent"
    else
      fail "agent frontmatter problem: $f"
    fi
  done
done

echo "== Commands =="
for cmd in evolve-status evolve-synthesize evolve-promote; do
  if [[ -f "$REPO_ROOT/plugins/opencode/commands/$cmd.md" ]]; then
    ok "opencode command $cmd"
  else
    fail "missing opencode command: $cmd"
  fi
  if [[ -f "$REPO_ROOT/plugins/agy/commands/$cmd.toml" ]] && grep -q "^name = \"$cmd\"$" "$REPO_ROOT/plugins/agy/commands/$cmd.toml"; then
    ok "agy command $cmd (toml)"
  else
    fail "missing/invalid agy command: $cmd"
  fi
done

echo "== Core =="
for skill in evolve state-sync run-notesmd-cli; do
  [[ -f "$REPO_ROOT/core/skills/$skill/SKILL.md" ]] \
    && ok "core skill $skill" || fail "missing core skill $skill"
done
for agent in evolver observer; do
  [[ -f "$REPO_ROOT/core/agents/$agent.body.md" ]] \
    && ok "core agent body $agent" || fail "missing core agent body $agent"
done

echo "== Hygiene =="
if find "$REPO_ROOT" -name "__pycache__" -type d | grep -q .; then
  fail "stray __pycache__ directories (run scripts/build.sh)"
else
  ok "no __pycache__ directories"
fi

echo ""
if [[ $failures -eq 0 ]]; then
  echo "All checks passed."
else
  echo "$failures check(s) FAILED. If core/ content changed, run: bash scripts/build.sh"
  exit 1
fi