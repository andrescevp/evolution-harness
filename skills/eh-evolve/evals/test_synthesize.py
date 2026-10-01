#!/usr/bin/env python3
"""Test: synthesize.py includes project_location in proposal frontmatter."""
import os
import sys
import tempfile
import subprocess

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SYNTHESIZE_SCRIPT = os.path.join(SCRIPT_DIR, "..", "scripts", "synthesize.py")
CREATE_UNIT_SCRIPT = os.path.join(SCRIPT_DIR, "..", "scripts", "create-unit.py")

def run_test():
    failures = []

    # Setup temp vault
    test_vault = tempfile.mkdtemp()
    os.environ["OBSIDIAN_VAULT"] = test_vault
    os.environ["EVOLVE_PROJECT_LOCATION"] = "/tmp/synth-test-project"

    try:
        # Create two units in the same domain so synthesize clusters them
        env = os.environ.copy()
        env["EVOLVE_MIN_CONFIDENCE"] = "0.5"
        env["EVOLVE_MIN_CLUSTER"] = "2"

        for i in range(3):
            result = subprocess.run(
                [sys.executable, CREATE_UNIT_SCRIPT,
                 f"Synthesis test unit {i}",
                 f"Test action for synthesis {i}",
                 "0.75", "synthesis-test", "project"],
                capture_output=True, text=True, env=env,
            )

        # Run synthesize
        result = subprocess.run(
            [sys.executable, SYNTHESIZE_SCRIPT],
            capture_output=True, text=True, env=env,
        )
        output = result.stdout

        # --- Test 1: synthesize produces output ---
        if "proposals" in output.lower() or "Proposals" in output:
            print("PASS test 1: synthesize.py ran and produced output")
        else:
            failures.append(f"FAIL test 1: synthesize.py output unexpected:\n{output}")

        # --- Test 2: proposal files exist and contain project_location ---
        proposals_dir = os.path.join(test_vault, "evolve", "proposals")
        proposal_files = [
            f for f in os.listdir(proposals_dir)
            if f.endswith(".md")
        ] if os.path.isdir(proposals_dir) else []

        if not proposal_files:
            failures.append("FAIL test 2: no proposal files created")
        else:
            found_location = False
            for pf in proposal_files:
                with open(os.path.join(proposals_dir, pf)) as f:
                    content = f.read()
                if "project_location:" in content:
                    if "/tmp/synth-test-project" in content:
                        found_location = True
                        break

            if found_location:
                print("PASS test 2: proposal includes correct project_location")
            else:
                failures.append("FAIL test 2: project_location missing or incorrect in proposals")

        # --- Test 3: synthesize generate_proposal function accepts project_location ---
        sys.path.insert(0, os.path.join(SCRIPT_DIR, "..", "scripts"))
        import importlib.util
        spec = importlib.util.spec_from_file_location("synthesize", SYNTHESIZE_SCRIPT)
        syn_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(syn_module)

        # Build minimal fake units to pass to generate_proposal
        fake_units = [
            {"file": "/fake/unit1.md", "fm": {"id": "evu-fake-001", "confidence": "0.8"}},
            {"file": "/fake/unit2.md", "fm": {"id": "evu-fake-002", "confidence": "0.7"}},
        ]
        if hasattr(syn_module, 'generate_proposal'):
            try:
                # Override PROPOSALS_DIR for the test
                syn_module.PROPOSALS_DIR = os.path.join(test_vault, "evolve", "proposals")
                pid = syn_module.generate_proposal("test-cluster", fake_units, project_location="/explicit/synth-path")
                # Check the written file
                prop_file = os.path.join(test_vault, "evolve", "proposals", f"{pid}.md")
                if os.path.exists(prop_file):
                    with open(prop_file) as f:
                        prop_content = f.read()
                    if "/explicit/synth-path" in prop_content:
                        print("PASS test 3: generate_proposal() accepts project_location parameter")
                    else:
                        failures.append("FAIL test 3: project_location not written by generate_proposal()")
                else:
                    failures.append(f"FAIL test 3: proposal file not created at {prop_file}")
            except TypeError as e:
                failures.append(f"FAIL test 3: generate_proposal() param error: {e}")

        # --- Test 4: tags field exists in proposal frontmatter ---
        proposal_files_for_tags = [
            f for f in os.listdir(os.path.join(test_vault, "evolve", "proposals"))
            if f.endswith(".md")
        ] if os.path.isdir(os.path.join(test_vault, "evolve", "proposals")) else []
        found_tags = False
        found_tags_schema = False
        for pf2 in proposal_files_for_tags:
            with open(os.path.join(test_vault, "evolve", "proposals", pf2)) as f:
                pcontent = f.read()
            if "tags:" in pcontent:
                found_tags = True
            if "[evolve, proposal, topic/" in pcontent:
                found_tags_schema = True
        if found_tags:
            print("PASS test 4: tags field exists in proposal frontmatter")
        else:
            failures.append("FAIL test 4: tags field missing from proposal frontmatter")
        if found_tags_schema:
            print("PASS test 5: tags follow schema [evolve, proposal, topic/<cluster>]")
        else:
            failures.append("FAIL test 5: tags do not follow expected schema")

    finally:
        import shutil
        shutil.rmtree(test_vault, ignore_errors=True)

    if failures:
        print("\nFailures:")
        for f in failures:
            print(f)
        sys.exit(1)

    print("\nAll synthesize.py tests passed!")
    sys.exit(0)

if __name__ == "__main__":
    run_test()
