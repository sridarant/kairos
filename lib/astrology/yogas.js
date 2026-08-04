/**
 * /lib/astrology/yogas.js
 * Layer 2 — Classical Yoga Detection (~25 yogas)
 *
 * Sources: [BPHS], [Phaladeepika], [Saravali], [Jataka Parijata]
 *
 * Yogas are INFLUENCE MODIFIERS — they adjust weighting in the Decision Engine.
 * They are NOT deterministic predictions.
 *
 * Each yoga returns: { name, description, planets, strength: 'high'|'medium'|'low' }
 *
 * PURE FUNCTIONS: all inputs come from lib/astronomy/.
 */

const KENDRA  = [1,4,7,10]
const TRIKONA = [1,5,9]
const DUSTHANA = [3,6,8,11,12]

const SIGN_LORD = {
  0:'Mars', 1:'Venus',  2:'Mercury', 3:'Moon',    4:'Sun',   5:'Mercury',
  6:'Venus', 7:'Mars',  8:'Jupiter', 9:'Saturn', 10:'Saturn', 11:'Jupiter'
}

function signLord(signIdx) { return SIGN_LORD[signIdx] }
function houseSign(lagnaSign, house) { return (lagnaSign + house - 1) % 12 }

// Helper: are two planets in same house?
function conjunct(ph, p1, p2) { return ph[p1] && ph[p2] && ph[p1] === ph[p2] }

// ─── Group 1: Raja Yogas ──────────────────────────────────────────────────────

/**
 * Raja Yoga [BPHS Ch.35-36]
 * Lord of Kendra and lord of Trikona in conjunction, mutual aspect, or kendra/trikona.
 */
export function detectRajaYoga(planetHouses, lagnaSign) {
  const results = []
  const planets = Object.entries(planetHouses)
  for (let i = 0; i < planets.length; i++) {
    for (let j = i+1; j < planets.length; j++) {
      const [pa, ha] = planets[i], [pb, hb] = planets[j]
      if (ha !== hb) continue
      const aKendra  = KENDRA.includes(ha),  aTrikona = TRIKONA.includes(ha)
      if ((aKendra && TRIKONA.includes(hb)) || (aTrikona && KENDRA.includes(hb))) {
        results.push({ name:'Raja Yoga', description:`${pa} and ${pb} conjunct in house ${ha} (Kendra-Trikona).`, planets:[pa,pb], house:ha, strength:'high' })
      }
    }
  }
  return results
}

/**
 * Dharma Karma Adhipati Yoga [BPHS Ch.36]
 * Lord of 9th (dharma) and lord of 10th (karma) are associated.
 */
export function detectDharmaKarmaYoga(planetHouses, lagnaSign) {
  const lord9  = signLord(houseSign(lagnaSign, 9))
  const lord10 = signLord(houseSign(lagnaSign, 10))
  if (lord9 === lord10) return []  // same planet lords both — weaker case
  const h9 = planetHouses[lord9], h10 = planetHouses[lord10]
  if (!h9 || !h10) return []
  if (h9 === h10 || KENDRA.includes(h9) || TRIKONA.includes(h9)) {
    return [{ name:'Dharma Karma Adhipati Yoga', description:`${lord9} (9th lord) and ${lord10} (10th lord) are associated.`, planets:[lord9,lord10], strength:'high' }]
  }
  return []
}

/**
 * Gaja Kesari Yoga [BPHS Ch.38]
 * Jupiter in Kendra from Moon.
 */
export function detectGajaKesariYoga(planetHouses) {
  const moonH = planetHouses.Moon, jupH = planetHouses.Jupiter
  if (!moonH || !jupH) return []
  const diff = Math.abs(jupH - moonH)
  const isKendra = diff === 0 || diff === 3 || diff === 6 || diff === 9
  if (isKendra) {
    return [{ name:'Gaja Kesari Yoga', description:'Jupiter is in a Kendra from Moon, conferring wisdom and recognition.', planets:['Jupiter','Moon'], strength:'high' }]
  }
  return []
}

