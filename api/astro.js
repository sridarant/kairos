/**
 * /api/astro.js  v22.0
 * Orchestration layer: connects Layer 1 (astronomy), Layer 2 (astrology),
 * and Layer 3 (decision engine).
 *
 * This file may call lib/astronomy/ and lib/astrology/ but
 * contains NO astronomical calculations and NO interpretation rules itself.
 * It only ASSEMBLES results.
 */

import { toJD, computeGrahaPositions, computeLagna as calcLagna,
         computePanchang, nakshatra }                               from '../lib/astronomy/ephemeris.js'
import { computeHouses, computePlanetHouses }                       from '../lib/astronomy/houses.js'
import { assessPlanetStrength, RULERSHIP }                          from '../lib/astrology/strength.js'
import { detectAllYogas }                                            from '../lib/astrology/yogas.js'
import { computeVimshottariDasha, dashaFromToday, DASHA_SEQUENCE }  from '../lib/astrology/dasha.js'
import { tithiEffect, nakshatraEffect, planetaryEffect, yogaEffect } from '../lib/astrology/scoring.js'

// ─── Per-process cache ────────────────────────────────────────────────────────
// Astronomical calculations for the same JD are expensive — cache them.
let _cache = { key: null, data: null }

function cacheKey(jd) { return Math.floor(jd * 24) }   // changes every hour

function cachedGrahas(jd) {
  const k = cacheKey(jd)
  if (_cache.key === k) return _cache.data
  const data = computeGrahaPositions(jd)
  _cache = { key: k, data }
  return data
}

// ─── Date → JD helper ──────────────────────────────────────────────────────────
function nowJD() {
  const n = new Date()
  return toJD(n.getFullYear(), n.getMonth() + 1, n.getDate(), n.getHours() + n.getMinutes() / 60)
}

function parseDoB(dob) {
  // Accepts DD-MM-YYYY or YYYY-MM-DD
  if (!dob) return null
  const parts = dob.split('-')
  if (parts.length !== 3) return null
  let [a, b, c] = parts.map(Number)
  // Detect format: if first part > 31 → YYYY-MM-DD
  if (a > 31) return new Date(a, b - 1, c)
  return new Date(c, b - 1, a)   // DD-MM-YYYY
}

// ─── Lagna from birth time ─────────────────────────────────────────────────────
export function computeLagna(birthTime, dob) {
  if (!birthTime || !dob) return null
  const bd = parseDoB(dob)
  if (!bd) return null
  const [h, m = 0] = birthTime.split(':').map(Number)
  const jd = toJD(bd.getFullYear(), bd.getMonth() + 1, bd.getDate(), h + m / 60)
  return calcLagna(jd, 13)  // default lat 13°N (Bangalore — South India approximation)
}

export function buildSeed(dob) {
  const dobDay = dob ? parseInt((dob.split('-')[0] || '0'), 10) : new Date().getDate()
  return new Date().getDate() + dobDay
}

// ─── Full astrological context for one date ────────────────────────────────────
export async function getFullAstroContext(daysAhead = 0) {
  const targetDate = new Date()
  if (daysAhead > 0) targetDate.setDate(targetDate.getDate() + daysAhead)

  const jd     = toJD(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate(), 12)
  const grahas  = cachedGrahas(jd)
  const panchang = computePanchang(jd)

  const { nakshatra: moonNak, tithi, yoga: panchangYoga, vara } = panchang

  const certaintyFactor = daysAhead === 0 ? 1.0 : daysAhead <= 3 ? 0.85 : 0.70

  return { jd, grahas, panchang, moonNak, tithi, vara, certaintyFactor, daysAhead }
}

