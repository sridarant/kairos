/**
 * /lib/astrology/strength.js
 * Layer 2 — Interpretive: Planetary Strength Rules
 *
 * PURE FUNCTIONS: take astronomical facts, return strength assessments.
 * No astronomical calculations here. Inputs must come from lib/astronomy/.
 *
 * Rules documented with classical source:
 *   [BPHS] = Brihat Parashara Hora Shastra
 *   [JH]   = Jataka Parijata
 */

/**
 * RULERSHIPS — which sign each graha rules (domicile).
 * [BPHS Ch.3]
 */
const RULERSHIP = {
  Sun:     ['Leo'],
  Moon:    ['Cancer'],
  Mars:    ['Aries', 'Scorpio'],
  Mercury: ['Gemini', 'Virgo'],
  Jupiter: ['Sagittarius', 'Pisces'],
  Venus:   ['Taurus', 'Libra'],
  Saturn:  ['Capricorn', 'Aquarius'],
  Rahu:    [],   // no classical domicile
  Ketu:    []
}

/**
 * EXALTATION — sign and degree of maximum strength.
 * [BPHS Ch.3]
 */
const EXALTATION = {
  Sun:     { sign: 'Aries',       degree: 10 },
  Moon:    { sign: 'Taurus',      degree: 3  },
  Mars:    { sign: 'Capricorn',   degree: 28 },
  Mercury: { sign: 'Virgo',       degree: 15 },
  Jupiter: { sign: 'Cancer',      degree: 5  },
  Venus:   { sign: 'Pisces',      degree: 27 },
  Saturn:  { sign: 'Libra',       degree: 20 },
  Rahu:    { sign: 'Gemini',      degree: 0  },
  Ketu:    { sign: 'Sagittarius', degree: 0  }
}

/**
 * DEBILITATION — opposite sign of exaltation. [BPHS Ch.3]
 */
const DEBILITATION = {
  Sun:     'Libra',
  Moon:    'Scorpio',
  Mars:    'Cancer',
  Mercury: 'Pisces',
  Jupiter: 'Capricorn',
  Venus:   'Virgo',
  Saturn:  'Aries',
  Rahu:    'Sagittarius',
  Ketu:    'Gemini'
}

/**
 * MOOLATRIKONA — special strength sign, stronger than domicile for some planets.
 * [BPHS Ch.3]
 */
const MOOLATRIKONA = {
  Sun:     { sign: 'Leo',          degrees: [0, 20]  },
  Moon:    { sign: 'Taurus',       degrees: [4, 30]  },
  Mars:    { sign: 'Aries',        degrees: [0, 12]  },
  Mercury: { sign: 'Virgo',        degrees: [16, 20] },
  Jupiter: { sign: 'Sagittarius',  degrees: [0, 10]  },
  Venus:   { sign: 'Libra',        degrees: [0, 15]  },
  Saturn:  { sign: 'Aquarius',     degrees: [0, 20]  }
}

/**
 * dignityOf(planetName, signName, degreeInSign)
 *
 * Returns: 'exalted' | 'moolatrikona' | 'domicile' | 'neutral' | 'debilitated'
 * and a numeric score 5 (exalted) → 1 (debilitated) for scoring layers.
 */
export function dignityOf(planetName, signName, degreeInSign = 0) {
  if (!planetName || !signName) return { dignity: 'neutral', score: 3 }

  // Exaltation (exact = 5, close = 4)
  const ex = EXALTATION[planetName]
  if (ex && ex.sign === signName) {
    const orb = Math.abs(degreeInSign - ex.degree)
    return { dignity: 'exalted', score: orb < 3 ? 5 : 4, orb }
  }

  // Debilitation
  if (DEBILITATION[planetName] === signName) {
    return { dignity: 'debilitated', score: 1 }
  }

  // Moolatrikona
  const mt = MOOLATRIKONA[planetName]
  if (mt && mt.sign === signName &&
      degreeInSign >= mt.degrees[0] && degreeInSign < mt.degrees[1]) {
    return { dignity: 'moolatrikona', score: 5 }
  }

  // Domicile
  if ((RULERSHIP[planetName] || []).includes(signName)) {
    return { dignity: 'domicile', score: 4 }
  }

  return { dignity: 'neutral', score: 3 }
}

/**
 * isCombust(planetName, planetLon, sunLon)
 * Planets too close to the Sun are weakened. [BPHS Ch.3]
 * Orbs vary by planet.
 */
const COMBUST_ORB = {
  Moon: 12, Mars: 17, Mercury: 13,   // retrograde Mercury: 12
  Jupiter: 11, Venus: 10, Saturn: 15
}
export function isCombust(planetName, planetLon, sunLon) {
  const orb = COMBUST_ORB[planetName]
  if (!orb) return false
  let diff = Math.abs(planetLon - sunLon)
  if (diff > 180) diff = 360 - diff
  return diff < orb
}

/**
 * isRetrograde(planetName, speed)
 * Speed < 0 means retrograde. Retrograde planets behave unconventionally.
 * Mercury and Venus retrogrades are particularly significant. [BPHS]
 */
export function isRetrograde(speed) { return speed < 0 }

/**
 * assessPlanetStrength(planetName, position, sunLon)
 * Combines dignity, combustion, and retrograde into a strength profile.
 * Returns a structured object — interpretations go in yoga.js or scoring.
 */
export function assessPlanetStrength(planetName, position, sunLon) {
  const { signName, longitude: degreeInSign, speed } = position
  const dig  = dignityOf(planetName, signName, degreeInSign)
  const comb = isCombust(planetName, position.sidLon, sunLon)
  const retro = speed !== undefined ? isRetrograde(speed) : null

  return {
    planet:    planetName,
    sign:      signName,
    dignity:   dig.dignity,
    score:     dig.score,     // 1–5
    combust:   comb,
    retrograde: retro,
    // Effective strength: exalted but combust = strong but weakened
    effectiveScore: comb ? Math.max(1, dig.score - 1) : dig.score
  }
}

export { RULERSHIP, EXALTATION, DEBILITATION, MOOLATRIKONA }
