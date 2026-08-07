/**
 * /src/identity/IdentityManager.js
 *
 * Single source of truth for user identity.
 * BootstrapManager reads from here — no other module reads localStorage directly.
 *
 * KairosIdentity schema v1:
 * {
 *   _schemaVersion: 1,
 *   _createdAt:     ISO string,
 *   _updatedAt:     ISO string,
 *   uid:            string,       // stable anonymous ID, never changes
 *   profile: {
 *     name:         string,
 *     dob:          "DD-MM-YYYY",
 *     birth_time:   "HH:MM",
 *     birth_place:  string,
 *     timezone:     string,       // IANA tz, e.g. "Asia/Kolkata"
 *     gender:       string | null
 *   },
 *   family:   UserProfile[],       // same shape as profile, type:"family"
 *   prefs: {
 *     theme:        "dark",
 *     notifications: boolean,
 *     language:     "en"
 *   },
 *   appState: {
 *     onboardingComplete: boolean,
 *     feedbackHistory:    object[],
 *     usageStats:         object
 *   }
 * }
 *
 * Architecture contract (enforced by this module):
 *   - IdentityManager is the ONLY writer of identity data
 *   - Future auth providers call attachAuth(authToken) — does NOT change schema
 *   - Cloud sync will add _syncedAt and _syncProvider fields without schema redesign
 *   - Schema migrations run automatically on load via migrateSchema()
 */

import { CompositeProvider, SCHEMA_V } from './IdentityRepository.js'
import { deriveProfileStatus }          from '../app/config/userProfile.js'

// ─── Schema factory ───────────────────────────────────────────────────────────

