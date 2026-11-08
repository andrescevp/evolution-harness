import { mkdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { createObservation } from "./lib/notes.js"
import { resolveVaultPaths } from "./lib/paths.js"

const args = process.argv.slice(2)
const agent = args[0] || "unknown"
const action = args[1] || "unknown"
const context = args[2] ?? ""
const outcome = args[3] ?? ""

async function main(): Promise<void> {
  const paths = resolveVaultPaths()
  await mkdir(paths.observations, { recursive: true })

  const note = createObservation({
    agent,
    action,
    context,
    outcome,
    projectLocation: paths.projectLocation,
  })
  const file = join(paths.observations, `${note.id}.md`)
  await writeFile(file, note.content, "utf8")

  console.log(note.id)
  console.error(`Observation saved: ${file}`)
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
