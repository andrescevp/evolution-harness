import { existsSync } from "node:fs"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { getNumber, getString, parseNote } from "./lib/frontmatter.js"
import { createProposal, type ProposalUnit } from "./lib/notes.js"
import { resolveVaultPaths } from "./lib/paths.js"

interface LoadedUnit {
  readonly id: string
  readonly confidence: number
  readonly domain: string
}

async function main(): Promise<void> {
  const minConfidence = numberFromEnv("EVOLVE_MIN_CONFIDENCE", 0.5)
  const minCluster = numberFromEnv("EVOLVE_MIN_CLUSTER", 2)
  const paths = resolveVaultPaths()

  if (!existsSync(paths.units)) {
    console.log(`Units directory not found: ${paths.units}`)
    return
  }

  const units = await loadUnits(paths.units, minConfidence)
  if (units.length === 0) {
    console.log("No candidate units found with sufficient confidence.")
    return
  }

  const clusters = clusterByDomain(units, minCluster)
  const domains = Object.keys(clusters).sort()
  if (domains.length === 0) {
    console.log(`No clusters found (need >= ${minCluster} units per domain).`)
    return
  }

  console.log(`Found ${units.length} candidate units in ${domains.length} clusters:\n`)
  await mkdir(paths.proposals, { recursive: true })

  for (const domain of domains) {
    const clusterUnits = clusters[domain]
    const proposal = createProposal({
      cluster: domain,
      units: clusterUnits,
      projectLocation: paths.projectLocation,
    })
    await writeFile(join(paths.proposals, `${proposal.id}.md`), proposal.content, "utf8")
    console.log(
      `  ${domain}: ${clusterUnits.length} units (avg confidence: ${average(clusterUnits).toFixed(2)}) -> ${proposal.id}`,
    )
  }

  console.log(`\nProposals saved to ${paths.proposals}/`)
}

async function loadUnits(directory: string, minConfidence: number): Promise<LoadedUnit[]> {
  const files = (await readdir(directory)).filter((file) => file.endsWith(".md"))
  const units: LoadedUnit[] = []

  for (const file of files) {
    const { frontmatter } = parseNote(await readFile(join(directory, file), "utf8"))
    if (getString(frontmatter, "status") !== "candidate") continue
    if (getNumber(frontmatter, "confidence", 0) < minConfidence) continue

    units.push({
      id: getString(frontmatter, "id", file.replace(/\.md$/, "")),
      confidence: getNumber(frontmatter, "confidence", 0),
      domain: getString(frontmatter, "domain", "general") || "general",
    })
  }

  return units
}

function clusterByDomain(
  units: readonly LoadedUnit[],
  minCluster: number,
): Record<string, ProposalUnit[]> {
  const clusters: Record<string, ProposalUnit[]> = {}

  for (const unit of units) {
    const cluster = clusters[unit.domain] ?? (clusters[unit.domain] = [])
    cluster.push({ id: unit.id, confidence: unit.confidence })
  }

  for (const domain of Object.keys(clusters)) {
    if (clusters[domain].length < minCluster) delete clusters[domain]
  }

  return clusters
}

function average(units: readonly ProposalUnit[]): number {
  return units.reduce((sum, unit) => sum + unit.confidence, 0) / units.length
}

function numberFromEnv(name: string, fallback: number): number {
  const raw = process.env[name]
  if (raw === undefined || raw.trim() === "") return fallback
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
