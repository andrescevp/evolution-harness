export type FrontmatterValue = string | number | string[]
export type Frontmatter = Record<string, FrontmatterValue>

export interface ParsedNote {
  readonly frontmatter: Frontmatter
  readonly body: string
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/

/** Parse a note's YAML frontmatter subset and return it with the body. */
export function parseNote(content: string): ParsedNote {
  const match = content.match(FRONTMATTER)
  if (!match) return { frontmatter: {}, body: content }

  return {
    frontmatter: parseBlock(match[1]),
    body: content.slice(match[0].length).replace(/^\n+/, ""),
  }
}

export function getString(
  frontmatter: Frontmatter,
  key: string,
  fallback = "",
): string {
  const value = frontmatter[key]
  if (typeof value === "string") return value
  if (typeof value === "number") return String(value)
  return fallback
}

export function getNumber(
  frontmatter: Frontmatter,
  key: string,
  fallback: number,
): number {
  const value = frontmatter[key]
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseBlock(raw: string): Frontmatter {
  const result: Frontmatter = {}
  let pendingKey: string | null = null

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trimEnd()
    if (!line.trim() || line.trimStart().startsWith("#")) continue

    const item = line.match(/^\s+-\s+(.*)$/)
    if (item && pendingKey) {
      const current = result[pendingKey]
      const list = Array.isArray(current) ? current : []
      list.push(unquote(item[1].trim()))
      result[pendingKey] = list
      continue
    }

    const pair = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/)
    if (!pair) continue

    const key = pair[1]
    const value = pair[2].trim()
    pendingKey = key

    if (value === "") {
      result[key] = []
    } else if (value.startsWith("[") && value.endsWith("]")) {
      result[key] = parseInlineList(value)
    } else {
      result[key] = parseScalar(value)
    }
  }

  return result
}

function parseInlineList(value: string): string[] {
  const inner = value.slice(1, -1).trim()
  if (!inner) return []
  return inner.split(",").map((part) => unquote(part.trim()))
}

function parseScalar(value: string): string | number {
  const unquoted = unquote(value)
  if (unquoted !== value) return unquoted
  if (/^-?(?:\d+|\d*\.\d+)$/.test(value)) return Number(value)
  return value
}

function unquote(value: string): string {
  if (value.startsWith('"') && value.endsWith('"') && value.length >= 2) {
    return value
      .slice(1, -1)
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
  }
  if (value.startsWith("'") && value.endsWith("'") && value.length >= 2) {
    return value.slice(1, -1).replace(/''/g, "'")
  }
  return value
}
