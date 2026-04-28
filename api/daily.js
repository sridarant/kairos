import {
  scoredSlots, buildSeed, buildTraits, getPlanet, getLunarPhase, getDayType,
  toConfidence, dominantDimension, DIM_LABEL, PLANET_REASONING, buildReasoning,
  computeLagna, computeMoonSign,
  getTransits, aggregateTransits, dominantTransit,
  getTithi, getTithiByNumber, getNakshatra, getNakshatraByName, getVara,
  getMoonCycle, getMoonNakshatra, getMoonSign, getMoonDasha
} from './engine.js'

const DO_MSGS = [
  'Use this window for key decisions and important conversations',
  'Tackle your most complex or high-stakes task now',
  'Send proposals, contracts, or critical messages during peak hours',
  'Lead discussions or negotiate — clarity is at its highest',
  'Start high-priority projects that need strong momentum'
]
const AVOID_MSGS = [
  'Do not make financial decisions — risk clarity is low',
  'Avoid committing to new obligations or contracts',
  'Hold off on reactive responses — revisit tomorrow with fresh eyes',
  'Do not multitask on critical work — depth is required',
  'Avoid impulsive choices — wait for a higher-scoring window'
]
const WATCH_MSGS = [
  'Energy will dip — schedule breaks before it affects focus',
  'Decision fatigue builds after midday — front-load important work',
  'Focus may fragment — reduce context-switching',
  'Transition zone — complete open tasks before starting new ones',
  'Stress risk peaks during handoffs — communicate clearly'
]

function buildSummary(r, goldenTime, avoidTime) {
  const traitHint = r.traitLines.length > 0 ? ` ${r.traitLines[0]}` : ''
  const riskNote  = r.riskFlag === 'elevated'
    ? ' Manage risk carefully.'
    : r.riskFlag === 'reduced'
    ? ' Favour conservative moves.'
    : ''

  // Panchang anchor: Vara + Tithi + Nakshatra — the three pillars
  const panchaNote = `${r.varaCultural}: ${r.tithiLabel}; Nakshatra is ${r.nakshatraCultural} (${r.nakshatraLabel}).`

  // Dasha secondary reference
  const dashaNote = `${r.dashaLabel} ${r.planetInfluence}.`

  const birthParts = []
  if (r.lagnaLabel)                                                         birthParts.push(r.lagnaLabel)
  if (r.rasiLabel && ['communication', 'focus'].includes(r.dominant))       birthParts.push(r.rasiLabel)
  const birthLine = birthParts.length > 0
    ? ` ${birthParts.join(' and ')} shapes your personal alignment.`
    : ''

  const transitLine = r.transitLabel
    ? ` Active transit: ${r.transitLabel}.`
    : ''

  return (
    `Use your ${goldenTime} window for key decisions and important actions. ` +
    `Avoid starting new commitments after ${avoidTime}. ` +
    `${panchaNote} ${dashaNote}${birthLine}${transitLine}${riskNote}${traitHint}`
  )
}

function computeForUser(user, planet, lunar, dayType, transits, realTithi, realNaksh, realMoonSgn) {
  const seed         = buildSeed(user.dob)
  const traits       = buildTraits(user.dob)
  const lagna        = computeLagna(user.birth_time)
  const moonSign     = realMoonSgn || computeMoonSign(user.dob)
  const transitDelta = aggregateTransits(transits, lagna, moonSign)
  const domTransit   = dominantTransit(transits)
  const tithi        = realTithi || getTithi()
  const naksh        = realNaksh || getNakshatra()
  const slots        = scoredSlots(seed, planet, user.type, lunar, dayType, traits, lagna, moonSign, transitDelta, tithi, naksh)
  const sorted       = [...slots].sort((a, b) => b.score - a.score)
  const golden       = sorted[0]
  const worst        = sorted[sorted.length - 1]
  const medium       = [...slots].sort((a, b) => Math.abs(a.score) - Math.abs(b.score))[0]

  const dominant   = dominantDimension(planet, lunar, traits, lagna, moonSign, transitDelta)
  const confidence = toConfidence(golden.score, worst.score)

  const reasoning = buildReasoning({
    planet, lunar, dayType, traits, lagna, moonSign,
    transitInfo: domTransit,
    dominant,
    ctx:       dominant,
    dimScore:  golden[dominant] ?? golden.decision,
    riskScore: golden.risk,
    decision:  'do',
    realTithi: tithi,
    realNaksh: naksh
  })

  return {
    name:          user.name || 'You',
    golden_window: golden.time,
    avoid_window:  worst.time,
    lagna:         lagna?.name    || null,
    moon_sign:     moonSign?.name || null,
    summary:       buildSummary(reasoning, golden.time, worst.time),
    do:            DO_MSGS[seed % DO_MSGS.length],
    avoid:         `${worst.time} — ` + AVOID_MSGS[(seed + 1) % AVOID_MSGS.length],
    watch:         `${medium.time} — ` + WATCH_MSGS[(seed + 2) % WATCH_MSGS.length],
    confidence,
    _reasoning: {
      dominant,
      planet:          planet.name,
      lunarPhase:      lunar.name,
      dayType:         dayType.name,
      planetInfluence: PLANET_REASONING[planet.name],
      riskFlag:        reasoning.riskFlag,
      lagna:           lagna?.name    || null,
      moon_sign:       moonSign?.name || null,
      transitLabel:    reasoning.transitLabel,
      traits
    }
  }
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const body  = req.body || {}
  const users = Array.isArray(body.users) && body.users.length > 0
    ? body.users.slice(0, 3)
    : [{ name: null, dob: null, birth_time: null, type: null }]

  const planet  = getPlanet()
  const lunar   = getLunarPhase()
  const dayType = getDayType()
  const transits = getTransits()
  const vara    = getVara()

  // Moon-cycle Panchang (deterministic, no external API needed for core values)
  const mc      = getMoonCycle()
  const tithi   = getTithi()          // real value preferred via panchang route separately
  const naksh   = getMoonNakshatra(mc) // moon-cycle nakshatra
  const moonSgn = getMoonSign(mc)      // moon sign from cycle
  const dasha   = getMoonDasha(mc)

  const members = users.map(u => computeForUser(u, planet, lunar, dayType, transits, tithi, naksh, moonSgn))
  const primary = members[0]

  const avgConfidence = Math.round(
    members.reduce((s, m) => s + m.confidence, 0) / members.length
  )

  const domTransit = dominantTransit(transits)

  res.status(200).json({
    golden_window:      primary.golden_window,
    avoid_window:       primary.avoid_window,
    do:                 primary.do,
    avoid:              primary.avoid,
    watch:              primary.watch,
    planet:             planet.name,
    lunar_phase:        lunar.name,
    vara:               vara.name,
    tithi:              tithi.tithi,
    tithi_phase:        tithi.phase,
    nakshatra:          naksh.name,
    moon_sign:          moonSgn?.name || null,
    dasha:              dasha,
    transit:            domTransit ? { planet: domTransit.planet, sign: domTransit.sign } : null,
    confidence_summary: avgConfidence,
    members
  })
}
