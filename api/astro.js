// /api/astro.js — Astro API abstraction layer (v17.0)
// Orchestrates panchang.js, planets.js, scoring.js, interactions.js.

import { fetchPanchang, getMoonCycle, getNakshatraByIndex, getMoonSignFromCycle,
         getDashaFromCycle, getLunarPhaseData }     from '../lib/astro/panchang.js'
import { fetchPlanetaryPositions, aggregateTransits,
         dominantTransit, ZODIAC, ZODIAC_NAMES, PLANET_REASONING,
         PLANET_CULTURAL, PLANET_DEFS }              from '../lib/astro/planets.js'
import { computeInteraction }                        from '../lib/astro/interactions.js'
import { scoredSlots, toConfidence, buildDebugBreakdown,
         getTypeBoost, WEIGHTS }                     from '../lib/astro/scoring.js'
import { buildBirthChart, buildChartSummary, HOUSES }  from '../lib/astro/chart.js'

// ─── Birth data helpers ───────────────────────────────────────────────────────
export function computeLagna(birthTime) {
  if (!birthTime) return null
  const h = parseInt(birthTime.split(':')[0], 10)
  if (isNaN(h)) return null
  const idx = Math.floor(h / 2) % 12
  return { name: ZODIAC_NAMES[idx], ...ZODIAC[idx] }
}

export function buildSeed(dob) {
  const dateNum = new Date().getDate()
  const dobDay  = dob ? parseInt((dob.split('-')[2] || dob.split('/')[1] || '0'), 10) : 0
  return dateNum + (dobDay || 0)
}

export function buildTraits(dob) {
  const dobDay = dob ? parseInt((dob.split('-')[2] || dob.split('/')[1] || '0'), 10) : new Date().getDate()
  return {
    decision_bias:       ((dobDay % 3) - 1),
    risk_tolerance:      (((dobDay + 1) % 3) - 1),
    communication_style: (dobDay % 2),
    focus_strength:      (((dobDay + 2) % 3) - 1)
  }
}

// ─── Full context builder ─────────────────────────────────────────────────────
export async function getFullAstroContext(daysAhead = 0) {
  const [panchang, positions] = await Promise.all([
    fetchPanchang(),
    fetchPlanetaryPositions()
  ])

  const { nakshatra, tithi, moonSign: moonSignName, dasha, lunarPhase, moonCycle } = panchang
  const { transits, varaPlanet } = positions

  // Resolve moonSign as zodiac object
  const moonSignIdx = ZODIAC_NAMES.indexOf(moonSignName)
  const moonSignObj = moonSignIdx >= 0 ? { name: moonSignName, ...ZODIAC[moonSignIdx] } : null

  const certaintyFactor = daysAhead === 0 ? 1.0 : daysAhead <= 3 ? 0.85 : 0.70

  return {
    panchang, positions,
    nakshatra, tithi, moonSign: moonSignObj, dasha,
    lunarPhase, moonCycle,
    varaPlanet, transits,
    certaintyFactor, daysAhead,
    PLANET_REASONING, PLANET_CULTURAL
  }
}

// ─── Per-user scoring ─────────────────────────────────────────────────────────
export function scoreForUser(user, astroCtx) {
  const { nakshatra, tithi, moonSign, lunarPhase, varaPlanet,
          transits, dasha, PLANET_REASONING } = astroCtx

  const seed     = buildSeed(user.dob)
  const traits   = buildTraits(user.dob)
  const lagna    = computeLagna(user.birth_time)
  const typeBoost = getTypeBoost(user.type)

  const transitDelta = aggregateTransits(transits, lagna?.name, moonSign?.name)
  const interactions = computeInteraction(varaPlanet.name, dasha, lagna?.name)

  // Birth chart: house effects from planet positions relative to Lagna
  const birthChart   = buildBirthChart(user.birth_time || null, transits)
  const chartEffects = birthChart.houseEffects

  const astroLayers = {
    vara:        { d: varaPlanet.d||0, c: varaPlanet.c||0, r: varaPlanet.r||0, f: varaPlanet.f||0 },
    lunar:       { d: lunarPhase.d||0, c:0, r: lunarPhase.r||0, f: lunarPhase.f||0 },
    tithi,
    nakshatra,
    transits:    transitDelta,
    interactions,
    lagna,
    moonSign,
    chartEffects
  }

  const slots   = scoredSlots(astroLayers, { seed, typeBoost })
  const sorted  = [...slots].sort((a, b) => b.score - a.score)
  const golden  = sorted[0]
  const worst   = sorted[sorted.length - 1]
  const medium  = [...slots].sort((a, b) => Math.abs(a.score) - Math.abs(b.score))[0]
  const confidence = toConfidence(golden.score, worst.score)
  const debug   = buildDebugBreakdown(slots)
  const domT    = dominantTransit(transits)

  return {
    golden, worst, medium, slots,
    confidence, debug,
    lagna, moonSign, traits, interactions,
    transitDelta, domTransit: domT,
    reasoning: {
      planet:           varaPlanet.name,
      lagnaSign:        lagna?.name || (birthChart.lagna?.name || null),
      planetHouses:     birthChart.planetHouses || {},
      chartSummary:     buildChartSummary(birthChart),
      houseBreakdown:   chartEffects.breakdown || {},
      planetCultural:   PLANET_CULTURAL[varaPlanet.name] || varaPlanet.name,
      planetReasoning:  PLANET_REASONING[varaPlanet.name] || '',
      dashaLabel:       `${dasha} Dasha (${PLANET_CULTURAL[dasha] || dasha})`,
      nakshatraName:    nakshatra.name,
      nakshatraCultural: nakshatra.cultural,
      nakshatraLabel:   nakshatra.label,
      moonSignName:     moonSign?.name || null,
      lunarPhase:       lunarPhase.name,
      tithi:            tithi.tithi,
      tithiLabel:       tithi.label,
      interactNote:     interactions.note,
      lagnaSign:        lagna?.name || null,
      transitLabel:     domT ? `${domT.planet} transiting ${domT.sign}` : null,
      weights:          WEIGHTS
    }
  }
}

// ─── GET /api/astro handler ───────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()
  const daysAhead = Math.max(0, Math.min(7, parseInt(req.query.days || '0', 10) || 0))
  try {
    const ctx = await getFullAstroContext(daysAhead)
    return res.status(200).json({ panchang: ctx.panchang, positions: ctx.positions, certaintyFactor: ctx.certaintyFactor })
  } catch {
    return res.status(500).json({ error: 'astro_error' })
  }
}
