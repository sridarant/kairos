import {
  scoredSlots, buildSeed, buildTraits, getPlanet, getLunarPhase, getDayType,
  toConfidence, dominantDimension, DIM_LABEL, PLANET_REASONING, buildReasoning,
  computeLagna, computeMoonSign,
  getTransits, aggregateTransits, dominantTransit,
  getTithi, getNakshatra, getVara
} from './engine.js'

const DO_MSGS = [
  'Make important decisions and have key conversations',
  'Tackle complex work requiring full focus',
  'Send proposals, pitches, or critical messages',
  'Negotiate, plan, or lead discussions',
  'Start high-stakes projects with clear intent'
]
const AVOID_MSGS = [
  'Avoid financial decisions — risk tolerance is low',
  'Avoid high-stakes calls or commitments',
  'Avoid reactive responses — clarity is reduced',
  'Avoid multitasking on anything critical',
  'Avoid impulsive choices under pressure'
]
const WATCH_MSGS = [
  'Energy dip likely — pace yourself',
  'Decision fatigue building — take breaks',
  'Focus may waver — remove distractions',
  "Transition period — wrap up, don't start new things",
  'Stress peaks around context-switching'
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

function computeForUser(user, planet, lunar, dayType, transits) {
  const seed         = buildSeed(user.dob)
  const traits       = buildTraits(user.dob)
  const lagna        = computeLagna(user.birth_time)
  const moonSign     = computeMoonSign(user.dob)
  const transitDelta = aggregateTransits(transits, lagna, moonSign)
  const domTransit   = dominantTransit(transits)
  const slots        = scoredSlots(seed, planet, user.type, lunar, dayType, traits, lagna, moonSign, transitDelta)
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
    decision:  'do'
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

export default function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const body  = req.body || {}
  const users = Array.isArray(body.users) && body.users.length > 0
    ? body.users.slice(0, 3)
    : [{ name: null, dob: null, birth_time: null, type: null }]

  const planet  = getPlanet()
  const lunar   = getLunarPhase()
  const dayType = getDayType()
  const transits = getTransits()
  const members = users.map(u => computeForUser(u, planet, lunar, dayType, transits))
  const primary = members[0]

  const avgConfidence = Math.round(
    members.reduce((s, m) => s + m.confidence, 0) / members.length
  )

  // Expose dominant transit in top-level response
  const domTransit = dominantTransit(transits)
  const tithi   = getTithi()
  const naksh   = getNakshatra()
  const vara    = getVara()

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
    transit:            domTransit ? { planet: domTransit.planet, sign: domTransit.sign } : null,
    confidence_summary: avgConfidence,
    members
  })
}
