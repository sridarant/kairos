/**
 * /src/identity/IdentityManager.js
 *
 * THE ONLY public interface for identity. No component, hook, or service
 * accesses localStorage or the repository directly — they go through here.
 *
 * Canonical Identity schema v1:
 * {
 *   _schemaVersion: 1,
 *   _createdAt:     ISO string,
 *   _updatedAt:     ISO string,
 *   uid:            string,        // stable, anonymous, never changes
 *   profile: {
 *     name:         string,
 *     dob:          "DD-MM-YYYY",
 *     birth_time:   "HH:MM",
 *     birth_place:  string,
 *     timezone:     string,        // IANA e.g. "Asia/Kolkata"
 *     gender:       string | null
 *   },
 *   family: [
 *     { name, dob, birth_time, birth_place, timezone, gender }
 *   ],
 *   prefs: {
 *     theme:         "dark",
 *     notifications: boolean,
 *     language:      "en"
 *   },
 *   appState: {
 *     onboardingComplete: boolean,
 *     feedbackHistory:    [{ category, action, outcome, timestamp }],
 *     usageStats:         { sessions: number, lastOpen: ISO string | null }
 *   }
 * }
 */

import { CompositeProvider, SCHEMA_VERSION } from './IdentityRepository.js'
import { RELEASE_VERSION } from '../../lib/utils/version.js'
import { deriveProfileStatus }               from '../app/config/userProfile.js'

// ─── Internal: schema helpers ─────────────────────────────────────────────────

