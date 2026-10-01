#!/usr/bin/env bash
# validate.sh — validate the evolution-harness repository layout.
# Checks content presence, frontmatter, plugin package integrity, and
# that the simplified layout has no leftover generated directories.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
failures=0

fail() { echo "FAIL: $*" >&2; failures=$((failures + 1)); }
ok()   { echo "  ok: $*"; }

echo "== Layout (no generated dirs) =="
for leftover in core plugins .agents .claude-plugin opencode-plugin scripts/build.sh; do
  if [[ -e "$REPO_ROOT/$leftover" ]]; then
    fail "leftover generated dir/file: $leftover"
  else
    ok "clean: no $leftover"
  fi
done

echo "== Skills =="
for skill in eh-evolve eh-state-sync eh-run-notesmd-cli; do
  f="$REPO_ROOT/skills/$skill/SKILL.md"
  if [[ -f "$f" && $(head -1 "$f") == "---" ]] && grep -q "^name: $skill$" "$f"; then
    ok "skill $skill"
  else
    fail "missing/invalid skill: $f"
  fi
done
[[ -x "$REPO_ROOT/skills/eh-evolve/scripts/capture.sh" ]] && ok "eh-evolve capture.sh executable" \
  || fail "capture.sh missing or not executable"

echo "== Agents =="
for agent in eh-evolver eh-observer; do
  f="$REPO_ROOT/agents/$agent.md"
  if [[ -f "$f" ]] && grep -q "^name: $agent$" "$f" && grep -q "^mode: subagent" "$f"; then
    ok "agent $agent"
  else
    fail "agent frontmatter problem: $f"
  fi
done

echo "== Commands =="
for cmd in evolve-status evolve-synthesize evolve-promote; do
  f="$REPO_ROOT/commands/$cmd.md"
  if [[ -f "$f" ]] && grep -q "^description:" "$f"; then
    ok "command $cmd"
  else
    fail "missing/invalid command: $f"
  fi
done

echo "== OpenCode V2 plugin (repo root) =="
if jq -e . "$REPO_ROOT/package.json" >/dev/null 2>&1; then
  ok "package.json valid JSON"
else
  fail "invalid package.json"
fi
for f in "$REPO_ROOT/index.ts" "$REPO_ROOT/tsconfig.json"; do
  [[ -f "$f" ]] && ok "plugin file: $f" || fail "missing plugin file: $f"
done
grep -q 'Plugin.define' "$REPO_ROOT/index.ts" \
  && ok "plugin defines Plugin.define" || fail "plugin does not use Plugin.define"
grep -q '"@opencode/plugin"' "$REPO_ROOT/package.json" \
  && ok "plugin depends on @opencode/plugin" || fail "@opencode/plugin dependency missing"

echo "== Plugin functional smoke test =="
if command -v node >/dev/null 2>&1 && [[ -d "$REPO_ROOT/node_modules" ]]; then
  if node "$REPO_ROOT/scripts/test-plugin.mjs" >/dev/null 2>&1; then
    ok "plugin registers skills + commands from repo root (test-plugin.mjs)"
  else
    fail "plugin smoke test failed — run: node scripts/test-plugin.mjs"
  fi
else
  echo "  skip: node or node_modules not available (run pnpm install first)"
fi

echo "== Hygiene =="
if find "$REPO_ROOT" -name "__pycache__" -type d | grep -q .; then
  fail "stray __pycache__ directories"
else
  ok "no __pycache__ directories"
fi
if [[ -d "$REPO_ROOT/node_modules" ]]; then
  ok "node_modules present (dev only)"
else
  ok "node_modules absent (run pnpm install to develop)"
fi

echo ""
if [[ $failures -eq 0 ]]; then
  echo "All checks passed."
else
  echo "$failures check(s) FAILED."
  exit 1
fi