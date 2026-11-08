import { execFileSync } from "node:child_process"
import { join } from "node:path"

/** Resolved locations used by every evolve pipeline script. */
export interface VaultPaths {
  readonly projectLocation: string
  readonly vault: string
  readonly evolve: string
  readonly observations: string
  readonly units: string
  readonly clusters: string
  readonly proposals: string
}

/**
 * Resolve the project root: `EVOLVE_PROJECT_LOCATION` override, then the
 * enclosing git work tree, then the current working directory.
 */
export function detectProjectLocation(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): string {
  const override = env.EVOLVE_PROJECT_LOCATION?.trim()
  if (override) return override

  try {
    const topLevel = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    if (topLevel) return topLevel
  } catch {
    // git is missing or the directory is not a repository
  }

  return cwd
}

/** Resolve every directory the pipeline reads or writes. */
export function resolveVaultPaths(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd(),
): VaultPaths {
  const projectLocation = detectProjectLocation(env, cwd)
  const vault = env.OBSIDIAN_VAULT?.trim() || join(projectLocation, "docs")
  const evolve = join(vault, "evolve")

  return {
    projectLocation,
    vault,
    evolve,
    observations: join(evolve, "observations"),
    units: join(evolve, "units"),
    clusters: join(evolve, "clusters"),
    proposals: join(evolve, "proposals"),
  }
}
