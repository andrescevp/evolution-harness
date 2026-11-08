import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { createUnit } from "./lib/notes.js"
import { resolveVaultPaths } from "./lib/paths.js"

const USAGE = [
  "Usage: create-unit.ts <title> <action> <confidence> [domain] [scope] [evidence_id...]",
  "Example: create-unit.ts 'Prefer plan-first' 'Create plan.md before impl' 0.72 workflow project obs-001 obs-002",
].join("\n")

async function main(): Promise<void> {
  const [title, action, confidenceRaw, domain = "workflow", scope = "project", ...evidence] =
    process.argv.slice(2)

  if (!title || !action || confidenceRaw === undefined || confidenceRaw.trim() === "") {
    console.error(USAGE)
    process.exitCode = 1
    return
  }

  const confidence = Number(confidenceRaw)
  if (!Number.isFinite(confidence)) {
    console.error(`Invalid confidence: ${confidenceRaw}\n${USAGE}`)
    process.exitCode = 1
    return
  }

  const paths = resolveVaultPaths()
  const note = createUnit({
    title,
    action,
    confidence,
    domain,
    scope,
    evidence,
    projectLocation: paths.projectLocation,
  })

  await mkdir(paths.units, { recursive: true })
  await writeFile(join(paths.units, `${note.id}.md`), note.content, "utf8")
  console.log(note.id)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
