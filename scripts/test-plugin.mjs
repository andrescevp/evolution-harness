// test-plugin.mjs — functional smoke test for the OpenCode V2 plugin.
// Imports ./index.ts (Node ≥ 23.6 type-stripping) and runs setup() against a
// mock ctx that records registered skills and commands.
// Usage: node scripts/test-plugin.mjs
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"

const require = createRequire(import.meta.url)
const pluginPath = fileURLToPath(new URL("../index.ts", import.meta.url))

// Node's TS loader resolves bare imports via node_modules lookup from the
// importing directory; make sure the plugin's node_modules is reachable.
const pluginPkg = require("../node_modules/@opencode/plugin/package.json")
console.log(`[test] @opencode/plugin resolved: ${pluginPkg.version}`)

const { default: plugin } = await import(pluginPath)
if (plugin.id !== "evolution-harness") throw new Error(`unexpected plugin id: ${plugin.id}`)
if (typeof plugin.setup !== "function") throw new Error("setup is not a function")

const registered = { skills: [], commands: [] }
const skillEditor = { add: (s) => registered.skills.push(s) }
const commandEditor = { add: (c) => registered.commands.push(c) }
const ctx = {
  skill: { transform: async (cb) => cb(skillEditor) },
  command: { transform: async (cb) => cb(commandEditor) },
  session: { prompt: async () => {} },
}

await plugin.setup(ctx)

const skillIds = registered.skills.map((s) => s.id).sort()
const commandNames = registered.commands.map((c) => c.name).sort()
console.log(`[test] skills  : ${skillIds.join(", ")}`)
console.log(`[test] commands: ${commandNames.join(", ")}`)

const expectSkills = ["evolve", "run-notesmd-cli", "state-sync"]
const expectCommands = ["evolve-promote", "evolve-status", "evolve-synthesize"]
const assertSame = (got, want) => {
  if (got.length !== want.length || got.some((v, i) => v !== want[i])) {
    throw new Error(`expected [${want.join(", ")}] got [${got.join(", ")}]`)
  }
}
assertSame(skillIds, expectSkills)
assertSame(commandNames, expectCommands)

const evolve = registered.skills.find((s) => s.id === "evolve")
if (!evolve.path.endsWith("skills/evolve")) throw new Error(`bad skill path: ${evolve.path}`)
if (!evolve.content.includes("The Evolution Model")) throw new Error(`skill content missing body`)
if (!evolve.content.includes("Skill base directory")) throw new Error(`skill content missing bundle note`)

const status = registered.commands.find((c) => c.name === "evolve-status")
if (!status.description.includes("evolution units")) throw new Error(`command description missing`)
if (typeof status.execute !== "function") throw new Error(`command execute missing`)

console.log("[test] PASS — plugin registers all skills and commands from the repo root")