function newUid() {
  return `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function newIdentity(partial = {}) {
  const now = new Date().toISOString()
  return {
    _schemaVersion: SCHEMA_V,
    _createdAt:     now,
    _updatedAt:     now,
    uid:            newUid(),
    profile: {
      name:       '',
      dob:        '',
      birth_time: '',
      birth_place:'',
      timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone || '',
      gender:     null,
      ...partial.profile
    },
    family:   partial.family   || [],
    prefs:    {
      theme:         'dark',
      notifications: false,
      language:      'en',
      ...partial.prefs
    },
    appState: {
      onboardingComplete: false,
      feedbackHistory:    [],
      usageStats:         { sessions:0, lastOpen:null },
      ...partial.appState
    }
  }
}

// ─── Schema migration (future-proof) ─────────────────────────────────────────

function migrateSchema(raw) {
  if (!raw) return null
  let identity = { ...raw }

  // v0 → v1: old format had flat user_profile array, not a schema-versioned object
  if (!identity._schemaVersion) {
    const oldProfile = Array.isArray(identity.user_profile) ? identity.user_profile[0] : null
    const oldFamily  = Array.isArray(identity.user_profile) ? identity.user_profile.slice(1) : []
    identity = newIdentity({
      profile: oldProfile ? {
        name:       oldProfile.name       || '',
        dob:        oldProfile.dob        || '',
        birth_time: oldProfile.birth_time || '',
      } : undefined,
      family: oldFamily.map(m => ({
        name: m.name || '', dob: m.dob || '', birth_time: m.birth_time || '', type:'family'
      }))
    })
    if (identity.profile.name) identity.appState.onboardingComplete = true
  }

  // Ensure all fields exist (forward-compat for users on older saves)
  identity.profile    ??= {}
  identity.family     ??= []
  identity.prefs      ??= { theme:'dark', notifications:false, language:'en' }
  identity.appState   ??= { onboardingComplete:false, feedbackHistory:[], usageStats:{} }
  identity.appState.feedbackHistory ??= []
  identity.appState.usageStats      ??= { sessions:0, lastOpen:null }
  identity._schemaVersion = SCHEMA_V

  return identity
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateProfile(profile) {
  const errors = []
  if (!profile) return errors

  const name = (profile.name || '').trim()
  if (!name) errors.push('Name is required')
  if (name.length > 100) errors.push('Name is too long (max 100 characters)')

  const dob = (profile.dob || '').trim()
  if (dob) {
    const parts = dob.split('-')
    const [d, m, y] = [parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2])]
    if (parts.length !== 3 || isNaN(d) || isNaN(m) || isNaN(y)) {
      errors.push('Date of birth must be in DD-MM-YYYY format')
    } else if (d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > new Date().getFullYear()) {
      errors.push('Date of birth appears invalid')
    }
  }

  const bt = (profile.birth_time || '').trim()
  if (bt) {
    const [h, mn] = bt.split(':').map(Number)
    if (isNaN(h) || isNaN(mn) || h < 0 || h > 23 || mn < 0 || mn > 59) {
      errors.push('Birth time must be in HH:MM format (24-hour)')
    }
  }

  return errors
}

// ─── IdentityManager ─────────────────────────────────────────────────────────

export class IdentityManager {
  constructor(provider = new CompositeProvider()) {
    this._repo     = provider
    this._identity = null   // in-memory cache, authoritative after load()
    this._listeners = []
  }

  // ── Observers (React hooks subscribe here) ─────────────────────────────────
  subscribe(fn) {
    this._listeners.push(fn)
    return () => { this._listeners = this._listeners.filter(l => l !== fn) }
  }
  _notify() { this._listeners.forEach(fn => fn(this._identity)) }

  // ── Load ──────────────────────────────────────────────────────────────────
  /**
   * load() → KairosIdentity
   * Called once at app start. Migrates old schemas automatically.
   */
  load() {
    const raw = this._repo.load()
    this._identity = migrateSchema(raw) || newIdentity()
    if (!raw) {
      // First run — persist the new identity immediately
      this._persist()
    }
    return this._identity
  }

  // ── Getters ───────────────────────────────────────────────────────────────
  get identity()       { return this._identity }
  get uid()            { return this._identity?.uid }
  get profile()        { return this._identity?.profile || {} }
  get family()         { return this._identity?.family  || [] }
  get prefs()          { return this._identity?.prefs   || {} }
  get appState()       { return this._identity?.appState || {} }
  get isOnboarded()    { return this._identity?.appState?.onboardingComplete ?? false }
  get storageType()    { return this._repo.storageType }

  /** Returns profile in the legacy array format that BootstrapManager expects */
  get userProfileArray() {
    const p = this.profile
    // Use || '' to handle undefined fields that JSON.stringify would drop
    const primary = {
      name:       p.name       || '',
      dob:        p.dob        || '',
      birth_time: p.birth_time || '',
      type:       'primary'
    }
    return [primary, ...this.family]
  }

  get profileStatus() {
    return deriveProfileStatus(this.userProfileArray)
  }

  // ── Update profile ────────────────────────────────────────────────────────
  updateProfile(updates) {
    if (!this._identity) throw new Error('IdentityManager not loaded')
    const errors = validateProfile({ ...this._identity.profile, ...updates })
    // Non-fatal: we warn but don't block
    if (errors.length) console.warn('[IdentityManager] Profile validation:', errors)
    this._identity = {
      ...this._identity,
      profile:    { ...this._identity.profile, ...updates },
      _updatedAt: new Date().toISOString()
    }
    this._persist()
    this._notify()
    return { errors }
  }

  updateFamily(familyArray) {
    if (!this._identity) throw new Error('IdentityManager not loaded')
    this._identity = {
      ...this._identity,
      family:     familyArray.map(m => ({ ...m, type:'family' })),
      _updatedAt: new Date().toISOString()
    }
    this._persist()
    this._notify()
  }

  updatePrefs(prefUpdates) {
    if (!this._identity) throw new Error('IdentityManager not loaded')
    this._identity = {
      ...this._identity,
      prefs:      { ...this._identity.prefs, ...prefUpdates },
      _updatedAt: new Date().toISOString()
    }
    this._persist()
    this._notify()
  }

  /** Save the full array format from ProfileModal in one call */
  saveUsersArray(usersArray) {
    if (!usersArray?.length) return
    const [primary, ...family] = usersArray
    this.updateProfile({
      name:       primary.name       || '',
      dob:        primary.dob        || '',
      birth_time: primary.birth_time || '',
      birth_place:primary.birth_place|| '',
    })
    this._identity.family = family.map(m => ({ ...m, type:'family' }))
    this._identity.appState.onboardingComplete = true
    this._identity._updatedAt = new Date().toISOString()
    this._persist()
    this._notify()
  }

  completeOnboarding() {
    if (!this._identity) return
    this._identity.appState.onboardingComplete = true
    this._identity._updatedAt = new Date().toISOString()
    this._persist()
    this._notify()
  }

  // ── Feedback / history ────────────────────────────────────────────────────
  addFeedback(category, action, outcome) {
    if (!this._identity) return
    const entry = { category, action:String(action).slice(0,100), outcome,
      timestamp: new Date().toISOString() }
    this._identity.appState.feedbackHistory = [
      ...this._identity.appState.feedbackHistory.slice(-499), entry
    ]
    this._identity._updatedAt = new Date().toISOString()
    this._persist()
  }

  trackOpen() {
    if (!this._identity) return
    const s = this._identity.appState.usageStats
    s.sessions = (s.sessions || 0) + 1
    s.lastOpen = new Date().toISOString()
    this._identity._updatedAt = new Date().toISOString()
    this._persist()
  }

  // ── Export / Import ───────────────────────────────────────────────────────
  exportJSON() {
    if (!this._identity) throw new Error('No identity loaded')
    return JSON.stringify({
      ...this._identity,
      _exportedAt: new Date().toISOString(),
      _appVersion: '30.3'
    }, null, 2)
  }

  importJSON(json) {
    try {
      const parsed = JSON.parse(json)
      if (!parsed || typeof parsed !== 'object') throw new Error('Not a valid JSON object')
      const migrated = migrateSchema(parsed)
      if (!migrated) throw new Error('Could not parse identity file')
      this._identity = migrated
      this._persist()
      this._notify()
      return { ok: true, identity: this._identity }
    } catch(e) {
      return { ok: false, error: e.message }
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  deleteIdentity() {
    this._repo.clear()
    this._identity = newIdentity()
    this._persist()
    this._notify()
  }

  // ── Auth attachment point (for future login — no schema change needed) ────
  /**
   * attachAuth(authToken, provider)
   * Called by future auth layer after login.
   * Adds auth fields without touching profile/family/prefs.
   */
  attachAuth(authToken, provider) {
    if (!this._identity) return
    this._identity._auth = { token: authToken, provider, attachedAt: new Date().toISOString() }
    this._persist()
  }

  detachAuth() {
    if (!this._identity) return
    delete this._identity._auth
    this._persist()
  }

  // ── Internal ─────────────────────────────────────────────────────────────
  _persist() {
    if (this._identity) this._repo.save(this._identity)
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// Exported as a module-level singleton so all imports share the same instance.
export const identityManager = new IdentityManager()
