import assert from "node:assert/strict"
import { execFileSync, spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { parseNote } from "../scripts/lib/frontmatter.js"
import { createUnit } from "../scripts/lib/notes.js"

const createUnitScript = fileURLToPath(new URL("../scripts/create-unit.js", import.meta.url))

function runCreateUnit(vault: string, args: string[]): string {
  return execFileSync(process.execPath, [createUnitScript, ...args], {
    encoding: "utf8",
    env: {
      ...process.env,
      OBSIDIAN_VAULT: vault,
      EVOLVE_PROJECT_LOCATION: "/tmp/test-project",
    },
  }).trim()
}

test("create-unit writes a unit with the complete frontmatter schema", async () => {
  const vault = await mkdtemp(join(tmpdir(), "evolve-unit-"))
  try {
    const id = runCreateUnit(vault, [
      "Test unit",
      "Test action",
      "0.75",
      "workflow",
      "project",
      "obs-001",
      "obs-002",
    ])
    const content = await readFile(join(vault, "evolve", "units", `${id}.md`), "utf8")
    const { frontmatter, body } = parseNote(content)

    assert.match(id, /^evu-\d{8}-[0-9a-f]{6}$/)
    assert.equal(frontmatter.kind, "evolve-unit")
    assert.equal(frontmatter.confidence, 0.75)
    assert.equal(frontmatter.scope, "project")
    assert.equal(frontmatter.domain, "workflow")
    assert.equal(frontmatter.client, "opencode")
    assert.equal(frontmatter.status, "candidate")
    assert.equal(frontmatter.project_location, "/tmp/test-project")
    assert.deepEqual(frontmatter.tags, ["evolve", "unit", "topic/workflow"])
    assert.deepEqual(frontmatter.evidence, ["[[obs-001]]", "[[obs-002]]"])
    assert.deepEqual(frontmatter.targets, ["skill"])
    assert.match(body, /# Test unit/)
  } finally {
    await rm(vault, { recursive: true, force: true })
  }
})

test("create-unit accepts an explicit project_location", () => {
  const note = createUnit({
    title: "Explicit location",
    action: "Use an explicit project path",
    confidence: 0.8,
    domain: "testing",
    projectLocation: "/explicit/path",
  })
  const { frontmatter } = parseNote(note.content)

  assert.equal(frontmatter.project_location, "/explicit/path")
  assert.deepEqual(frontmatter.tags, ["evolve", "unit", "topic/testing"])
  assert.deepEqual(frontmatter.evidence, [])
})

test("create-unit rejects an out-of-range confidence", () => {
  const result = spawnSync(
    process.execPath,
    [createUnitScript, "Bad unit", "Bad action", "1.5"],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        OBSIDIAN_VAULT: join(tmpdir(), "evolve-unit-invalid"),
        EVOLVE_PROJECT_LOCATION: "/tmp/test-project",
      },
    },
  )

  assert.equal(result.status, 1)
  assert.match(result.stderr, /confidence must be between 0 and 1/)
})
