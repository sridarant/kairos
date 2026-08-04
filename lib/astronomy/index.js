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
 * getBirthChart(dobString, birthTimeString, lat)
 * @param {string} dobString       e.g. "DD-MM-YYYY"
 * @param {string} birthTimeString e.g. "HH:MM"
 * @param {number} lat             latitude (default 20°N)
 * @returns { jd, grahas, lagna, houses, planetHouses } or null
 */
export function getBirthChart(dobString, birthTimeString, lat = 20) {
  if (!dobString) return null
  try {
    const parts = dobString.split('-')
    if (parts.length !== 3) return null
    const [d, mo, y] = parts.map(Number)
    if (!d || !mo || !y || y < 1900) return null
    let hour = 12
    if (birthTimeString) {
      const [hh, mm] = birthTimeString.split(':').map(Number)
      if (!isNaN(hh)) hour = hh + (mm || 0) / 60
    }
    const jd     = toJD(y, mo, d, hour)
    const grahas = computeGrahaPositions(jd)
    const lagna  = computeLagnaEph(jd, lat)
    const houses = computeHouses(lagna.sidLon)
    const planetHouses = computePlanetHouses(grahas, lagna.sidLon)
    return { jd, grahas, lagna, houses, planetHouses }
  } catch { return null }
}
