import { Plugin, type Skill } from "@opencode/plugin"
import { existsSync } from "node:fs"
import { readdir, readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { fileURLToPath } from "node:url"

/**
 * evolution-harness — OpenCode V2 plugin.
 *
 * The repository root IS the plugin package: index.ts bundles the plugin
 * entry (package.json exposes "." -> ./index.ts), and the evolution harness
 * content lives next to it:
 *   skills/<name>/SKILL.md   → ctx.skill  (eh-evolve, eh-state-sync, eh-run-notesmd-cli)
 *   commands/<name>.md       → ctx.command (evolve-status, evolve-synthesize, evolve-promote)
 *
 * Agents cannot be registered through the plugin API (AgentEditor has no
 * `add`), so they are installed via conventional directories by install.sh
 * (~/.config/opencode/agents/). Skills are registered with `path` set to
 * the skill directory so bundled scripts/references stay resolvable.
 */

const PLUGIN_ID = "evolution-harness"
const EXPECTED_SKILLS = ["eh-evolve", "eh-state-sync", "eh-run-notesmd-cli"]

interface ParsedFrontmatter {
  name?: string
  description: string
  body: string
}

function parseFrontmatter(text: string): ParsedFrontmatter {
  const lines = text.split(/\r?\n/)
  if (lines[0]?.trim() !== "---") {
    return { description: "", body: text }
  }
  const end = lines.findIndex((line, i) => i > 0 && line.trim() === "---")
  if (end === -1) return { description: "", body: text }

  const fm = lines.slice(1, end)
  const body = lines.slice(end + 1).join("\n").replace(/^\n+/, "")
  let name: string | undefined
  let description = ""
  let folded: string[] | null = null

  for (const line of fm) {
    if (folded) {
      if (/^\s{2,}/.test(line)) {
        folded.push(line.trim())
        continue
      }
      description = folded.join(" ")
      folded = null
    }
    if (line.startsWith("name:")) {
      name = line.slice(5).trim()
    } else if (line.startsWith("description:")) {
      const value = line.slice(12).trim()
      if (value === ">" || value === ">-" || value === "|" || value === "|-") {
        folded = []
      } else {
        description = value
      }
    }
  }
  if (folded) description = folded.join(" ")
  return { name, description, body }
}

async function loadSkills(root: string) {
  const skillNames = (await readdir(join(root, "skills"), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((name) => !name.startsWith("."))

  const skills: Skill.Info[] = []
  for (const skillName of skillNames) {
    const dir = join(root, "skills", skillName)
    const file = join(dir, "SKILL.md")
    if (!existsSync(file)) continue
    const { name, description, body } = parseFrontmatter(await readFile(file, "utf8"))
    const id = name ?? skillName
    skills.push({
      id: id as Skill.Info["id"],
      name: id as Skill.Info["name"],
      description: description || `${id} skill from the evolution harness`,
      path: dir as Skill.Info["path"],
      content:
        `> Bundled by the evolution-harness plugin. Skill base directory (scripts/, references/): ${dir}\n\n` +
        body,
    })
  }
  return skills
}

async function loadCommands(root: string) {
  const files = (await readdir(join(root, "commands"))).filter((file) => file.endsWith(".md"))
  const commands: Array<{ name: string; description: string; body: string }> = []
  for (const file of files) {
    const { name, description, body } = parseFrontmatter(await readFile(join(root, "commands", file), "utf8"))
    commands.push({ name: name ?? file.replace(/\.md$/, ""), description, body })
  }
  return commands
}

/** Locate the repository root that bundles skills/ and commands/. */
function resolveRoot(): string | undefined {
  const here = resolve(fileURLToPath(new URL(".", import.meta.url)))
  const candidates: string[] = []
  if (process.env.EVOLVE_HARNESS_ROOT) candidates.push(resolve(process.env.EVOLVE_HARNESS_ROOT))
  candidates.push(here, resolve(here, ".."))
  return candidates.find((candidate) => {
    return EXPECTED_SKILLS.every((skill) => existsSync(join(candidate, "skills", skill, "SKILL.md")))
  })
}

export default Plugin.define({
  id: PLUGIN_ID,
  async setup(ctx) {
    const root = resolveRoot()
    if (!root) {
      console.error(`[${PLUGIN_ID}] repository root not found — skills/commands not registered`)
      return
    }

    const [skills, commands] = await Promise.all([loadSkills(root), loadCommands(root)])

    if (skills.length > 0) {
      await ctx.skill.transform((editor) => {
        for (const skill of skills) editor.add(skill)
      })
    }

    if (commands.length > 0) {
      await ctx.command.transform((editor) => {
        for (const command of commands) {
          editor.add({
            name: command.name,
            description:
              command.description || `Run the ${command.name} evolution harness command`,
            execute: async ({ sessionID, prompt, delivery }) => {
              const text = `${command.body}\n\n${prompt.text}`.trim()
              await ctx.session.prompt({ ...prompt, sessionID, text, delivery })
            },
          })
        }
      })
    }

    console.log(
      `[${PLUGIN_ID}] registered ${skills.length} skill(s) and ${commands.length} command(s) from ${root}`,
    )
  },
})