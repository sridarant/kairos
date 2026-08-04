/**
 * /lib/astrology/functional.js
 * Layer 2 — Functional Benefics and Malefics
 *
 * Functional benefic/malefic status depends on the Lagna (ascendant sign).
 * This is NOT the same as natural benefic/malefic (Jupiter is not always good,
 * Saturn is not always bad).
 *
 * Classical source: [BPHS Ch.34]
 *
 * Rules:
 * - Lords of Trikona (1,5,9) are benefic regardless of natural status
 * - Lords of Kendra (1,4,7,10) depend on their natural status
 * - Lords of 3,6,11 are malefic (dusthana lords)
 * - Lords of 2,12 are mixed / neutral
 * - Yogakaraka: a planet that lords both a Kendra AND a Trikona
 *   is especially powerful (e.g., Saturn for Libra Lagna)
 *
 * Note: Lagna lord (1st lord) is always benefic for any Lagna.
 *
 * PURE FUNCTION: no astronomical calculations.
 */

const SIGN_NAMES = [
  'Aries','Taurus','Gemini','Cancer','Leo','Virgo',
  'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'
]

// Sign rulership (0-indexed signs → planet)
const SIGN_LORD = {
  0:'Mars', 1:'Venus',  2:'Mercury', 3:'Moon',    4:'Sun',   5:'Mercury',
  6:'Venus', 7:'Mars',  8:'Jupiter', 9:'Saturn', 10:'Saturn', 11:'Jupiter'
}

// Natural benefic/malefic (used for Kendra lord rule)
const NATURAL_BENEFIC = ['Jupiter','Venus','Mercury','Moon']
const NATURAL_MALEFIC = ['Sun','Mars','Saturn','Rahu','Ketu']

/**
 * computeFunctionalRoles(lagnaSign)
 *
 * @param {number} lagnaSign 0–11 (sign index)
 * @returns { [planetName]: { role, reason, isYogakaraka } }
 */
export function computeFunctionalRoles(lagnaSign) {
  if (lagnaSign == null || lagnaSign < 0 || lagnaSign > 11) return {}

  // Which sign falls in which house (equal house system)
  // house H contains sign (lagnaSign + H - 1) % 12
  const houseSign = h => (lagnaSign + h - 1) % 12
  const signLord  = s => SIGN_LORD[s]

  // House lords
  const lords = {}
  for (let h = 1; h <= 12; h++) {
    const sign = houseSign(h)
    const lord = signLord(sign)
    if (!lords[lord]) lords[lord] = []
    lords[lord].push(h)
  }

  const TRIKONA = [1,5,9]
  const KENDRA  = [1,4,7,10]
  const DUSTHANA = [3,6,11]

  const result = {}

  for (const [planet, houses] of Object.entries(lords)) {
    const ownsTrikona  = houses.some(h => TRIKONA.includes(h))
    const ownsKendra   = houses.some(h => KENDRA.includes(h))
    const ownsDusthana = houses.some(h => DUSTHANA.includes(h))
    const isNatBenefic = NATURAL_BENEFIC.includes(planet)
    const isYogakaraka = ownsTrikona && ownsKendra

    let role, reason

    if (isYogakaraka) {
      role   = 'yogakaraka'
      reason = `${planet} lords both a Kendra and a Trikona — the most powerful functional benefic`
    } else if (ownsTrikona && !ownsDusthana) {
      role   = 'functional_benefic'
      reason = `${planet} lords house(s) ${houses.filter(h=>TRIKONA.includes(h)).join(',')} (Trikona)`
    } else if (ownsKendra && isNatBenefic) {
      role   = 'functional_benefic'
      reason = `${planet} (natural benefic) lords Kendra house(s) ${houses.filter(h=>KENDRA.includes(h)).join(',')}`
    } else if (ownsDusthana && !ownsTrikona) {
      role   = 'functional_malefic'
      reason = `${planet} lords dusthana house(s) ${houses.filter(h=>DUSTHANA.includes(h)).join(',')}`
    } else {
      role   = 'neutral'
      reason = `${planet} lords house(s) ${houses.join(',')}`
    }

    result[planet] = { role, reason, isYogakaraka, houses }
  }

  // Rahu and Ketu inherit role of their sign lord, per Parashari tradition
  for (const node of ['Rahu','Ketu']) {
    if (!result[node]) {
      result[node] = { role:'neutral', reason:'Nodes inherit functional role from their sign lord', isYogakaraka:false, houses:[] }
    }
  }

  return result
}

/**
 * isFunctionalBenefic(planet, functionalRoles)
 * Quick boolean check.
 */
export function isFunctionalBenefic(planet, functionalRoles) {
  const r = functionalRoles?.[planet]?.role
  return r === 'functional_benefic' || r === 'yogakaraka'
}
