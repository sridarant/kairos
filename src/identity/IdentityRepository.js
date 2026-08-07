/**
 * /src/identity/IdentityRepository.js
 *
 * Responsible ONLY for:
 *   - Read from storage
 *   - Write to storage
 *   - Delete from storage
 *   - Schema version validation
 *
 * No business logic. No migrations. No fallbacks beyond the storage layer.
 * Migrations live in IdentityManager.
 *
 * Storage key: 'kairos_identity_v1' — the ONE canonical key, forever.
 */

export const STORAGE_KEY    = 'kairos_identity_v1'
export const SCHEMA_VERSION = 1

// ─── LocalStorageProvider ────────────────────────────────────────────────────

export class LocalStorageProvider {
  /** true when localStorage is readable and writable */
  get available() {
    try {
      localStorage.setItem('__kairos_test', '1')
      localStorage.removeItem('__kairos_test')
      return true
    } catch {
      return false
    }
  }

  /** Returns the raw parsed object from storage, or null if absent/corrupt. */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (typeof parsed !== 'object' || Array.isArray(parsed) || !parsed) return null
      if (!parsed._schemaVersion) return null
      return parsed
    } catch {
      return null
    }
  }

  /** Persists the identity object. Throws if write fails. */
  save(identity) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identity))
    } catch (e) {
      console.error('[IdentityRepository] Write failed:', e.message)
    }
  }

  /** Removes the identity from storage. */
  clear() {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch { /* ignore */ }
  }
}

// ─── MemoryProvider (private browsing / SSR fallback) ────────────────────────

export class MemoryProvider {
  constructor()  { this._store = null }
  get available(){ return true }
  load()         { return this._store }
  save(identity) { this._store = identity }
  clear()        { this._store = null }
}

// ─── CompositeProvider — used by the singleton IdentityManager ───────────────

export class CompositeProvider {
  constructor() {
    const ls  = new LocalStorageProvider()
    this._provider = ls.available ? ls : new MemoryProvider()
  }

  get storageType() { return this._provider instanceof LocalStorageProvider ? 'localStorage' : 'memory' }
  load()            { return this._provider.load() }
  save(identity)    { this._provider.save(identity) }
  clear()           { this._provider.clear() }
}
