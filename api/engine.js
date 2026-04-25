// ─── Base time slots ──────────────────────────────────────────────────────────
export const SLOTS = [
  { time: '07:00–09:00', decision: 1,  communication: 1,  risk: 0,  focus: 1  },
  { time: '09:00–11:00', decision: 2,  communication: 2,  risk: 0,  focus: 2  },
  { time: '11:00–13:00', decision: 1,  communication: 2,  risk: 0,  focus: 1  },
  { time: '13:00–15:00', decision: 0,  communication: -1, risk: -1, focus: 0  },
  { time: '15:00–17:00', decision: -1, communication: -2, risk: -1, focus: -1 },
  { time: '17:00–19:00', decision: -2, communication: -1, risk: -2, focus: -1 }
]

// ─── Layer 1: Planetary ───────────────────────────────────────────────────────
export const PLANETS = [
  { name: 'Sun',     decision:  1, communication:  0, risk:  0, focus:  0 },
  { name: 'Moon',    decision:  0, communication:  0, risk:  0, focus:  1 },
  { name: 'Mars',    decision:  1, communication:  0, risk:  2, focus:  0 },
  { name: 'Mercury', decision:  0, communication:  2, risk:  0, focus:  0 },
  { name: 'Jupiter', decision:  2, communication:  0, risk:  0, focus:  0 },
  { name: 'Venus',   decision:  0, communication:  1, risk:  0, focus:  0 },
  { name: 'Saturn',  decision: -1, communication:  0, risk:  1, focus:  0 }
]

export function getPlanet() {
  return PLANETS[new Date().getDay()]
}

export const PLANET_REASONING = {
  Sun:     'decisiveness is amplified today',
  Moon:    'intuition and focus are heightened',
  Mars:    'bold action is favoured but risk is elevated',
  Mercury: 'communication flows with unusual clarity',
  Jupiter: 'conditions are ripe for confident decisions',
  Venus:   'collaboration and dialogue are well-starred',
  Saturn:  'patience and structure are rewarded over impulse'
}

// ─── Layer 2: Lunar phase ─────────────────────────────────────────────────────
// phase = date % 30  →  0–7 waxing crescent, 8–15 full, 16–22 waning, 23–29 dark
export function getLunarPhase() {
  const phase = new Date().getDate() % 30
  if (phase <= 7)  return { name: 'Waxing',   decision:  1, focus:  0, risk:  0, label: 'waxing moon lifts initiative' }
  if (phase <= 15) return { name: 'Full',      decision:  2, focus:  1, risk:  0, label: 'full moon amplifies clarity and focus' }
  if (phase <= 22) return { name: 'Waning',    decision:  0, focus:  0, risk:  1, label: 'waning moon raises caution' }
  return            { name: 'Dark',      decision: -1, focus: -1, risk:  0, label: 'dark moon calls for rest, not action' }
}

// ─── Layer 3: Day type (nakshatra-style) ──────────────────────────────────────
const DAY_TYPES = [
  { name: 'Initiate',     decision:  1, communication:  0, risk:  0, focus:  0, label: 'an Initiate day — ideal for starting things' },
  { name: 'Build',        decision:  0, communication:  0, risk:  0, focus:  1, label: 'a Build day — sustained effort is rewarded' },
  { name: 'Communicate',  decision:  0, communication:  2, risk:  0, focus:  0, label: 'a Communicate day — conversations carry extra weight' },
  { name: 'Reflect',      decision:  0, communication:  0, risk:  0, focus:  2, label: 'a Reflect day — deep thinking over quick action' },
  { name: 'Restrict',     decision: -2, communication:  0, risk:  1, focus:  0, label: 'a Restrict day — avoid major decisions; review instead' }
]

export function getDayType() {
  return DAY_TYPES[new Date().getDate() % 5]
}

// Human-readable dimension labels
export const DIM_LABEL = {
  decision:      'decision-making clarity',
  communication: 'communication strength',
  focus:         'focus and concentration',
  risk:          'risk sensitivity'
}

