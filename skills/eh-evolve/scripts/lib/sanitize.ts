const LONG_TOKEN = /[A-Za-z0-9+/=]{40,}/g
const SECRET_ASSIGNMENT = /(SECRET|TOKEN|PASSWORD|API_KEY|CREDENTIAL)=[^ ]+/gi

/**
 * Redact long opaque tokens and `KEY=value` secrets before they reach a note.
 * Mirrors the sed pipeline the shell version used.
 */
export function sanitize(text: string): string {
  return text
    .replace(LONG_TOKEN, "[REDACTED_TOKEN]")
    .replace(SECRET_ASSIGNMENT, "[REDACTED]")
}

/** Turn a free-form action into a slug-safe Obsidian topic tag. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Quote a value for a YAML double-quoted scalar. */
export function yamlString(value: string): string {
  return `"${value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n")}"`
}
