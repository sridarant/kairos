/**
 * /lib/utils/nanoid.js — Minimal ID generator. No dependencies.
 *
 * Moved here from src/lib/nanoid.js in Sprint 3 to eliminate the reverse
 * dependency: lib/recommendations/recommendationBuilder.js was importing
 * from src/, violating the layer architecture (lib must not import from src).
 *
 * src/lib/nanoid.js now re-exports from here for any remaining src callers.
 */
export function nanoid(size = 12) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let id = ''
  for (let i = 0; i < size; i++) id += chars[Math.floor(Math.random() * chars.length)]
  return id
}