// ─── User seed ────────────────────────────────────────────────────────────────
export function buildSeed(dob) {
  const dateNum = new Date().getDate()
  const dobDay  = dob ? parseInt((dob.split('-')[2] || dob.split('/')[1] || '0'), 10) : 0
  return dateNum + (dobDay || 0)
}

// ─── Profile type boosts ──────────────────────────────────────────────────────
function typeBoost(type) {
  if (!type) return { decision: 0, communication: 0, focus: 0 }
  const t = type.toLowerCase()
  if (t.includes('work') || t.includes('entrepreneur'))
    return { decision: 1, communication: 1, focus: 0 }
  if (t.includes('student'))
    return { decision: 0, communication: 0, focus: 1 }
  if (t.includes('creative'))
    return { decision: 0, communication: 1, focus: 1 }
  return { decision: 0, communication: 0, focus: 0 }
}

// ─── Full stacked scoring (5 layers) ─────────────────────────────────────────
// Order: base → planet → lunar → day type → user personalisation
export function scoredSlots(seed, planet, type, lunar, dayType) {
  const p  = planet  || getPlanet()
  const lu = lunar   || getLunarPhase()
  const dt = dayType || getDayType()
  const tb = typeBoost(type)

  const decAdj  = (seed % 3) - 1   // personal jitter: -1, 0, +1
  const commAdj = seed % 2          // personal jitter:  0, +1

  return SLOTS.map(s => {
    const dec   = s.decision      + p.decision      + lu.decision  + dt.decision  + decAdj  + tb.decision
    const comm  = s.communication + p.communication                + dt.communication + commAdj + tb.communication
    const risk  = s.risk          + p.risk          + lu.risk
    const focus = s.focus         + p.focus         + lu.focus                   + tb.focus
    const score = dec + comm + focus - risk
    return { ...s, dec, comm, risk, focus, score }
  })
}

// ─── Dominant layer: planet + lunar combined ──────────────────────────────────
export function dominantDimension(planet, lunar) {
  const p  = planet || getPlanet()
  const lu = lunar  || getLunarPhase()
  const combined = {
    decision:      Math.abs(p.decision      + lu.decision),
    communication: Math.abs(p.communication),
    focus:         Math.abs(p.focus         + lu.focus),
    risk:          Math.abs(p.risk          + lu.risk)
  }
  return Object.entries(combined).sort((a, b) => b[1] - a[1])[0][0]
}

// ─── Confidence from score spread ─────────────────────────────────────────────
export function toConfidence(bestScore, worstScore) {
  const spread = bestScore - worstScore
  if (spread >= 14) return Math.min(92, 80 + Math.round((spread - 14) * 2))
  if (spread >= 8)  return Math.round(60 + ((spread - 8) / 6) * 15)
  return Math.max(20, Math.round((spread / 8) * 60))
}

// ─── Reasoning builder ────────────────────────────────────────────────────────
export function buildReasoning({ planet, lunar, dayType, dominant, ctx, dimScore, riskScore, decision }) {
  const p  = planet  || getPlanet()
  const lu = lunar   || getLunarPhase()
  const dt = dayType || getDayType()

  const planetInfluence = PLANET_REASONING[p.name]
  const dimHuman  = DIM_LABEL[dominant] || dominant
  const ctxHuman  = DIM_LABEL[ctx]      || ctx
  const riskFlag  = riskScore >= 1 ? 'elevated' : riskScore <= -1 ? 'reduced' : 'neutral'

  return {
    planet:          p.name,
    planetInfluence,
    lunarPhase:      lu.name,
    lunarLabel:      lu.label,
    dayTypeName:     dt.name,
    dayTypeLabel:    dt.label,
    dominant,
    dimHuman,
    ctx,
    ctxHuman,
    dimScore,
    riskScore,
    riskFlag,
    alignedWithPlanet: dominant === ctx,
    decision
  }
}
