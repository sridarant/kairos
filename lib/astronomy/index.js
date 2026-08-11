/**
 * /lib/astronomy/index.js — Layer 1 Public API
 * Pure astronomical calculations only. No interpretations.
 */

export {
  toJD, toT, lahiriAyanamsa,
  computeGrahaPositions, nakshatra, computeTithi, computeYoga,
  computeKarana, computeLagna, computePanchang
} from './ephemeris.js'

export {
  computeHouses, planetInHouse, computePlanetHouses, houseOfSign
} from './houses.js'

import { toJD, computeGrahaPositions, computePanchang, computeLagna as computeLagnaEph } from './ephemeris.js'
import { computeHouses, computePlanetHouses } from './houses.js'
import { birthLocalToJD } from './timeUtils.js'

/**
 * getDailyAstronomy(date)
 * Returns all raw astronomical facts for a given date.
 * @param {Date} date
 * @returns { jd, grahas, panchang }
 */
export function getDailyAstronomy(date = new Date()) {
  const y = date.getFullYear(), m = date.getMonth() + 1, d = date.getDate()
  const h = date.getHours() + date.getMinutes() / 60
  const jd = toJD(y, m, d, h)
  const grahas  = computeGrahaPositions(jd)
  const panchang = computePanchang(jd)
  return { jd, grahas, panchang }
}

/**
 * getBirthChart(dobString, birthTimeString, lat, lon, timezone)
 *
 * P0-1+P0-2 fix: accepts longitude and IANA timezone.
 * Converts local birth time → UTC → Julian Date before astronomical calc.
 *
 * @param {string} dobString       "DD-MM-YYYY"
 * @param {string} birthTimeString "HH:MM" (local clock time at birth place)
 * @param {number} lat             latitude  (degrees, default 20°N)
 * @param {number} lon             longitude (degrees east, default 78°E)
 * @param {string} timezone        IANA timezone (default 'Asia/Kolkata')
 * @returns { jd, grahas, lagna, houses, planetHouses, utcHour } or null
 */
export function getBirthChart(dobString, birthTimeString, lat = 20, lon = 78, timezone = 'Asia/Kolkata') {
  if (!dobString) return null
  try {
    const parts = dobString.split('-')
    if (parts.length !== 3) return null
    const [d, mo, y] = parts.map(Number)
    if (!d || !mo || !y || y < 1900) return null
    let bh = 12, bm = 0
    if (birthTimeString) {
      const [hh, mm] = birthTimeString.split(':').map(Number)
      if (!isNaN(hh)) { bh = hh; bm = mm || 0 }
    }
    // P0-2: convert local birth time to UTC Julian Date
    const jd     = birthLocalToJD(d, mo, y, bh, bm, timezone)
    const grahas = computeGrahaPositions(jd)
    // P0-1: use actual longitude in Lagna calculation
    const lagna  = computeLagnaEph(jd, lat, lon)
    const houses = computeHouses(lagna.sidLon)
    const planetHouses = computePlanetHouses(grahas, lagna.sidLon)
    return { jd, grahas, lagna, houses, planetHouses }
  } catch { return null }
}

/**
 * getBirthChartFromParts(day, month, year, bh, bm, lat, lon, timezone)
 *
 * P0-1+P0-2 fix: accepts longitude and timezone for correct RAMC and UTC conversion.
 *
 * @param {number} day
 * @param {number} month
 * @param {number} year
 * @param {number} bh    birth hour, local clock time (0–23)
 * @param {number} bm    birth minute (0–59)
 * @param {number} lat   latitude  (degrees, default 20°N)
 * @param {number} lon   longitude (degrees east, default 78°E)
 * @param {string} timezone IANA timezone (default 'Asia/Kolkata')
 * @returns { jd, grahas, lagna, houses, planetHouses } or null
 */
export function getBirthChartFromParts(day, month, year, bh = 6, bm = 0, lat = 20, lon = 78, timezone = 'Asia/Kolkata') {
  if (!day || !month || !year || year < 1900) return null
  try {
    // P0-2: convert local birth time to UTC Julian Date
    const jd   = birthLocalToJD(day, month, year, bh, bm, timezone)
    const grahas = computeGrahaPositions(jd)
    // P0-1: use actual longitude in Lagna calculation
    const lagna  = computeLagnaEph(jd, lat, lon)
    const houses = computeHouses(lagna.sidLon)
    const planetHouses = computePlanetHouses(grahas, lagna.sidLon)
    return { jd, grahas, lagna, houses, planetHouses }
  } catch { return null }
}
