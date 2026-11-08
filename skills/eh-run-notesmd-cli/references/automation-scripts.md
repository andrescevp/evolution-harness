# Automation Scripts

All examples are TypeScript for Node >= 22.18 (native type stripping) or the
compiled JavaScript output. Run them from the directory where you save them.

## Daily standup log

Save as `scripts/daily-standup.ts`:

```ts
import { execFileSync } from "node:child_process"

const [yesterday = "", today = "", blockers = "none"] = process.argv.slice(2)
const date = new Date().toISOString().slice(0, 10)
const entry = `## Standup ${date}
- Yesterday: ${yesterday}
- Today: ${today}
- Blockers: ${blockers}`

execFileSync("notesmd-cli", ["daily", "--content", entry], { stdio: "inherit" })
```

Usage: `node scripts/daily-standup.ts "Deployed v2.3" "Start refactor" "Waiting on API keys"`

## Bulk tag manager

Save as `scripts/bulk-tag.ts`:

```ts
import { execFileSync } from "node:child_process"

const [tag, searchTerm] = process.argv.slice(2)
if (!tag || !searchTerm) {
  console.error("Usage: node scripts/bulk-tag.ts <tag> <search-term> [vault]")
  process.exit(1)
}

const vault = process.argv[4]
const searchArgs = ["search-content", searchTerm, "--format", "json", "--no-interactive"]
if (vault) searchArgs.push("--vault", vault)

const results = JSON.parse(
  execFileSync("notesmd-cli", searchArgs, { encoding: "utf8" }),
) as Array<{ name?: string }>

for (const result of results) {
  if (!result.name) continue
  execFileSync(
    "notesmd-cli",
    ["frontmatter", result.name, "--edit", "--key", "tags", "--value", `[${tag}]`],
    { stdio: "inherit" },
  )
  console.log(`Tagged: ${result.name}`)
}
```

## Metadata report

Save as `scripts/metadata-report.ts`:

```ts
import { execFileSync } from "node:child_process"
import { basename } from "node:path"

const vaultPath = process.argv[2] ?? `${process.env.HOME}/vaults/main`
const vault = basename(vaultPath)

console.log("# Vault Metadata Report")
console.log(`Generated: ${new Date().toISOString()}`)
console.log("")

const notes = execFileSync("notesmd-cli", ["list", "--vault", vault], {
  encoding: "utf8",
})
  .split("\n")
  .filter(Boolean)

for (const note of notes) {
  const title = basename(note, ".md")
  const frontmatter = execFileSync("notesmd-cli", ["frontmatter", note, "--print"], {
    encoding: "utf8",
  })
  const tags =
    frontmatter
      .split("\n")
      .find((line) => line.startsWith("tags:"))
      ?.slice(5)
      .trim() || "none"
  console.log(`- **${title}** | tags: ${tags}`)
}
```

## Create note from template

Save as `scripts/template-note.ts`:

```ts
import { execFileSync } from "node:child_process"
import { readFileSync } from "node:fs"

const [template, noteName, title = noteName] = process.argv.slice(2)
if (!template || !noteName) {
  console.error("Usage: node scripts/template-note.ts <template> <note-name> [title]")
  process.exit(1)
}

let content: string
try {
  content = readFileSync(template, "utf8")
} catch {
  console.error(`Template not found: ${template}`)
  process.exit(1)
}

const date = new Date().toISOString().slice(0, 10)
content = content.replaceAll("{{TITLE}}", title).replaceAll("{{DATE}}", date)

execFileSync("notesmd-cli", ["create", noteName, "--content", content, "--open", "--editor"], {
  stdio: "inherit",
})
```
