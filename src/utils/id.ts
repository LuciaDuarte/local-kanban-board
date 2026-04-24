/**
 * Generates a unique ID for kanban entities.
 * Uses crypto.randomUUID() where available (all modern browsers).
 *
 * The fallback (Date.now + Math.random) is included only for environments
 * without crypto support (e.g. very old browsers). It is NOT cryptographically
 * random and has a small collision probability under high-frequency creation.
 * It does not protect any security boundary in this app — IDs are only used
 * as local store keys. If this app ever syncs data remotely, replace the
 * fallback with a proper UUID library (e.g. `uuid` npm package).
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
