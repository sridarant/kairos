/**
 * /lib/astrology/aspects.js
 * Layer 2 — Parashari Drishti (Planetary Aspects)
 *
 * Classical aspects per Brihat Parashara Hora Shastra Ch.26.
 * Every planet aspects the 7th house from itself (opposition) — full aspect.
 * Mars additionally aspects 4th and 8th.
 * Jupiter additionally aspects 5th and 9th.
 * Saturn additionally aspects 3rd and 10th.
 * Rahu/Ketu aspect 5th, 7th, 9th (from their position).
 *
 * Aspect STRENGTH by house distance [BPHS Ch.26]:
 *   Full (1.0):    7th from planet
 *   3/4  (0.75):   4th, 8th (Mars), 3rd, 10th (Saturn)
 *   Full (1.0):    5th, 9th (Jupiter)
 *   1/4  (0.25):   Not widely used in Parashari (omitted for clarity)
 *
 * Nodes (Rahu/Ketu): aspect 5th, 7th, 9th at full strength.
 */

/**
 * Special aspect houses relative to planet's house (1-indexed offsets).
 * Key = planet name, value = array of house offsets (beyond the universal 7th).
 */
const SPECIAL_ASPECTS = {
  Mars:    [4, 8],       // 4th and 8th from Mars
  Jupiter: [5, 9],       // 5th and 9th from Jupiter
  Saturn:  [3, 10],      // 3rd and 10th from Saturn
  Rahu:    [5, 7, 9],    // overrides universal; aspects 5th, 7th, 9th
  Ketu:    [5, 7, 9]
}

const SPECIAL_STRENGTH = {
  Mars:    { 4: 0.75, 8: 0.75 },
  Jupiter: { 5: 1.00, 9: 1.00 },
  Saturn:  { 3: 0.75, 10: 0.75 },
  Rahu:    { 5: 1.00, 7: 1.00, 9: 1.00 },
  Ketu:    { 5: 1.00, 7: 1.00, 9: 1.00 }
}

/**
 * getAspectedHouses(planetHouse, planetName)
 *
 * Returns array of { house, strength } for all houses aspected by this planet.
 * Houses are 1-indexed (1–12).
 *
 * @param {number} planetHouse 1–12
 * @param {string} planetName
 * @returns {{ house: number, strength: number }[]}
 */
export function getAspectedHouses(planetHouse, planetName) {
  const aspects = []
  // Universal 7th aspect (all planets except Rahu/Ketu which use special only)
  if (!['Rahu','Ketu'].includes(planetName)) {
    const seventh = ((planetHouse - 1 + 6) % 12) + 1
    aspects.push({ house: seventh, strength: 1.0 })
  }
  // Special aspects
  const specials = SPECIAL_ASPECTS[planetName] || []
  const strengths = SPECIAL_STRENGTH[planetName] || {}
  for (const offset of specials) {
    const aspected = ((planetHouse - 1 + offset - 1) % 12) + 1
    // Avoid duplicate with 7th
    if (!aspects.find(a => a.house === aspected)) {
      aspects.push({ house: aspected, strength: strengths[offset] || 0.75 })
    }
  }
  return aspects
}

/**
 * computeAllAspects(planetHouses)
 *
 * Returns a map: { houseNumber: [{ from: planetName, strength }] }
 * Tells you which planets aspect each house.
 *
 * @param {{ [planetName]: number }} planetHouses
 * @returns {{ [house: number]: { from: string, strength: number }[] }}
 */
export function computeAllAspects(planetHouses) {
  const result = {}
  for (let h = 1; h <= 12; h++) result[h] = []

  for (const [planet, house] of Object.entries(planetHouses)) {
    const aspected = getAspectedHouses(house, planet)
    for (const { house: h, strength } of aspected) {
      result[h].push({ from: planet, strength })
    }
  }
  return result
}

/**
 * doesPlanetAspectHouse(planetHouse, planetName, targetHouse)
 * Quick boolean check.
 */
export function doesPlanetAspectHouse(planetHouse, planetName, targetHouse) {
  return getAspectedHouses(planetHouse, planetName).some(a => a.house === targetHouse)
}

/**
 * mutualAspect(houseA, houseB)
 * Returns true if the two houses mutually aspect (7th from each other).
 */
export function mutualAspect(houseA, houseB) {
  return Math.abs(houseA - houseB) === 6 || Math.abs(houseA - houseB) === 6
}