/**
 * Budha Aditya Yoga [Saravali Ch.4]
 * Mercury and Sun in conjunction (within 12°), not combust.
 * Note: at < 7° Mercury IS combust by Sun, which weakens this yoga.
 */
export function detectBudhaAdityaYoga(planetHouses, grahaPositions) {
  if (!conjunct(planetHouses, 'Sun', 'Mercury')) return []
  const sunLon  = grahaPositions?.Sun?.sidLon || 0
  const merLon  = grahaPositions?.Mercury?.sidLon || 0
  let diff = Math.abs(sunLon - merLon); if (diff > 180) diff = 360 - diff
  const combust = diff < 7
  if (combust) return []  // Yoga is cancelled by combustion
  return [{ name:'Budha Aditya Yoga', description:'Mercury conjunct Sun (not combust) — sharp intellect and communicative authority.', planets:['Sun','Mercury'], strength:'medium' }]
}

/**
 * Chandra Mangala Yoga [Phaladeepika Ch.6]
 * Moon and Mars in conjunction or mutual aspect.
 */
export function detectChandraMangalaYoga(planetHouses) {
  const moonH = planetHouses.Moon, marsH = planetHouses.Mars
  if (!moonH || !marsH) return []
  const diff = Math.abs(moonH - marsH)
  if (diff === 0 || diff === 6) {
    return [{ name:'Chandra Mangala Yoga', description:'Moon and Mars are in combination — dynamic energy and initiative.', planets:['Moon','Mars'], strength:'medium' }]
  }
  return []
}

/**
 * Adhi Yoga [BPHS Ch.37]
 * Jupiter, Venus, and Mercury occupy 6th, 7th, 8th houses from Moon.
 */
export function detectAdhiYoga(planetHouses) {
  const moonH = planetHouses.Moon
  if (!moonH) return []
  const target = new Set([moonH + 5, moonH + 6, moonH + 7].map(h => ((h-1)%12)+1))
  const benefics = ['Jupiter','Venus','Mercury']
  const placed   = benefics.filter(p => target.has(planetHouses[p]))
  if (placed.length >= 2) {
    return [{ name:'Adhi Yoga', description:`${placed.join(' and ')} are in 6th, 7th, or 8th from Moon — support and influence are available.`, planets:placed, strength: placed.length === 3 ? 'high' : 'medium' }]
  }
  return []
}

// ─── Group 2: Panchamahapurusha Yogas (5 Great Person Yogas) [BPHS Ch.35] ────

function panchamaha(planet, signOpts, lagnaSign, planetHouses, grahaPositions) {
  const house = planetHouses[planet]
  const sign  = grahaPositions?.[planet]?.signName
  if (!house || !sign) return []
  const inKendra = KENDRA.includes(house)
  const inStrong = signOpts.includes(sign)
  if (inKendra && inStrong) return [{ planet, house, sign }]
  return []
}

export function detectPanchamahaYogas(planetHouses, grahaPositions, lagnaSign) {
  const results = []
  const tests = [
    { planet:'Mars',    signs:['Aries','Scorpio','Capricorn'], yoga:'Ruchaka Yoga',  desc:'Mars in exaltation/own sign in Kendra — courage, leadership and decisive action.' },
    { planet:'Mercury', signs:['Gemini','Virgo'],              yoga:'Bhadra Yoga',   desc:'Mercury in own sign in Kendra — intelligence and communicative excellence.' },
    { planet:'Jupiter', signs:['Sagittarius','Pisces','Cancer'],yoga:'Hamsa Yoga',  desc:'Jupiter in exaltation/own sign in Kendra — wisdom, prosperity and dharmic clarity.' },
    { planet:'Venus',   signs:['Taurus','Libra','Pisces'],     yoga:'Malavya Yoga', desc:'Venus in exaltation/own sign in Kendra — artistic refinement and material comfort.' },
    { planet:'Saturn',  signs:['Capricorn','Aquarius','Libra'],yoga:'Sasa Yoga',    desc:'Saturn in exaltation/own sign in Kendra — discipline, authority and structured achievement.' }
  ]
  for (const { planet, signs, yoga, desc } of tests) {
    const res = panchamaha(planet, signs, lagnaSign, planetHouses, grahaPositions)
    if (res.length) {
      results.push({ name:yoga, description:desc, planets:[planet], strength:'high' })
    }
  }
  return results
}

