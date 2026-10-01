#!/usr/bin/env python3
"""Test: create-unit.py includes project_location in frontmatter."""
import os
import sys
import tempfile
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CREATE_UNIT_SCRIPT = os.path.join(SCRIPT_DIR, "..", "scripts", "create-unit.py")

def run_test():
    failures = []

    # Setup temp vault
    test_vault = tempfile.mkdtemp()
    os.environ["OBSIDIAN_VAULT"] = test_vault

    try:
        # --- Test 1: project_location appears in unit frontmatter ---
        env = os.environ.copy()
        env["EVOLVE_PROJECT_LOCATION"] = "/tmp/test-project"
        result = subprocess.run(
            [sys.executable, CREATE_UNIT_SCRIPT, "Test unit", "Test action", "0.75", "workflow", "project"],
            capture_output=True, text=True, env=env,
        )
        uid = result.stdout.strip()
        unit_file = os.path.join(test_vault, "evolve", "units", f"{uid}.md")

        if not os.path.exists(unit_file):
            failures.append(f"FAIL test 1: unit file not created at {unit_file}")
        else:
            with open(unit_file) as f:
                content = f.read()
            if "project_location:" not in content:
                failures.append("FAIL test 1: project_location field missing from unit frontmatter")
            else:
                print("PASS test 1: project_location field exists in unit frontmatter")

        # --- Test 2: project_location has the expected value ---
        if os.path.exists(unit_file):
            with open(unit_file) as f:
                content = f.read()
            if "/tmp/test-project" not in content:
                failures.append(
                    "FAIL test 2: project_location value incorrect"
                )
            else:
                print("PASS test 2: project_location value is correct")

        # --- Test 3: project_location set via git detection (mock) ---
        # We test the detection function directly by importing the module
        sys.path.insert(0, os.path.join(SCRIPT_DIR, "..", "scripts"))
        import importlib.util
        spec = importlib.util.spec_from_file_location("create_unit", CREATE_UNIT_SCRIPT)
        cu_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(cu_module)

        # Test the detect_project_location function exists and returns a non-empty string
        if hasattr(cu_module, "detect_project_location"):
            env_no_override = os.environ.copy()
            env_no_override.pop("EVOLVE_PROJECT_LOCATION", None)
            loc = cu_module.detect_project_location()
            if loc and isinstance(loc, str) and len(loc) > 0:
                print(f"PASS test 3: detect_project_location() returns non-empty: {loc}")
            else:
                failures.append(f"FAIL test 3: detect_project_location() returned empty or None: {loc!r}")
        else:
            failures.append("FAIL test 3: detect_project_location function not found in module")

        # --- Test 4: create_unit accepts project_location parameter ---
        if hasattr(cu_module, "create_unit"):
            try:
                uid2 = cu_module.create_unit(
                    title="Test 2", action="Test action 2", confidence=0.80,
                    domain="testing", scope="project", project_location="/explicit/path"
                )
                unit_file2 = os.path.join(test_vault, "evolve", "units", f"{uid2}.md")
                if os.path.exists(unit_file2):
                    with open(unit_file2) as f:
                        content2 = f.read()
                    if "/explicit/path" in content2:
                        print("PASS test 4: create_unit() accepts project_location parameter")
                    else:
                        failures.append("FAIL test 4: project_location not written by create_unit()")
                else:
                    failures.append(f"FAIL test 4: unit file not created: {unit_file2}")
            except TypeError:
                failures.append("FAIL test 4: create_unit() does not accept project_location parameter")

        # --- Test 5: tags field exists in unit frontmatter ---
        if os.path.exists(unit_file):
            with open(unit_file) as f:
                content = f.read()
            if "tags:" in content:
                print("PASS test 5: tags field exists in unit frontmatter")
            else:
                failures.append("FAIL test 5: tags field missing from unit frontmatter")

        # --- Test 6: tags contain expected evolve schema [evolve, unit, topic/<domain>] ---
        if os.path.exists(unit_file):
            with open(unit_file) as f:
                content = f.read()
            if "[evolve, unit, topic/workflow]" in content:
                print("PASS test 6: tags follow schema [evolve, unit, topic/workflow]")
            else:
                failures.append("FAIL test 6: tags do not follow expected schema")

    finally:
        # Cleanup
        import shutil
        shutil.rmtree(test_vault, ignore_errors=True)

    if failures:
        print("\nFailures:")
        for f in failures:
            print(f)
        sys.exit(1)

    print("\nAll create-unit.py tests passed!")
    sys.exit(0)

if __name__ == "__main__":
    run_test()
