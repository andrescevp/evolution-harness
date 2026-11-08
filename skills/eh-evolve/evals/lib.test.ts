import assert from "node:assert/strict"
import test from "node:test"
import { parseNote } from "../scripts/lib/frontmatter.js"
import { createObservation, createUnit } from "../scripts/lib/notes.js"
import { sanitize, slugify } from "../scripts/lib/sanitize.js"

test("parseNote reads scalars, inline lists, and block lists", () => {
  const { frontmatter, body } = parseNote(
    [
      "---",
      "kind: evolve-unit",
      "confidence: 0.72",
      'project_location: "/home/user/project"',
      "tags: [evolve, unit, topic/testing]",
      "evidence:",
      "  - [[obs-001]]",
      "  - [[obs-002]]",
      "---",
      "# Title",
      "Body",
    ].join("\n"),
  )

  assert.equal(frontmatter.kind, "evolve-unit")
  assert.equal(frontmatter.confidence, 0.72)
  assert.equal(frontmatter.project_location, "/home/user/project")
  assert.deepEqual(frontmatter.tags, ["evolve", "unit", "topic/testing"])
  assert.deepEqual(frontmatter.evidence, ["[[obs-001]]", "[[obs-002]]"])
  assert.match(body, /^# Title/)
})

test("parseNote tolerates a missing frontmatter block", () => {
  const parsed = parseNote("# Plain note\n")
  assert.deepEqual(parsed.frontmatter, {})
  assert.equal(parsed.body, "# Plain note\n")
})

test("sanitize redacts assignments and long opaque tokens", () => {
  const text = sanitize(`API_KEY=secret ${"x".repeat(40)} plain`)
  assert.doesNotMatch(text, /secret/)
  assert.doesNotMatch(text, /x{40}/)
  assert.match(text, /\[REDACTED\]/)
  assert.match(text, /\[REDACTED_TOKEN\]/)
})

test("slugify produces a stable topic tag", () => {
  assert.equal(slugify("Implemented TDD Workflow!"), "implemented-tdd-workflow")
  assert.equal(slugify("  ---  "), "")
})

test("createObservation is deterministic when time and randomness are injected", () => {
  const now = new Date(2026, 4, 28, 14, 30, 22)
  const note = createObservation({
    agent: "build-agent",
    action: "implemented TDD workflow",
    context: "context",
    outcome: "outcome",
    projectLocation: "/project",
    now,
    random: () => 0.123,
  })

  assert.equal(note.id, "obs-20260528-143022-123")
  assert.match(note.content, /project_location: "\/project"/)
  assert.match(note.content, /tags: \[evolve, observation, topic\/implemented-tdd-workflow\]/)
})

test("createUnit rejects invalid confidence values", () => {
  assert.throws(
    () =>
      createUnit({
        title: "title",
        action: "action",
        confidence: 1.1,
        projectLocation: "/project",
      }),
    /confidence must be between 0 and 1/,
  )
})
