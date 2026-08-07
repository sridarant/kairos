/**
 * /src/identity/IdentityRepository.js
 *
 * Repository abstraction for identity storage.
 * The application never calls localStorage, sessionStorage, or fetch directly.
 * Future providers (Supabase, encrypted storage, cloud sync) implement the same interface.
 *
 * Interface:
 *   load()          → KairosIdentity | null
 *   save(identity)  → void
 *   clear()         → void
 *   export()        → string (JSON)
 *   import(json)    → KairosIdentity | Error
 *
 * Current providers (in priority order):
 *   1. LocalStorageProvider — always-available offline store (authoritative)
 *   2. MemoryProvider       — fallback when localStorage is blocked (private browsing)
 *
 * Future providers attach here without touching IdentityManager or BootstrapManager.
 */

const STORAGE_KEY = 'kairos_identity_v1'
const SCHEMA_VERSION = 1

// ─── LocalStorage provider ────────────────────────────────────────────────────

export class LocalStorageProvider {
  get available() {
    try { localStorage.setItem('__k', '1'); localStorage.removeItem('__k'); return true }
    catch { return false }
  }

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw)
      // Validate schema version for forward compatibility
      if (!parsed?._schemaVersion) return null
      return parsed
    } catch { return null }
  }

  save(identity) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(identity)) }
    catch (e) { console.warn('[IdentityRepository] localStorage write failed:', e.message) }
  }

  clear() {
    try { localStorage.removeItem(STORAGE_KEY) }
    catch { /* ignore */ }
  }

  export() {
    const data = this.load()
    if (!data) throw new Error('No identity to export')
    return JSON.stringify({ ...data, _exportedAt: new Date().toISOString() }, null, 2)
  }

  import(json) {
    try {
      const parsed = JSON.parse(json)
      if (!parsed?._schemaVersion) throw new Error('Invalid Kairos profile format')
      // Strip export metadata before saving
      const { _exportedAt, ...clean } = parsed
      this.save(clean)
      return clean
    } catch (e) {
      throw new Error(`Import failed: ${e.message}`)
    }
  }
}

// ─── Memory provider (private browsing fallback) ──────────────────────────────

export class MemoryProvider {
  constructor() { this._store = null }
  get available() { return true }
  load()         { return this._store }
  save(identity) { this._store = identity }
  clear()        { this._store = null }
  export()       {
    if (!this._store) throw new Error('No identity to export')
    return JSON.stringify({ ...this._store, _exportedAt: new Date().toISOString() }, null, 2)
  }
  import(json)   {
    const parsed = JSON.parse(json)
    if (!parsed?._schemaVersion) throw new Error('Invalid Kairos profile format')
    const { _exportedAt, ...clean } = parsed
    this._store = clean
    return clean
  }
}

// ─── Composite: tries LocalStorage first, falls back to Memory ───────────────

export class CompositeProvider {
  constructor() {
    this._ls  = new LocalStorageProvider()
    this._mem = new MemoryProvider()
    this._primary = this._ls.available ? this._ls : this._mem
  }

  get storageType() { return this._ls.available ? 'localStorage' : 'memory' }
  load()            { return this._primary.load() }
  save(identity)    { this._primary.save(identity) }
  clear()           { this._primary.clear() }
  export()          { return this._primary.export() }
  import(json)      { return this._primary.import(json) }
}

export const SCHEMA_V = SCHEMA_VERSION