// ─── Group 3: Dhana Yogas (Wealth) [BPHS Ch.41] ──────────────────────────────

export function detectDhanaYoga(planetHouses, lagnaSign) {
  const lord2  = signLord(houseSign(lagnaSign, 2))
  const lord11 = signLord(houseSign(lagnaSign, 11))
  const h2 = planetHouses[lord2], h11 = planetHouses[lord11]
  if (!h2 || !h11) return []
  if (h2 === h11 || KENDRA.includes(h2) || TRIKONA.includes(h2)) {
    return [{ name:'Dhana Yoga', description:`${lord2} (2nd lord) and ${lord11} (11th lord) associated — material accumulation is supported.`, planets:[lord2,lord11], strength:'medium' }]
  }
  return []
}

// ─── Group 4: Vipareeta Raja Yoga [BPHS Ch.35] ───────────────────────────────
// Lords of 6th, 8th, 12th in those houses only.

export function detectVipareetaRajaYoga(planetHouses, lagnaSign) {
  const dusthana = [6,8,12]
  const lords = dusthana.map(h => ({ h, lord: signLord(houseSign(lagnaSign, h)) }))
  const inOwn = lords.filter(({ h, lord }) => DUSTHANA.includes(planetHouses[lord]) && planetHouses[lord] === h)
  if (inOwn.length >= 2) {
    const ps = inOwn.map(x => x.lord)
    return [{ name:'Vipareeta Raja Yoga', description:`Dusthana lords ${ps.join(' and ')} placed in their own dusthana houses — unexpected reversal leads to gain.`, planets:ps, strength:'medium' }]
  }
  return []
}

// ─── Group 5: Parivartana Yoga [Phaladeepika Ch.14] ──────────────────────────
// Mutual exchange: Planet A in sign of B, B in sign of A.

export function detectParivartanaYoga(planetHouses, grahaPositions) {
  const results = []
  const planets = Object.keys(planetHouses).filter(p => !['Rahu','Ketu'].includes(p))
  const SIGN_LORD_INV = {}  // planet → signs it rules
  for (const [sign, lord] of Object.entries({ 0:'Mars',1:'Venus',2:'Mercury',3:'Moon',4:'Sun',5:'Mercury',6:'Venus',7:'Mars',8:'Jupiter',9:'Saturn',10:'Saturn',11:'Jupiter' })) {
    if (!SIGN_LORD_INV[lord]) SIGN_LORD_INV[lord] = []
    SIGN_LORD_INV[lord].push(parseInt(sign,10))
  }

  for (let i = 0; i < planets.length; i++) {
    for (let j = i+1; j < planets.length; j++) {
      const pa = planets[i], pb = planets[j]
      const signA = grahaPositions?.[pa]?.sign, signB = grahaPositions?.[pb]?.sign
      if (signA == null || signB == null) continue
      const aInBSign = (SIGN_LORD_INV[pb] || []).includes(signA)
      const bInASign = (SIGN_LORD_INV[pa] || []).includes(signB)
      if (aInBSign && bInASign) {
        results.push({ name:'Parivartana Yoga', description:`${pa} and ${pb} exchange signs — mutual amplification of their significations.`, planets:[pa,pb], strength:'medium' })
      }
    }
  }
  return results
}

// ─── Group 6: Nabhasya Yogas (distribution patterns) [Saravali Ch.11] ────────

export function detectNabhasyaYoga(grahaPositions) {
  const MOVEABLE = new Set(['Aries','Cancer','Libra','Capricorn'])
  const FIXED    = new Set(['Taurus','Leo','Scorpio','Aquarius'])
  const MUTABLE  = new Set(['Gemini','Virgo','Sagittarius','Pisces'])
  const planets  = Object.values(grahaPositions).filter(p => p.signName)
  const total    = planets.length
  const inM = planets.filter(p => MOVEABLE.has(p.signName)).length
  const inF = planets.filter(p => FIXED.has(p.signName)).length
  const inMu = planets.filter(p => MUTABLE.has(p.signName)).length
  if (inM === total) return [{ name:'Rajju Yoga',  description:'All planets in moveable signs — adaptability and travel are themes.', strength:'low' }]
  if (inF === total) return [{ name:'Musala Yoga', description:'All planets in fixed signs — stability, determination and fixed patterns.', strength:'low' }]
  if (inMu === total) return [{ name:'Nala Yoga',  description:'All planets in mutable signs — versatility and changing circumstances.', strength:'low' }]
  return []
}

