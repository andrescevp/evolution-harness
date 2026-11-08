import { randomUUID } from "node:crypto"
import { sanitize, slugify, yamlString } from "./sanitize.js"

export interface Note {
  readonly id: string
  readonly content: string
}

export interface ObservationInput {
  readonly agent: string
  readonly action: string
  readonly context?: string
  readonly outcome?: string
  readonly projectLocation: string
  readonly id?: string
  readonly now?: Date
  readonly random?: () => number
}

export interface UnitInput {
  readonly title: string
  readonly action: string
  readonly confidence: number
  readonly domain?: string
  readonly scope?: string
  readonly evidence?: readonly string[]
  readonly client?: string
  readonly targets?: readonly string[]
  readonly projectLocation: string
  readonly id?: string
  readonly now?: Date
}

export interface ProposalUnit {
  readonly id: string
  readonly confidence: number
}

export interface ProposalInput {
  readonly cluster: string
  readonly units: readonly ProposalUnit[]
  readonly projectLocation: string
  readonly now?: Date
}

/** Create a sanitized observation note. */
export function createObservation(input: ObservationInput): Note {
  const now = input.now ?? new Date()
  const context = sanitize(input.context ?? "")
  const outcome = sanitize(input.outcome ?? "")
  const topic = slugify(input.action) || "general"
  const id = input.id ?? observationId(now, input.random ?? Math.random)

  const content = [
    "---",
    "kind: observation",
    `id: ${id}`,
    `agent: ${input.agent}`,
    `action: ${input.action}`,
    `date: ${formatDate(now)}`,
    `timestamp: ${formatTimestamp(now)}`,
    `project_location: ${yamlString(input.projectLocation)}`,
    `tags: [evolve, observation, topic/${topic}]`,
    `outcome: ${yamlString(outcome)}`,
    "---",
    "",
    `# ${input.agent}: ${input.action}`,
    "",
    "## Context",
    context,
    "",
    "## Outcome",
    outcome,
    "",
  ].join("\n")

  return { id, content }
}

/** Create a confidence-weighted evolution unit note. */
export function createUnit(input: UnitInput): Note {
  const now = input.now ?? new Date()
  const confidence = input.confidence
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    throw new Error(`confidence must be between 0 and 1 (got ${confidence})`)
  }

  const domain = input.domain || "workflow"
  const evidence = input.evidence ?? []
  const targets = input.targets ?? ["skill"]
  const id = input.id ?? `evu-${formatCompactDate(now)}-${randomUUID().replace(/-/g, "").slice(0, 6)}`
  const evidenceLinks = evidence.map((entry) => `  - [[${entry}]]`).join("\n")

  const content = [
    "---",
    "kind: evolve-unit",
    `id: ${id}`,
    `confidence: ${confidence}`,
    `scope: ${input.scope || "project"}`,
    `domain: ${domain}`,
    `client: ${input.client || "opencode"}`,
    "source: session-observation",
    `project_location: ${yamlString(input.projectLocation)}`,
    `tags: [evolve, unit, topic/${slugify(domain) || "general"}]`,
    `evidence:${evidence.length ? `\n${evidenceLinks}` : " []"}`,
    "status: candidate",
    `targets:\n${targets.map((target) => `  - ${target}`).join("\n")}`,
    `created: ${formatDate(now)}`,
    "---",
    `# ${input.title}`,
    "",
    "## Action",
    input.action,
    "",
    "## Evidence",
    evidenceLinks || "_(pending evidence links)_",
    "",
  ].join("\n")

  return { id, content }
}

/** Create a synthesis proposal for a cluster of evolution units. */
export function createProposal(input: ProposalInput): Note {
  if (input.units.length === 0) {
    throw new Error("a proposal needs at least one unit")
  }

  const now = input.now ?? new Date()
  const clusterSlug = slugify(input.cluster) || "general"
  const id = `prop-${formatCompactDate(now)}-${clusterSlug}`
  const average =
    input.units.reduce((sum, unit) => sum + unit.confidence, 0) / input.units.length
  const unitLinks = input.units.map((unit) => `- [[${unit.id}]]`).join("\n")

  const suggestions: string[] = []
  if (["workflow", "git", "testing"].includes(clusterSlug)) {
    suggestions.push("- **Command**: /evolve-synthesize could trigger automated clustering")
  }
  if (["code-style", "documentation", "testing"].includes(clusterSlug)) {
    suggestions.push(`- **Skill**: New skill for ${clusterSlug} conventions`)
  }

  const content = [
    "---",
    "kind: synthesis-proposal",
    `id: ${id}`,
    `cluster: ${yamlString(input.cluster)}`,
    `unit_count: ${input.units.length}`,
    `avg_confidence: ${average.toFixed(2)}`,
    "status: proposed",
    `date: ${formatDate(now)}`,
    `project_location: ${yamlString(input.projectLocation)}`,
    `tags: [evolve, proposal, topic/${clusterSlug}]`,
    "---",
    `# Synthesis Proposal: ${input.cluster}`,
    "",
    "## Source Units",
    unitLinks,
    "",
    "## Summary",
    `${input.units.length} evolution units in domain "${input.cluster}" with average confidence ${average.toFixed(2)}.`,
    "",
    "## Suggested Artifacts",
    ...(suggestions.length > 0 ? suggestions : ["- Review the cluster and decide the artifact type"]),
    "",
  ].join("\n")

  return { id, content }
}

function observationId(now: Date, random: () => number): string {
  const stamp = `${formatCompactDate(now)}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  const suffix = pad(Math.floor(random() * 1000) % 1000, 3)
  return `obs-${stamp}-${suffix}`
}

function formatCompactDate(date: Date): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`
}

function formatDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function formatTimestamp(date: Date): string {
  const offset = -date.getTimezoneOffset()
  const sign = offset >= 0 ? "+" : "-"
  const absolute = Math.abs(offset)
  return (
    `${formatDate(date)}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.floor(absolute / 60))}:${pad(absolute % 60)}`
  )
}

function pad(value: number, size = 2): string {
  return String(value).padStart(size, "0")
}
