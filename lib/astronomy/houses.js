/**
 * /lib/astronomy/houses.js
 * Layer 1 — House System (Pure Calculation)
 *
 * Implements Equal House system from sidereal ascendant.
 * Bhava Madhya (house cusps) and Bhava Sandhi (house junctions).
 *
 * No interpretations here — only geometry.
 */

const SIGN_NAMES = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
]

/**
 * computeHouses(lagnaSidLon)
 * Returns 12 houses with:
 *  - cusp longitude (sidereal)
 *  - cusp sign and degree within sign
 *  - opposite cusp (for polarity)
 */
export function computeHouses(lagnaSidLon) {
  const houses = []
  for (let i = 0; i < 12; i++) {
    const cuspLon = ((lagnaSidLon + i * 30) % 360 + 360) % 360
    const sign    = Math.floor(cuspLon / 30)
    houses.push({
      house:    i + 1,
      cuspLon:  +cuspLon.toFixed(4),
      sign,
      signName: SIGN_NAMES[sign],
      degree:   +(cuspLon % 30).toFixed(2)
    })
  }
  return houses
}

/**
 * planetInHouse(planetSidLon, lagnaSidLon)
 * Returns house number (1–12) for a given planet.
 */
export function planetInHouse(planetSidLon, lagnaSidLon) {
  const diff = ((planetSidLon - lagnaSidLon) % 360 + 360) % 360
  return Math.floor(diff / 30) + 1
}

/**
 * computePlanetHouses(grahaPositions, lagnaLon)
 * Returns { PlanetName: houseNumber } for all grahas.
 */
export function computePlanetHouses(grahaPositions, lagnaLon) {
  const result = {}
  for (const [name, pos] of Object.entries(grahaPositions)) {
    result[name] = planetInHouse(pos.sidLon, lagnaLon)
  }
  return result
}

/**
 * houseOfSign(signIndex, lagnaSignIndex)
 * Which house does this sign fall in, given the lagna sign?
 */
export function houseOfSign(signIndex, lagnaSignIndex) {
  return ((signIndex - lagnaSignIndex + 12) % 12) + 1
}
