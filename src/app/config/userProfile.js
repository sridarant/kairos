/**
 * /src/app/config/userProfile.js
 *
 * Profile status constants and display mappings.
 * The status VALUE is computed by identityManager.profileStatus.
 * This file only provides display strings and colours.
 */

export const PROFILE_STATUS = Object.freeze({
  DEMO:         'demo',
  INCOMPLETE:   'incomplete',
  BASIC:        'basic',
  PERSONALISED: 'personalised'
})

// Colours live in src/styles/tokens/colors.js → ProfileStatus
// This re-export keeps legacy callers working during migration.
export { ProfileStatus as PROFILE_STATUS_COLOR } from '../../styles/tokens/colors.js'

export const PROFILE_STATUS_DESC = Object.freeze({
  demo:         'Displaying demonstration recommendations. Set up your profile for personalised guidance.',
  incomplete:   'Add your date of birth for personalised guidance.',
  basic:        'Add birth time for more accurate timing recommendations.',
  personalised: 'Recommendations are personalised to you.'
})

/**
 * deriveProfileStatus(profile) — kept for any callers that pass a profile object.
 * identityManager.profileStatus is preferred.
 */
export function deriveProfileStatus(profileOrArray) {
  // Accept either a profile object or the legacy array format
  const p = Array.isArray(profileOrArray) ? profileOrArray[0] : profileOrArray
  if (!p?.name?.trim())       return PROFILE_STATUS.DEMO
  if (!p?.dob?.trim())        return PROFILE_STATUS.INCOMPLETE
  if (!p?.birth_time?.trim()) return PROFILE_STATUS.BASIC
  return PROFILE_STATUS.PERSONALISED
}
