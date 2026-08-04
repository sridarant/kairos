/**
 * /lib/astrology/psi.js
 * Planetary Strength Index (PSI)
 *
 * Synthesises multiple strength factors into a single weighted score per planet.
 * Used by the Decision Engine to weight astro signals.
 *
 * PSI is NOT Shadbala (that requires full birth data and is computationally heavy).
 * PSI is a lightweight, deterministic approximation suitable for daily decisions.
 *
 * Factors (weights sum to 1.0):
 *   Dignity          0.35  (exalted/own/etc.)
 *   House placement  0.20  (Kendra/Trikona > Dusthana)
 *   Aspect support   0.15  (benefic aspects received)
 *   Dasha relevance  0.15  (is planet the current dasha lord?)
 *   Combustion       0.10  (negative — combust = weakened)
 *   Retrograde       0.05  (mixed — retrograde behaves atypically)
 *
 * Output: { [planetName]: { psi: 1-10, label: 'Very Strong'|'Strong'|'Average'|'Weak'|'Very Weak' } }
 */

const KENDRA  = [1,4,7,10]
const TRIKONA = [1,5,9]
const UPACHAYA = [3,6,10,11]  // houses where malefics become productive

/**
 * housePSI(house): score for house placement
 */
function housePSI(house) {
  if (!house) return 5
  if (TRIKONA.includes(house) && house !== 1) return 10   // pure trikona
  if (KENDRA.includes(house))  return 9
  if (house === 2 || house === 11) return 7               // artha houses
  if (UPACHAYA.includes(house)) return 6
  if (house === 8 || house === 12) return 3
  if (house === 6) return 4
  return 5
}

/**
 * computePSI(grahaPositions, planetHouses, strengths, aspects, dasha, functionalRoles)
 */
export function computePSI(grahaPositions, planetHouses, strengths, aspects, dasha, functionalRoles) {
  const result = {}
  const dashaLord = dasha?.currentLord

  for (const [planet, pos] of Object.entries(grahaPositions)) {
    const str   = strengths?.[planet] || {}
    const house = planetHouses?.[planet]

    // 1. Dignity (0.35 weight) — scale dignity score 1–5 to 0–10
    const dignityScore = ((str.effectiveScore || 3) - 1) / 4 * 10   // 0–10

    // 2. House placement (0.20)
    const houseScore = housePSI(house)

    // 3. Benefic aspects received (0.15) — count benefic aspects on this planet's house
    const aspOnHouse = (aspects?.[house] || [])
    const BENEFICS   = ['Jupiter','Venus','Mercury','Moon']
    const beneficAspects = aspOnHouse.filter(a => BENEFICS.includes(a.from)).length
    const maleficAspects = aspOnHouse.filter(a => !BENEFICS.includes(a.from)).length
    const aspectScore = Math.min(10, 5 + beneficAspects * 2 - maleficAspects * 1.5)

    // 4. Dasha relevance (0.15)
    const dashaScore = planet === dashaLord ? 10 : 5

    // 5. Combustion penalty (0.10) — negative
    const combustPenalty = str.combust ? -3 : 0

    // 6. Retrograde (0.05) — slight reduction (retrograde = atypical behaviour)
    const retroAdj = str.retrograde ? -1 : 0

    // 7. Functional role bonus
    const role = functionalRoles?.[planet]?.role
    const roleBonus = role === 'yogakaraka' ? 1.5 : role === 'functional_benefic' ? 0.5 : role === 'functional_malefic' ? -0.5 : 0

    // Weighted PSI
    const rawPSI = (
      dignityScore * 0.35 +
      houseScore   * 0.20 +
      aspectScore  * 0.15 +
      dashaScore   * 0.15 +
      5            * 0.10 +  // base combustion normaliser
      5            * 0.05    // base retrograde normaliser
    ) + combustPenalty + retroAdj + roleBonus

    const psi = Math.max(1, Math.min(10, +rawPSI.toFixed(1)))

    result[planet] = {
      psi,
      label: psi >= 8.5 ? 'Very Strong' : psi >= 7 ? 'Strong' : psi >= 5 ? 'Average' : psi >= 3 ? 'Weak' : 'Very Weak',
      factors: { dignityScore:+dignityScore.toFixed(1), houseScore, aspectScore:+aspectScore.toFixed(1), dashaScore, combustPenalty, retroAdj, roleBonus }
    }
  }
  return result
}

/**
 * topPSIPlanets(psiMap, n): return the n strongest planets today
 */
export function topPSIPlanets(psiMap, n = 3) {
  return Object.entries(psiMap)
    .sort((a,b) => b[1].psi - a[1].psi)
    .slice(0, n)
    .map(([name, data]) => ({ name, ...data }))
}
