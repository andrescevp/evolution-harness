// Functional smoke test for the OpenCode V2 plugin.
// Imports ./index.ts (Node >= 22.18 type stripping) and runs setup() against a
// mock ctx that records registered skills and commands.
// Usage: node scripts/test-plugin.ts
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import type { Skill } from "@opencode/plugin"

const require = createRequire(import.meta.url)
const pluginPath = fileURLToPath(new URL("../index.ts", import.meta.url))

// Node's TS loader resolves bare imports via node_modules lookup from the
// importing directory; make sure the plugin's node_modules is reachable.
const pluginPkg = require("../node_modules/@opencode/plugin/package.json") as {
  version: string
}
console.log(`[test] @opencode/plugin resolved: ${pluginPkg.version}`)

const { default: plugin } = (await import(pluginPath)) as typeof import("../index.ts")
if (plugin.id !== "evolution-harness") throw new Error(`unexpected plugin id: ${plugin.id}`)
if (typeof plugin.setup !== "function") throw new Error("setup is not a function")

interface RegisteredCommand {
  name: string
  description?: string
  execute: (input: unknown) => Promise<void>
}

const registered: { skills: Skill.Info[]; commands: RegisteredCommand[] } = {
  skills: [],
  commands: [],
}
const skillEditor = { add: (skill: Skill.Info) => registered.skills.push(skill) }
const commandEditor = { add: (command: RegisteredCommand) => registered.commands.push(command) }
const ctx = {
  skill: {
    transform: async (callback: (editor: typeof skillEditor) => void) => callback(skillEditor),
  },
  command: {
    transform: async (callback: (editor: typeof commandEditor) => void) =>
      callback(commandEditor),
  },
  session: { prompt: async () => {} },
} as unknown as Parameters<typeof plugin.setup>[0]

await plugin.setup(ctx)

const skillIds = registered.skills.map((skill) => skill.id).sort()
const commandNames = registered.commands.map((command) => command.name).sort()
console.log(`[test] skills  : ${skillIds.join(", ")}`)
console.log(`[test] commands: ${commandNames.join(", ")}`)

const expectSkills = ["eh-evolve", "eh-run-notesmd-cli", "eh-state-sync"]
const expectCommands = ["evolve-promote", "evolve-status", "evolve-synthesize"]
const assertSame = (got: readonly string[], want: readonly string[]): void => {
  if (got.length !== want.length || got.some((value, index) => value !== want[index])) {
    throw new Error(`expected [${want.join(", ")}] got [${got.join(", ")}]`)
  }
}
assertSame(skillIds, expectSkills)
assertSame(commandNames, expectCommands)

const evolve = registered.skills.find((skill) => skill.id === "eh-evolve")
if (!evolve) throw new Error("eh-evolve skill not registered")
if (!evolve.path.endsWith("skills/eh-evolve")) throw new Error(`bad skill path: ${evolve.path}`)
if (!evolve.content.includes("The Evolution Model")) {
  throw new Error("skill content missing body")
}
if (!evolve.content.includes("Skill base directory")) {
  throw new Error("skill content missing bundle note")
}

const status = registered.commands.find((command) => command.name === "evolve-status")
if (!status) throw new Error("evolve-status command not registered")
if (!status.description?.includes("evolution units")) {
  throw new Error("command description missing")
}
if (typeof status.execute !== "function") throw new Error("command execute missing")

console.log("[test] PASS — plugin registers all skills and commands from the repo root")
