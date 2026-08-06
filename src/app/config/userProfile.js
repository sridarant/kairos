/**
 * /src/app/config/userProfile.js
 *
 * Canonical User Profile model and profile status derivation.
 * Used by BootstrapManager, ProfileModal, and any future auth layer.
 */

// ─── Profile Status ───────────────────────────────────────────────────────────

export const PROFILE_STATUS = Object.freeze({
  DEMO:         'demo',          // No profile at all
  INCOMPLETE:   'incomplete',    // Name entered but no DOB
  BASIC:        'basic',         // Name + DOB, no birth time
  PERSONALISED: 'personalised'   // Name + DOB + birth time
})

/**
 * deriveProfileStatus(userProfile[]) → PROFILE_STATUS
 */
export function deriveProfileStatus(userProfile) {
  if (!userProfile?.length) return PROFILE_STATUS.DEMO
  const primary = userProfile[0]
  if (!primary?.name?.trim()) return PROFILE_STATUS.DEMO
  if (!primary?.dob?.trim())  return PROFILE_STATUS.INCOMPLETE
  if (!primary?.birth_time?.trim()) return PROFILE_STATUS.BASIC
  return PROFILE_STATUS.PERSONALISED
}

/**
 * profileStatusLabel(status) → human-readable label
 */
export const PROFILE_STATUS_LABEL = Object.freeze({
  [PROFILE_STATUS.DEMO]:         '⚠ Demo Mode',
  [PROFILE_STATUS.INCOMPLETE]:   '⚠ Profile Incomplete',
  [PROFILE_STATUS.BASIC]:        '◑ Personalised',
  [PROFILE_STATUS.PERSONALISED]: '✓ Personalised'
})

export const PROFILE_STATUS_COLOR = Object.freeze({
  [PROFILE_STATUS.DEMO]:         '#f87171',
  [PROFILE_STATUS.INCOMPLETE]:   '#fbbf24',
  [PROFILE_STATUS.BASIC]:        '#facc15',
  [PROFILE_STATUS.PERSONALISED]: '#4ade80'
})

export const PROFILE_STATUS_DESC = Object.freeze({
  [PROFILE_STATUS.DEMO]:         'Displaying demonstration recommendations. Set up your profile for personalised guidance.',
  [PROFILE_STATUS.INCOMPLETE]:   'Add your date of birth for personalised guidance.',
  [PROFILE_STATUS.BASIC]:        'Add birth time for more accurate timing recommendations.',
  [PROFILE_STATUS.PERSONALISED]: 'Recommendations are personalised to you.'
})

/**
 * canonicalUser(raw) → normalised UserProfile object
 */
export function canonicalUser(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    name:       String(raw.name || '').trim().slice(0, 50),
    dob:        String(raw.dob  || '').trim().slice(0, 10),
    birth_time: String(raw.birth_time || '').trim().slice(0, 5),
    type:       String(raw.type || 'primary').slice(0, 20)
  }
}