function uid() {
  return `k_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function blankProfile() {
  return {
    name:            '',
    dob:             '',
    birth_time:      '',
    place_of_birth:  '',    // canonical name e.g. "Chennai, Tamil Nadu, India"
    timezone:        (typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone : '') || '',
    gender:          null
  }
}

function blankMember() {
  return {
    ...blankProfile(),
    relationship: '',   // 'spouse', 'child', 'parent', 'sibling', 'other'
    notes:        ''
  }
}

function newIdentity(partial = {}) {
  const now = new Date().toISOString()
  return {
    _schemaVersion: SCHEMA_VERSION,
    _createdAt:     now,
    _updatedAt:     now,
    uid:            uid(),
    profile:        { ...blankProfile(), ...partial.profile },
    family:         partial.family  || [],
    prefs:          { theme:'dark', notifications:false, language:'en', ...partial.prefs },
    appState: {
      onboardingComplete: false,
      feedbackHistory:    [],
      usageStats:         { sessions:0, lastOpen:null },
      ...partial.appState
    }
  }
}

/**
 * migrate(raw) — upgrades any stored object to the current schema.
 * Handles only objects that already have _schemaVersion (written by this system).
 * If an object has no _schemaVersion it cannot be trusted and returns null.
 */
function migrate(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!raw._schemaVersion) return null   // unknown format — reject

  const identity = { ...raw }

  // Fill any fields added in later schema versions
  identity.profile  = { ...blankProfile(), ...identity.profile }
  // Migrate legacy birth_place field to place_of_birth
  if (identity.profile.birth_place && !identity.profile.place_of_birth) {
    identity.profile.place_of_birth = identity.profile.birth_place
    delete identity.profile.birth_place
  }
  identity.family   = Array.isArray(identity.family) ? identity.family : []
  identity.prefs    = { theme:'dark', notifications:false, language:'en', ...identity.prefs }
  identity.appState = {
    onboardingComplete: false,
    feedbackHistory:    [],
    usageStats:         { sessions:0, lastOpen:null },
    ...identity.appState
  }
  identity.appState.feedbackHistory = Array.isArray(identity.appState.feedbackHistory)
    ? identity.appState.feedbackHistory : []
  identity._schemaVersion = SCHEMA_VERSION

  return identity
}

// ─── Internal: validation ─────────────────────────────────────────────────────

function validateBeforeSave(identity) {
  if (!identity || typeof identity !== 'object') return ['Identity must be an object']
  if (!identity._schemaVersion)                  return ['Missing schema version']
  if (!identity.uid)                             return ['Missing uid']
  return []  // valid
}

// ─── IdentityManager ─────────────────────────────────────────────────────────

export class IdentityManager {
  constructor(provider = new CompositeProvider()) {
    this._repo      = provider
    this._identity  = null
    this._listeners = []
  }

  // ── Observer / pub-sub ────────────────────────────────────────────────────
  subscribe(fn) {
    this._listeners.push(fn)
    return () => { this._listeners = this._listeners.filter(l => l !== fn) }
  }
  _notify() { this._listeners.forEach(fn => fn(this._identity)) }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * load() — reads from storage, runs migration, populates in-memory cache.
   * Returns the identity (never null — falls back to a fresh blank identity).
   * MUST be called before any other method.
   */
  load() {
    const raw      = this._repo.load()
    const migrated = migrate(raw)

    if (migrated) {
      this._identity = migrated
    } else {
      // First run or corrupt data — start fresh
      this._identity = newIdentity()
      this._repo.save(this._identity)
    }

    return this._identity
  }

  /**
   * save(updates) — merges updates into the identity and persists.
   * Validates before writing. Returns { ok, errors }.
   */
  save(updates = {}) {
    if (!this._identity) throw new Error('Call load() before save()')
    const next = {
      ...this._identity,
      ...updates,
      _updatedAt: new Date().toISOString()
    }
    const errors = validateBeforeSave(next)
    if (errors.length) return { ok: false, errors }
    this._identity = next
    this._repo.save(this._identity)
    this._notify()
    return { ok: true, errors: [] }
  }

  /**
   * update(section, fields) — merges fields into a top-level section.
   * e.g. update('profile', { name:'Priya', dob:'15-03-1990' })
   */
  update(section, fields) {
    if (!this._identity) throw new Error('Call load() before update()')
    const next = {
      ...this._identity,
      [section]:   { ...this._identity[section], ...fields },
      _updatedAt:  new Date().toISOString()
    }
    const errors = validateBeforeSave(next)
    if (errors.length) { console.warn('[IdentityManager] update() rejected:', errors); return { ok:false, errors } }
    this._identity = next
    this._repo.save(this._identity)
    this._notify()
    return { ok: true, errors: [] }
  }

  /**
   * clear() — removes identity from storage and resets to a blank state.
   */
  clear() {
    this._repo.clear()
    this._identity = newIdentity()
    this._repo.save(this._identity)
    this._notify()
  }

  /**
   * export() — returns the canonical identity as a JSON string.
   */
  export() {
    if (!this._identity) throw new Error('Call load() before export()')
    return JSON.stringify({
      ...this._identity,
      _exportedAt: new Date().toISOString(),
      _exportVersion: RELEASE_VERSION
    }, null, 2)
  }

  /**
   * import(json) — restores identity from an exported JSON string.
   * Returns { ok, errors }.
   */
  import(json) {
    let parsed
    try { parsed = JSON.parse(json) } catch (e) { return { ok:false, errors:['Invalid JSON: ' + e.message] } }

    const migrated = migrate(parsed)
    if (!migrated) return { ok:false, errors:['Not a valid Kairos identity file'] }

    const errors = validateBeforeSave(migrated)
    if (errors.length) return { ok:false, errors }

    this._identity = migrated
    this._repo.save(this._identity)
    this._notify()
    return { ok:true, errors:[] }
  }

  // ── Convenience writers (used by OnboardingModal and ProfileModal) ────────

  /**
   * saveProfile(profileFields, familyArray) — primary entry point for
   * onboarding completion and profile edits.
   */
  saveProfile(profileFields, familyArray = []) {
    if (!this._identity) throw new Error('Call load() before saveProfile()')
    this._identity = {
      ...this._identity,
      profile: {
        ...blankProfile(),
        ...profileFields,
        name:           (profileFields.name           || '').trim(),
        dob:            (profileFields.dob            || '').trim(),
        birth_time:     (profileFields.birth_time     || '').trim(),
        place_of_birth: (profileFields.place_of_birth || '').trim(),
      },
      family: familyArray.map(m => ({
        ...blankMember(),
        ...m,
        name:           (m.name           || '').trim(),
        dob:            (m.dob            || '').trim(),
        birth_time:     (m.birth_time     || '').trim(),
        place_of_birth: (m.place_of_birth || '').trim(),
        relationship:   (m.relationship   || '').trim(),
        notes:          (m.notes          || '').trim(),
      })),
      appState: {
        ...this._identity.appState,
        onboardingComplete: true
      },
      _updatedAt: new Date().toISOString()
    }
    this._repo.save(this._identity)
    this._notify()
  }

  /** Adds a feedback entry to the history (capped at 500). */
  addFeedback(category, action, outcome) {
    if (!this._identity) return
    this._identity.appState.feedbackHistory = [
      ...this._identity.appState.feedbackHistory.slice(-499),
      { category, action: String(action).slice(0, 100), outcome, timestamp: new Date().toISOString() }
    ]
    this._identity._updatedAt = new Date().toISOString()
    this._repo.save(this._identity)
  }

  /** Increments session counter and records last-open timestamp. */
  trackOpen() {
    if (!this._identity) return
    this._identity.appState.usageStats.sessions =
      (this._identity.appState.usageStats.sessions || 0) + 1
    this._identity.appState.usageStats.lastOpen = new Date().toISOString()
    this._identity._updatedAt = new Date().toISOString()
    this._repo.save(this._identity)
  }

  // ── Getters ───────────────────────────────────────────────────────────────

  get identity()    { return this._identity }
  get uid()         { return this._identity?.uid }
  get profile()     { return this._identity?.profile || blankProfile() }
  get family()      { return this._identity?.family  || [] }
  get prefs()       { return this._identity?.prefs   || {} }
  get appState()    { return this._identity?.appState || {} }
  get isOnboarded() { return Boolean(this._identity?.appState?.onboardingComplete) }
  get storageType() { return this._repo.storageType }

  /**
   * primaryUser — the profile object shaped for /api/daily.
   *
   * P0-07 fix: now includes place_of_birth and timezone so the API can
   * use geographic data for natal chart calculations.
   * Previously these fields were silently stripped at this boundary.
   */
  get primaryUser() {
    const p = this.profile
    return {
      name:           p.name           || '',
      dob:            p.dob            || '',
      birth_time:     p.birth_time     || '',
      place_of_birth: p.place_of_birth || '',
      timezone:       p.timezone       || '',
      type:           'primary'
    }
  }

  /**
   * allUsers — primary + family, as an array for /api/daily.
   * P0-07 fix: family members also include place_of_birth and timezone.
   */
  get allUsers() {
    return [this.primaryUser, ...this.family.map(m => ({
      name:           m.name           || '',
      dob:            m.dob            || '',
      birth_time:     m.birth_time     || '',
      place_of_birth: m.place_of_birth || '',
      timezone:       m.timezone       || '',
      type:           'family'
    }))]
  }

  /**
   * profileStatus — derived, never stored.
   */
  get profileStatus() {
    const p = this.profile
    if (!p.name?.trim())       return 'demo'
    if (!p.dob?.trim())        return 'incomplete'
    if (!p.birth_time?.trim()) return 'basic'
    return 'personalised'
  }
}

// ─── Module singleton ─────────────────────────────────────────────────────────
export const identityManager = new IdentityManager()
