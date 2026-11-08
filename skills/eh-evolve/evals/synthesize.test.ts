import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { parseNote } from "../scripts/lib/frontmatter.js"
import { createProposal } from "../scripts/lib/notes.js"

const createUnitScript = fileURLToPath(new URL("../scripts/create-unit.js", import.meta.url))
const synthesizeScript = fileURLToPath(new URL("../scripts/synthesize.js", import.meta.url))

function env(vault: string, extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    OBSIDIAN_VAULT: vault,
    EVOLVE_PROJECT_LOCATION: "/tmp/synth-test-project",
    EVOLVE_MIN_CONFIDENCE: "0.5",
    EVOLVE_MIN_CLUSTER: "2",
    ...extra,
  }
}

function createUnits(vault: string, count: number): void {
  for (let index = 0; index < count; index += 1) {
    execFileSync(
      process.execPath,
      [
        createUnitScript,
        `Synthesis test unit ${index}`,
        `Test action for synthesis ${index}`,
        "0.75",
        "synthesis-test",
        "project",
      ],
      { env: env(vault), encoding: "utf8" },
    )
  }
}

test("synthesize clusters candidate units and writes proposals", async () => {
  const vault = await mkdtemp(join(tmpdir(), "evolve-synth-"))
  try {
    createUnits(vault, 3)
    const output = execFileSync(process.execPath, [synthesizeScript], {
      env: env(vault),
      encoding: "utf8",
    })

    assert.match(output, /Found 3 candidate units/)
    assert.match(output, /Proposals saved to/)

    const proposalsDir = join(vault, "evolve", "proposals")
    const files = (await readdir(proposalsDir)).filter((file) => file.endsWith(".md"))
    assert.equal(files.length, 1)

    const content = await readFile(join(proposalsDir, files[0]), "utf8")
    const { frontmatter } = parseNote(content)
    assert.equal(frontmatter.kind, "synthesis-proposal")
    assert.equal(frontmatter.cluster, "synthesis-test")
    assert.equal(frontmatter.unit_count, 3)
    assert.equal(frontmatter.avg_confidence, 0.75)
    assert.equal(frontmatter.project_location, "/tmp/synth-test-project")
    assert.deepEqual(frontmatter.tags, ["evolve", "proposal", "topic/synthesis-test"])
  } finally {
    await rm(vault, { recursive: true, force: true })
  }
})

test("synthesize reports an empty vault without failing", async () => {
  const vault = await mkdtemp(join(tmpdir(), "evolve-synth-empty-"))
  try {
    const output = execFileSync(process.execPath, [synthesizeScript], {
      env: env(vault),
      encoding: "utf8",
    })
    assert.match(output, /Units directory not found/)
  } finally {
    await rm(vault, { recursive: true, force: true })
  }
})

test("generateProposal accepts an explicit project_location", async () => {
  const vault = await mkdtemp(join(tmpdir(), "evolve-synth-explicit-"))
  try {
    const note = createProposal({
      cluster: "test-cluster",
      units: [
        { id: "evu-fake-001", confidence: 0.8 },
        { id: "evu-fake-002", confidence: 0.7 },
      ],
      projectLocation: "/explicit/synth-path",
    })
    const proposalsDir = join(vault, "evolve", "proposals")
    await mkdir(proposalsDir, { recursive: true })
    const file = join(proposalsDir, `${note.id}.md`)
    await writeFile(file, note.content, "utf8")

    const { frontmatter } = parseNote(await readFile(file, "utf8"))
    assert.equal(frontmatter.project_location, "/explicit/synth-path")
    assert.equal(frontmatter.avg_confidence, 0.75)
  } finally {
    await rm(vault, { recursive: true, force: true })
  }
})
