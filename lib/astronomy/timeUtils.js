/**
 * /lib/astronomy/timeUtils.js
 *
 * Canonical time conversion utilities for Kairos.
 *
 * P0-2: One authoritative path for local birth time → UTC → Julian Date.
 *
 * RULES:
 *   - Birth time is always local clock time in the birth timezone.
 *   - Astronomical calculations use Julian Dates, which are always in UTC.
 *   - This module is the ONLY place that performs timezone conversion.
 *   - Individual astronomy functions must NOT independently interpret timezone.
 *
 * Why this matters:
 *   11:25 IST (Asia/Kolkata, UTC+5:30) = 05:55 UTC.
 *   Passing 11.417 (11:25) directly to toJD() would be 5.5h off.
 *   For Lagna/RAMC this is significant — typically 0.5° per minute of time.
 */

/**
 * KNOWN_OFFSETS — UTC offset in fractional hours for IANA timezone names.
 *
 * Standard (non-DST) offsets only. For DST zones we rely on Intl.DateTimeFormat
 * when available, falling back to these values.
 *
 * This list covers zones relevant to the Kairos user base.
 * Extend by adding entries — do not hardcode elsewhere.
 */
const KNOWN_OFFSETS = {
  'Asia/Kolkata':       5.5,    // IST — no DST
  'Asia/Colombo':       5.5,    // SLT — no DST
  'Asia/Kathmandu':     5.75,   // NPT — no DST
  'Asia/Dhaka':         6,      // BST — no DST
  'Asia/Karachi':       5,      // PKT — no DST
  'Asia/Singapore':     8,      // SGT — no DST
  'Asia/Dubai':         4,      // GST — no DST
  'Asia/Colombo':       5.5,
  'Europe/London':      0,      // GMT (winter); BST +1 in summer (Intl handles)
  'Europe/Paris':       1,      // CET (winter); CEST +2 in summer
  'America/New_York':  -5,      // EST (winter); EDT -4 in summer
  'America/Los_Angeles':-8,     // PST (winter); PDT -7 in summer
  'America/Chicago':   -6,      // CST (winter); CDT -5 in summer
  'Australia/Sydney':  10,      // AEST (winter); AEDT +11 in summer
  'Pacific/Auckland':  12,      // NZST (winter); NZDT +13 in summer
  'UTC':                0,
}

/**
 * getUTCOffsetHours(ianaTimezone, date)
 *
 * Returns UTC offset in fractional hours for a given IANA timezone and date.
 * Uses Intl.DateTimeFormat when available (handles DST automatically).
 * Falls back to KNOWN_OFFSETS for environments without Intl support.
 *
 * @param {string} ianaTimezone  e.g. 'Asia/Kolkata'
 * @param {Date}   date          The date at which the offset applies
 * @returns {number} UTC offset in fractional hours (e.g. 5.5 for IST)
 */
export function getUTCOffsetHours(ianaTimezone, date = new Date()) {
  if (!ianaTimezone) return 0

  try {
    // Use Intl to get both UTC and local time for the same instant
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      hour: 'numeric', minute: 'numeric', hour12: false
    })
    const localFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: ianaTimezone,
      hour: 'numeric', minute: 'numeric', hour12: false
    })

    const parseHHMM = (str) => {
      // Handles '05:30', '5:30', '24:00'
      const [h, m] = str.split(':').map(Number)
      return h + (m || 0) / 60
    }

    const utcH   = parseHHMM(utcFormatter.format(date))
    const localH = parseHHMM(localFormatter.format(date))

    let offset = localH - utcH
    // Handle day boundary crossing
    if (offset < -12) offset += 24
    if (offset >  12) offset -= 24

    return offset
  } catch {
    // Intl unavailable or timezone unknown — try KNOWN_OFFSETS
    return KNOWN_OFFSETS[ianaTimezone] ?? 0
  }
}

/**
 * localToUTCHour(localHour, utcOffsetHours)
 *
 * Converts a local clock hour (fractional) to UTC hour (fractional).
 * Does NOT change the date (caller must handle day rollover if needed).
 *
 * @param {number} localHour      e.g. 11.4167 (11:25)
 * @param {number} utcOffsetHours e.g. 5.5 (IST)
 * @returns {number} UTC hour (fractional)
 */
export function localToUTCHour(localHour, utcOffsetHours) {
  return localHour - utcOffsetHours
}

/**
 * birthLocalToJD(day, month, year, birthHourLocal, birthMinute, ianaTimezone)
 *
 * THE canonical conversion: local birth time → UTC → Julian Date.
 *
 * @param {number} day
 * @param {number} month
 * @param {number} year
 * @param {number} birthHourLocal   local clock hour (0–23)
 * @param {number} birthMinute      minutes (0–59)
 * @param {string} ianaTimezone     e.g. 'Asia/Kolkata'
 * @returns {number} Julian Date in UTC
 */
export function birthLocalToJD(day, month, year, birthHourLocal, birthMinute, ianaTimezone) {
  // Build a reference date at birth local time (used only for DST lookup)
  // Use a midday fallback if time is uncertain, but caller provides real values
  const refDate = new Date(year, month - 1, day, birthHourLocal, birthMinute, 0, 0)

  const utcOffsetHours = getUTCOffsetHours(ianaTimezone, refDate)
  const localHourFrac  = birthHourLocal + birthMinute / 60
  let   utcHourFrac    = localToUTCHour(localHourFrac, utcOffsetHours)

  // Handle day rollover
  let d = day, m = month, y = year
  if (utcHourFrac < 0) {
    utcHourFrac += 24
    // Go back one calendar day
    const prev = new Date(year, month - 1, day - 1)
    d = prev.getDate(); m = prev.getMonth() + 1; y = prev.getFullYear()
  } else if (utcHourFrac >= 24) {
    utcHourFrac -= 24
    const next = new Date(year, month - 1, day + 1)
    d = next.getDate(); m = next.getMonth() + 1; y = next.getFullYear()
  }

  // toJD expects UTC
  return toJDRaw(y, m, d, utcHourFrac)
}

/**
 * toJDRaw(year, month, day, hourUTC)
 *
 * Julian Date from UTC components. Meeus Ch.7.
 * Duplicate of ephemeris.js toJD() to avoid circular import.
 * Both must be kept in sync.
 */
export function toJDRaw(year, month, day, hourUTC = 12) {
  if (month <= 2) { year -= 1; month += 12 }
  const A = Math.trunc(year / 100)
  const B = 2 - A + Math.trunc(A / 4)
  return Math.trunc(365.25 * (year + 4716)) +
         Math.trunc(30.6001 * (month + 1)) +
         day + hourUTC / 24 + B - 1524.5
}
