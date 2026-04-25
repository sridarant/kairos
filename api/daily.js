import {
  scoredSlots, buildSeed, buildTraits, getPlanet, getLunarPhase, getDayType,
  toConfidence, dominantDimension, DIM_LABEL, PLANET_REASONING, buildReasoning,
  computeLagna, computeMoonSign
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

function buildSummary(r, goldenTime) {
  const traitHint = r.traitLines.length > 0 ? ` ${r.traitLines[0]}` : ''
  const riskNote  = r.riskFlag === 'elevated'
    ? ' Manage risk carefully.'
    : r.riskFlag === 'reduced'
    ? ' Favour conservative moves.'
    : ''
  const culturalNote = `${r.planetLabel} ${r.planetInfluence}; today falls under ${r.nakshatraCultural} (${r.nakshatraLabel}).`
  const birthNote = [
    r.lagnaSign   ? `Lagna in ${r.lagnaSign}`   : '',
    r.moonSignName ? `Moon in ${r.moonSignName}` : ''
  ].filter(Boolean).join(', ')
  const birthLine = birthNote ? ` ${birthNote} shapes your personal alignment today.` : ''
  return (
    `${goldenTime} is your strongest window — ${r.dimHuman} is heightened. ` +
    `${culturalNote}${birthLine}${riskNote}${traitHint}`
  )
}

function computeForUser(user, planet, lunar, dayType) {
  const seed     = buildSeed(user.dob)
  const traits   = buildTraits(user.dob)
  const lagna    = computeLagna(user.birth_time)
  const moonSign = computeMoonSign(user.dob)
  const slots    = scoredSlots(seed, planet, user.type, lunar, dayType, traits, lagna, moonSign)
  const sorted   = [...slots].sort((a, b) => b.score - a.score)
  const golden   = sorted[0]
  const worst    = sorted[sorted.length - 1]
  const medium   = [...slots].sort((a, b) => Math.abs(a.score) - Math.abs(b.score))[0]

  const dominant   = dominantDimension(planet, lunar, traits, lagna, moonSign)
  const confidence = toConfidence(golden.score, worst.score)

  const reasoning = buildReasoning({
    planet, lunar, dayType, traits, lagna, moonSign,
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
    summary:       buildSummary(reasoning, golden.time),
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
  const members = users.map(u => computeForUser(u, planet, lunar, dayType))
  const primary = members[0]

  const avgConfidence = Math.round(
    members.reduce((s, m) => s + m.confidence, 0) / members.length
  )

  res.status(200).json({
    golden_window:      primary.golden_window,
    avoid_window:       primary.avoid_window,
    do:                 primary.do,
    avoid:              primary.avoid,
    watch:              primary.watch,
    planet:             planet.name,
    lunar_phase:        lunar.name,
    day_type:           dayType.name,
    confidence_summary: avgConfidence,
    members
  })
}
