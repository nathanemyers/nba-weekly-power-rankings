// Maps an old hash-router address like "#/2018-19" to its plain path, or null.
export function legacyHashTarget(
  basename: string,
  hash: string,
  search: string
): string | null {
  if (!hash.startsWith('#/')) return null
  return basename + hash.slice(1) + search
}