// ─── Group 7: Graha Yuddha (Planetary War) [BPHS Ch.30] ──────────────────────

export function detectGrahaYuddha(grahaPositions) {
  const COMBATANTS = ['Mercury','Venus','Mars','Jupiter','Saturn']
  const wars = []
  const entries = COMBATANTS.map(n => [n, grahaPositions[n]]).filter(([,p]) => p)
  for (let i = 0; i < entries.length; i++) {
    for (let j = i+1; j < entries.length; j++) {
      const [na, pa] = entries[i], [nb, pb] = entries[j]
      let diff = Math.abs(pa.sidLon - pb.sidLon); if (diff > 180) diff = 360 - diff
      if (diff < 1) {
        const winner = pa.sidLon > pb.sidLon ? na : nb
        wars.push({ name:'Graha Yuddha', description:`${na} and ${nb} are in planetary war (${diff.toFixed(2)}°). ${winner} prevails.`, planets:[na,nb], winner, strength:'medium' })
      }
    }
  }
  return wars
}

// ─── Neecha Bhanga Raja Yoga [BPHS Ch.35] ────────────────────────────────────
// A debilitated planet's debilitation is cancelled, forming a powerful yoga.

export function detectNeechaBhanga(planetHouses, grahaPositions, lagnaSign) {
  const DEBIL = {
    Sun:'Libra', Moon:'Scorpio', Mars:'Cancer', Mercury:'Pisces',
    Jupiter:'Capricorn', Venus:'Virgo', Saturn:'Aries'
  }
  const EXALT_SIGN_LORD = { Sun:'Venus', Moon:'Mars', Mars:'Saturn', Mercury:'Jupiter', Jupiter:'Moon', Venus:'Mercury', Saturn:'Mars' }
  const results = []
  for (const [planet, debilSign] of Object.entries(DEBIL)) {
    const pos = grahaPositions[planet]
    if (!pos || pos.signName !== debilSign) continue
    // Cancellation conditions (any one):
    // 1. Lord of debilitation sign is in Kendra from Lagna
    const debilSignIdx = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces'].indexOf(debilSign)
    const debilLord = SIGN_LORD[debilSignIdx]
    const debilLordHouse = planetHouses[debilLord]
    if (debilLord && debilLordHouse && KENDRA.includes(debilLordHouse)) {
      results.push({ name:'Neecha Bhanga Raja Yoga', description:`${planet} is debilitated but the debilitation is cancelled by ${debilLord} in Kendra — weakness transforms to strength.`, planets:[planet, debilLord], strength:'high' })
    }
  }
  return results
}

/**
 * detectAllYogas: master function
 */
export function detectAllYogas(grahaPositions, planetHouses, lagnaSign) {
  return [
    ...detectRajaYoga(planetHouses, lagnaSign),
    ...detectDharmaKarmaYoga(planetHouses, lagnaSign),
    ...detectGajaKesariYoga(planetHouses),
    ...detectBudhaAdityaYoga(planetHouses, grahaPositions),
    ...detectChandraMangalaYoga(planetHouses),
    ...detectAdhiYoga(planetHouses),
    ...detectPanchamahaYogas(planetHouses, grahaPositions, lagnaSign),
    ...detectDhanaYoga(planetHouses, lagnaSign),
    ...detectVipareetaRajaYoga(planetHouses, lagnaSign),
    ...detectParivartanaYoga(planetHouses, grahaPositions),
    ...detectNabhasyaYoga(grahaPositions),
    ...detectGrahaYuddha(grahaPositions),
    ...detectNeechaBhanga(planetHouses, grahaPositions, lagnaSign)
  ]
}
