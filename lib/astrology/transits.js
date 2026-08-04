/**
 * /lib/astrology/transits.js
 * Layer 2 — Transit Interpretation
 *
 * Evaluates current planetary positions against natal chart positions.
 * Classical Vedic transit analysis. [BPHS Ch.46, Phaladeepika Ch.26]
 *
 * Key transit rules:
 * - Saturn transiting natal Moon (Sade Sati): 7.5-year period of challenge
 * - Jupiter transiting natal Moon (Guru Transit): annual influence on natal sign
 * - Transit over natal Lagna: body and self-expression
 * - Transit over natal Sun: authority and recognition
 * - Ashtama (8th from natal Moon): difficult for Moon-related matters
 *
 * PURE FUNCTIONS: no side effects.
 */

const SIGN_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                    'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

/**
 * houseFromSign(currentSign, referenceSign)
 * Returns how many signs away current is from reference (1 = same sign).
 */
function houseFromSign(currentSignIdx, referenceSignIdx) {
  return ((currentSignIdx - referenceSignIdx + 12) % 12) + 1
}

/**
 * transitsFromMoon(currentGrahas, natalMoonSignIdx)
 *
 * Evaluates all planets' current sign relative to natal Moon sign.
 * Critical reference in Vedic transit analysis.
 *
 * Returns structured transit effects.
 */
export function transitsFromMoon(currentGrahas, natalMoonSignIdx) {
  if (natalMoonSignIdx == null) return []

  const effects = []
  const PLANET_MOON_EFFECTS = {
    Jupiter: {
      good: [1,3,6,10,11],
      note: 'Jupiter transit over natal Moon area generally auspicious for growth'
    },
    Saturn: {
      difficult: [1,2,12],  // Sade Sati houses
      note: 'Saturn near natal Moon requires extra patience and effort'
    },
    Mars: {
      good: [3,6,11],
      difficult: [1,2,4,5,7,8,9,10,12],
      note: 'Mars transit intensifies energy — apply decisively or expect friction'
    },
    Mercury: {
      good: [2,4,6,10,11],
      note: 'Mercury favours communication and trade when well-placed from Moon'
    },
    Venus: {
      good: [1,2,3,4,5,8,9,11,12],
      note: 'Venus generally supportive from Moon — material and relational ease'
    }
  }

  for (const [planet, pos] of Object.entries(currentGrahas)) {
    const rule = PLANET_MOON_EFFECTS[planet]
    if (!rule) continue
    const houseFromMoon = houseFromSign(pos.sign, natalMoonSignIdx)
    const isGood = rule.good?.includes(houseFromMoon)
    const isDiff = rule.difficult?.includes(houseFromMoon)
    if (isGood || isDiff) {
      effects.push({
        planet, houseFromMoon,
        quality:     isGood ? 'supportive' : 'challenging',
        note:        rule.note,
        description: `${planet} in ${SIGN_NAMES[pos.sign]} (${houseFromMoon}${suffix(houseFromMoon)} from natal Moon) — ${isGood ? 'supportive' : 'challenging'}.`
      })
    }
  }

  // Sade Sati special check
  const saturnHFM = houseFromSign(currentGrahas.Saturn?.sign || 0, natalMoonSignIdx)
  if ([12,1,2].includes(saturnHFM)) {
    effects.push({
      planet: 'Saturn', houseFromMoon: saturnHFM, quality:'sade_sati',
      note:'Sade Sati period — Saturn within one sign of natal Moon',
      description:`Sade Sati: Saturn transiting ${SIGN_NAMES[currentGrahas.Saturn?.sign||0]} (${saturnHFM}${suffix(saturnHFM)} from natal Moon).`
    })
  }

  return effects
}

function suffix(n) {
  const s = ['th','st','nd','rd']
  const v = n % 100
  return s[(v-20)%10] || s[v] || s[0]
}

/**
 * transitOverNatalPlanet(transitGrahas, natalGrahas, lagnaSign)
 *
 * Evaluates where current planets fall relative to natal planet positions.
 * Focus on key transits (Jupiter, Saturn, Mars over natal planets).
 */
export function transitOverNatalPlanet(transitGrahas, natalGrahas, lagnaSign) {
  if (!natalGrahas) return []
  const results = []

  // Jupiter conjunct natal Sun — authority and recognition
  const jupSign  = transitGrahas.Jupiter?.sign
  const sunSign  = natalGrahas.Sun?.sign
  if (jupSign != null && jupSign === sunSign) {
    results.push({ planets:['Jupiter','Sun'], type:'conjunction', quality:'supportive',
      description:'Jupiter transiting natal Sun — recognition, authority and wisdom are highlighted.' })
  }

  // Saturn conjunct natal Sun — discipline and delay
  const satSign  = transitGrahas.Saturn?.sign
  if (satSign != null && satSign === sunSign) {
    results.push({ planets:['Saturn','Sun'], type:'conjunction', quality:'challenging',
      description:'Saturn transiting natal Sun — perseverance through obstacles brings lasting result.' })
  }

  // Mars conjunct natal Moon — emotional intensity
  const marsSign = transitGrahas.Mars?.sign
  const monSign  = natalGrahas.Moon?.sign
  if (marsSign != null && marsSign === monSign) {
    results.push({ planets:['Mars','Moon'], type:'conjunction', quality:'challenging',
      description:'Mars transiting natal Moon — emotional intensity elevated; channel energy constructively.' })
  }

  return results
}

/**
 * buildTransitContext(currentGrahas, natalGrahas, lagnaSign)
 *
 * Master function — combines all transit effects into a structured object
 * for consumption by the Decision Engine.
 */
export function buildTransitContext(currentGrahas, natalGrahas, lagnaSign) {
  const natalMoonSign = natalGrahas?.Moon?.sign
  const moonEffects   = transitsFromMoon(currentGrahas, natalMoonSign)
  const planetEffects = transitOverNatalPlanet(currentGrahas, natalGrahas, lagnaSign)

  const allEffects = [...moonEffects, ...planetEffects]
  const supportive = allEffects.filter(e => e.quality === 'supportive' || e.quality === 'good')
  const challenging = allEffects.filter(e => e.quality === 'challenging' || e.quality === 'sade_sati')

  // Net transit score for Decision Engine
  const netScore = supportive.length - challenging.length * 1.5
  const isSadeSati = allEffects.some(e => e.quality === 'sade_sati')

  return {
    effects:    allEffects,
    supportive, challenging,
    netScore:   +netScore.toFixed(2),
    isSadeSati,
    summary:    allEffects.slice(0, 2).map(e => e.description)
  }
}