// ─── Per-user chart scoring ────────────────────────────────────────────────────
export function scoreForUser(user, astroCtx) {
  const { jd, grahas, panchang } = astroCtx
  const { moonNak, tithi, vara } = panchang

  // Birth chart (requires birth time + dob for full chart)
  const lagna = computeLagna(user.birth_time, user.dob)
  const lagnaSignIdx = lagna?.sign ?? null

  const planetHouses = (lagna && grahas)
    ? computePlanetHouses(grahas, lagna.sidLon)
    : {}

  // Yogas
  const yogas = detectAllYogas(grahas, planetHouses, lagnaSignIdx)

  // Planetary strengths
  const strengths = {}
  for (const [name, pos] of Object.entries(grahas)) {
    strengths[name] = assessPlanetStrength(name, pos, grahas.Sun?.sidLon || 0)
  }

  // Dasha
  let dasha = null
  const bd   = parseDoB(user.dob)
  if (bd && moonNak) {
    const moonLonInNak = grahas.Moon?.sidLon % (360 / 27) || 0
    dasha = computeVimshottariDasha(moonNak.index, moonLonInNak, bd)
  } else if (moonNak) {
    dasha = { currentLord: dashaFromToday(moonNak.index), currentSub: 'Unknown', elapsedYears:0, remainingYears:17 }
  }

  // ── Aggregate dimension scores from all astrological layers ────────────────
  const agg = { d:0, c:0, r:0, f:0 }
  const notes = []

  // 1. Tithi effect
  const te = tithiEffect(tithi.name, tithi.phase)
  agg.d += te.d * 0.10; agg.c += 0; agg.r += te.r * 0.10; agg.f += te.f * 0.10
  if (te.label) notes.push(te.label)

  // 2. Nakshatra effect
  const ne = nakshatraEffect(moonNak?.name)
  agg.d += ne.d * 0.15; agg.c += ne.c * 0.15; agg.r += ne.r * 0.15; agg.f += ne.f * 0.15
  if (ne.label) notes.push(ne.label)

  // 3. Vara (weekday lord) effect
  const varaLordStrength = strengths[vara] || null
  const ve = planetaryEffect(vara, varaLordStrength?.effectiveScore || 3, null)
  agg.d += ve.d * 0.10; agg.c += ve.c * 0.10; agg.r += ve.r * 0.10; agg.f += ve.f * 0.10

  // 4. Transit Moon effect (Moon's position reflects daily mood)
  const moonStr = strengths['Moon']
  const me = planetaryEffect('Moon', moonStr?.effectiveScore || 3, planetHouses['Moon'] || null)
  agg.d += me.d * 0.20; agg.c += me.c * 0.20; agg.r += me.r * 0.20; agg.f += me.f * 0.20

  // 5. Transit Mercury (communication)
  const mercStr = strengths['Mercury']
  const merc = planetaryEffect('Mercury', mercStr?.effectiveScore || 3, planetHouses['Mercury'] || null)
  agg.d += merc.d * 0.08; agg.c += merc.c * 0.08; agg.r += merc.r * 0.08; agg.f += merc.f * 0.08

  // 6. Transit Jupiter (overall wisdom)
  const jupStr = strengths['Jupiter']
  const je = planetaryEffect('Jupiter', jupStr?.effectiveScore || 3, planetHouses['Jupiter'] || null)
  agg.d += je.d * 0.10; agg.c += je.c * 0.10; agg.r += je.r * 0.10; agg.f += je.f * 0.10

  // 7. Yoga modifiers
  for (const y of yogas) {
    const yeff = yogaEffect(y)
    agg.d += yeff.d * 0.05; agg.c += yeff.c * 0.05; agg.r += yeff.r * 0.05; agg.f += yeff.f * 0.05
    if (yeff.note) notes.push(yeff.note)
  }

  // 8. Dasha influence (Mahadasha lord)
  if (dasha?.currentLord) {
    const dashaStr = strengths[dasha.currentLord]
    const de = planetaryEffect(dasha.currentLord, dashaStr?.effectiveScore || 3, null)
    agg.d += de.d * 0.15; agg.c += de.c * 0.15; agg.r += de.r * 0.15; agg.f += de.f * 0.15
  }

  return {
    agg, notes, lagna, lagnaSignIdx, planetHouses, yogas, strengths, dasha,
    reasoning: {
      tithi:       tithi.name,
      tithiPhase:  tithi.phase,
      nakshatra:   moonNak?.name,
      nakshatraLabel: ne.label,
      nakshatraCultural: moonNak?.name,
      vara,
      moonInSign:  grahas.Moon?.signName,
      dashaPlanet: dasha?.currentLord,
      dashaLabel:  dasha?.currentLord ? `${dasha.currentLord} Dasha / ${dasha.currentSub} Antardasha` : null,
      yogaNames:   yogas.map(y => y.name),
      notes
    }
  }
}

// ─── GET /api/astro handler ────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const daysAhead = Math.max(0, Math.min(7, parseInt(req.query.days || '0', 10) || 0))
  try {
    const ctx = await getFullAstroContext(daysAhead)
    return res.status(200).json({
      panchang:       ctx.panchang,
      certaintyFactor: ctx.certaintyFactor
    })
  } catch (e) {
    return res.status(500).json({ error: 'astro_error', message: e.message })
  }
}
