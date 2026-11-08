import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { parseNote } from "../scripts/lib/frontmatter.js"

const captureScript = fileURLToPath(new URL("../scripts/capture.js", import.meta.url))
const longToken = "A".repeat(48)

function runCapture(vault: string, args: string[], extraEnv: NodeJS.ProcessEnv = {}): string {
  return execFileSync(process.execPath, [captureScript, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      OBSIDIAN_VAULT: vault,
      EVOLVE_PROJECT_LOCATION: "/tmp/capture-project",
      ...extraEnv,
    },
  }).trim()
}

test("capture writes an observation with project_location and tags", async () => {
  const vault = await mkdtemp(join(tmpdir(), "evolve-capture-"))
  try {
    const id = runCapture(vault, [
      "test-agent",
      "Implemented TDD Workflow!",
      "test-context",
      "test-outcome",
    ])
    const content = await readFile(join(vault, "evolve", "observations", `${id}.md`), "utf8")
    const { frontmatter, body } = parseNote(content)

    assert.match(id, /^obs-\d{8}-\d{6}-\d{3}$/)
    assert.equal(frontmatter.kind, "observation")
    assert.equal(frontmatter.agent, "test-agent")
    assert.equal(frontmatter.action, "Implemented TDD Workflow!")
    assert.equal(frontmatter.project_location, "/tmp/capture-project")
    assert.deepEqual(frontmatter.tags, [
      "evolve",
      "observation",
      "topic/implemented-tdd-workflow",
    ])
    assert.equal(frontmatter.outcome, "test-outcome")
    assert.match(body, /# test-agent: Implemented TDD Workflow!/)
  } finally {
    await rm(vault, { recursive: true, force: true })
  }
})

test("capture sanitizes secrets and opaque tokens", async () => {
  const vault = await mkdtemp(join(tmpdir(), "evolve-capture-"))
  try {
    const id = runCapture(vault, [
      "observer",
      "debug-session",
      `PASSWORD=supersecret token ${longToken}`,
      "TOKEN=another-secret",
    ])
    const content = await readFile(join(vault, "evolve", "observations", `${id}.md`), "utf8")

    assert.doesNotMatch(content, /supersecret/)
    assert.doesNotMatch(content, /another-secret/)
    assert.doesNotMatch(content, new RegExp(longToken))
    assert.match(content, /\[REDACTED\]/)
    assert.match(content, /\[REDACTED_TOKEN\]/)
  } finally {
    await rm(vault, { recursive: true, force: true })
  }
})

test("capture honors EVOLVE_PROJECT_LOCATION", async () => {
  const vault = await mkdtemp(join(tmpdir(), "evolve-capture-"))
  try {
    const id = runCapture(
      vault,
      ["agent", "action", "context", "outcome"],
      { EVOLVE_PROJECT_LOCATION: "/custom/project/path" },
    )
    const content = await readFile(join(vault, "evolve", "observations", `${id}.md`), "utf8")
    const { frontmatter } = parseNote(content)
    assert.equal(frontmatter.project_location, "/custom/project/path")
  } finally {
    await rm(vault, { recursive: true, force: true })
  }
})
