#!/bin/bash
# Test: capture.sh includes project_location in frontmatter
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CAPTURE_SCRIPT="$SCRIPT_DIR/../scripts/capture.sh"
TEST_VAULT="$(mktemp -d)"
export OBSIDIAN_VAULT="$TEST_VAULT"

cleanup() { rm -rf "$TEST_VAULT"; }
trap cleanup EXIT

# Ensure evolve/observations dir exists
mkdir -p "$TEST_VAULT/evolve/observations"

# --- Test 1: project_location appears in frontmatter ---
RESULT=$("$CAPTURE_SCRIPT" "test-agent" "test-action" "test-context" "test-outcome" 2>/dev/null)
OBS_FILE="$TEST_VAULT/evolve/observations/${RESULT}.md"

if grep -q "project_location:" "$OBS_FILE"; then
    echo "PASS test 1: project_location field exists in observation frontmatter"
else
    echo "FAIL test 1: project_location field missing from observation frontmatter"
    echo "--- Actual frontmatter: ---"
    head -15 "$OBS_FILE"
    exit 1
fi

# --- Test 2: project_location has a non-empty value ---
PROJ_LOC=$(grep "project_location:" "$OBS_FILE" | sed 's/.*project_location: *//')
if [ -n "$PROJ_LOC" ] && [ "$PROJ_LOC" != '""' ]; then
    echo "PASS test 2: project_location is non-empty: $PROJ_LOC"
else
    echo "FAIL test 2: project_location is empty or unquoted-empty"
    exit 1
fi

# --- Test 3: project_location starts with / (is an absolute path) ---
if echo "$PROJ_LOC" | grep -q '^"*/' ; then
    echo "PASS test 3: project_location is an absolute path: $PROJ_LOC"
else
    echo "FAIL test 3: project_location is not an absolute path: $PROJ_LOC"
    exit 1
fi

# --- Test 4: EVOLVE_PROJECT_LOCATION override works ---
export EVOLVE_PROJECT_LOCATION="/custom/project/path"
RESULT2=$("$CAPTURE_SCRIPT" "test-agent2" "test-action2" "test-context2" "test-outcome2" 2>/dev/null)
OBS_FILE2="$TEST_VAULT/evolve/observations/${RESULT2}.md"
PROJ_LOC2=$(grep "project_location:" "$OBS_FILE2" | sed 's/.*project_location: *//')
unset EVOLVE_PROJECT_LOCATION

if echo "$PROJ_LOC2" | grep -q "custom/project/path"; then
    echo "PASS test 4: EVOLVE_PROJECT_LOCATION override works: $PROJ_LOC2"
else
    echo "FAIL test 4: EVOLVE_PROJECT_LOCATION override not honored. Got: $PROJ_LOC2"
    exit 1
fi

# --- Test 5: tags field exists in frontmatter ---
if grep -q "tags:" "$OBS_FILE"; then
    echo "PASS test 5: tags field exists in observation frontmatter"
else
    echo "FAIL test 5: tags field missing from observation frontmatter"
    head -15 "$OBS_FILE"
    exit 1
fi

# --- Test 6: tags contain expected evolve schema [evolve, observation, topic/<slug>] ---
if grep -q '\[evolve, observation, topic/' "$OBS_FILE"; then
    echo "PASS test 6: tags follow schema [evolve, observation, topic/<slug>]"
else
    echo "FAIL test 6: tags do not follow expected schema"
    grep "tags:" "$OBS_FILE"
    exit 1
fi

echo ""
echo "All capture.sh tests passed!"
