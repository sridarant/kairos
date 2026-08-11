/**
 * /lib/astronomy/birthLocation.js
 *
 * Canonical birth-location resolution model (P0-05 fix).
 *
 * The code explicitly distinguishes three states:
 *
 *   UNRESOLVED  — user entered text, no coordinates known
 *   APPROXIMATE — coordinates estimated from known-city lookup (limited precision)
 *   RESOLVED    — exact coordinates supplied or confirmed
 *
 * Kairos does not have a geocoding API. Until one is integrated, all
 * text-based place_of_birth values remain UNRESOLVED and the calculation
 * uses the default latitude (20°N, India-approximate) with a clear flag
 * that location precision is limited.
 *
 * DO NOT invent coordinates from city names. That would be fake personalisation.
 */

/**
 * KNOWN_LOCATIONS — a small lookup of major cities for which we have
 * reasonable coordinate estimates. These are labelled APPROXIMATE.
 * This is NOT a geocoding service. Expansion requires authorised data.
 */
const KNOWN_LOCATIONS = {
  // India (most common use case)
  'chennai':      { lat: 13.08, lon: 80.27, tz: 'Asia/Kolkata' },
  'mumbai':       { lat: 19.08, lon: 72.88, tz: 'Asia/Kolkata' },
  'delhi':        { lat: 28.61, lon: 77.23, tz: 'Asia/Kolkata' },
  'bangalore':    { lat: 12.97, lon: 77.59, tz: 'Asia/Kolkata' },
  'bengaluru':    { lat: 12.97, lon: 77.59, tz: 'Asia/Kolkata' },
  'hyderabad':    { lat: 17.38, lon: 78.48, tz: 'Asia/Kolkata' },
  'kolkata':      { lat: 22.57, lon: 88.36, tz: 'Asia/Kolkata' },
  'pune':         { lat: 18.52, lon: 73.86, tz: 'Asia/Kolkata' },
  'ahmedabad':    { lat: 23.03, lon: 72.58, tz: 'Asia/Kolkata' },
  'coimbatore':   { lat: 11.01, lon: 76.97, tz: 'Asia/Kolkata' },
  'madurai':      { lat:  9.93, lon: 78.12, tz: 'Asia/Kolkata' },
  'surat':        { lat: 21.17, lon: 72.83, tz: 'Asia/Kolkata' },
  'jaipur':       { lat: 26.92, lon: 75.79, tz: 'Asia/Kolkata' },
  // UK
  'london':       { lat: 51.51, lon: -0.13, tz: 'Europe/London' },
  // USA
  'new york':     { lat: 40.71, lon: -74.01, tz: 'America/New_York' },
  'los angeles':  { lat: 34.05, lon: -118.24, tz: 'America/Los_Angeles' },
  // Other common
  'singapore':    { lat:  1.35, lon: 103.82, tz: 'Asia/Singapore' },
  'dubai':        { lat: 25.20, lon: 55.27, tz: 'Asia/Dubai' },
}

/**
 * LOCATION_RESOLUTION_STATUS — explicit enum for location resolution state.
 */
export const LOCATION_RESOLUTION_STATUS = Object.freeze({
  UNRESOLVED:  'unresolved',   // text entered, no coordinates
  APPROXIMATE: 'approximate',  // city matched in known list
  RESOLVED:    'resolved'      // exact coordinates confirmed
})

/**
 * DEFAULT_LOCATION — used when no location can be resolved.
 * 20°N, 78°E is the approximate geographic centre of India.
 * This is the pre-existing default and is clearly marked as such.
 */
export const DEFAULT_LOCATION = {
  lat:    20,
  lon:    78,
  tz:     'Asia/Kolkata',
  status: LOCATION_RESOLUTION_STATUS.UNRESOLVED,
  source: 'default (India-approximate)'
}

/**
 * resolveBirthLocation(placeOfBirthText, profileTimezone)
 *
 * Attempts to resolve user-entered place text to coordinates.
 * Returns a ResolvedBirthLocation object with explicit status.
 *
 * @param {string} placeOfBirthText  e.g. "Chennai, Tamil Nadu, India"
 * @param {string} profileTimezone   IANA timezone from profile (may be '')
 * @returns ResolvedBirthLocation
 */
export function resolveBirthLocation(placeOfBirthText, profileTimezone = '') {
  // No text entered → unresolved
  if (!placeOfBirthText?.trim()) {
    return { ...DEFAULT_LOCATION }
  }

  // Attempt keyword match against known cities
  const lower = placeOfBirthText.toLowerCase()
  for (const [city, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (lower.includes(city)) {
      return {
        lat:    coords.lat,
        lon:    coords.lon,
        tz:     profileTimezone || coords.tz,
        status: LOCATION_RESOLUTION_STATUS.APPROXIMATE,
        source: `known-city-lookup: ${city}`,
        inputText: placeOfBirthText
      }
    }
  }

  // Text present but not matched → unresolved, use default coordinates
  // Apply profile timezone if available (user explicitly set it)
  return {
    ...DEFAULT_LOCATION,
    tz:        profileTimezone || DEFAULT_LOCATION.tz,
    status:    LOCATION_RESOLUTION_STATUS.UNRESOLVED,
    source:    'unresolved (place name not in known-city list)',
    inputText: placeOfBirthText
  }
}

/**
 * locationIsPersonalised(resolvedLocation)
 * Returns true only if we have non-default coordinates.
 */
export function locationIsPersonalised(loc) {
  return loc?.status !== LOCATION_RESOLUTION_STATUS.UNRESOLVED
}
