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

// ─── Cultural name maps ───────────────────────────────────────────────────────
// Format used in explanation text: "Planet (Sanskrit / Tamil)"
export const PLANET_CULTURAL = {
  Sun:     'Surya / சூரியன்',
  Moon:    'Chandra / சந்திரன்',
  Mars:    'Kuja / செவ்வாய்',
  Mercury: 'Budha / புதன்',
  Jupiter: 'Guru / குரு',
  Venus:   'Shukra / சுக்கிரன்',
  Saturn:  'Shani / சனி'
}

// Nakshatra cycle (date % 9) — 9 nakshatras in rotation
// Format: "Tamil / Sanskrit"
const NAKSHATRAS = [
  { name: 'Ashwini',    cultural: 'அஸ்வினி / Ashwini',       label: 'a swift, initiating nakshatra' },
  { name: 'Bharani',    cultural: 'பரணி / Bharani',           label: 'a transformative, intense nakshatra' },
  { name: 'Krittika',   cultural: 'கிருத்திகை / Krittika',   label: 'a sharp, purifying nakshatra' },
  { name: 'Rohini',     cultural: 'ரோகிணி / Rohini',         label: 'a fertile, creative nakshatra' },
  { name: 'Mrigashira', cultural: 'மிருகசீரிடம் / Mrigashira', label: 'a curious, seeking nakshatra' },
  { name: 'Ardra',      cultural: 'திருவாதிரை / Ardra',      label: 'a stormy, transformative nakshatra' },
  { name: 'Punarvasu',  cultural: 'புனர்பூசம் / Punarvasu',  label: 'a returning, hopeful nakshatra' },
  { name: 'Pushya',     cultural: 'பூசம் / Pushya',           label: 'a nourishing, auspicious nakshatra' },
  { name: 'Ashlesha',   cultural: 'ஆயில்யம் / Ashlesha',     label: 'a penetrating, intuitive nakshatra' }
]

export function getNakshatra() {
  return NAKSHATRAS[new Date().getDate() % 9]
}

// Returns full planet label for use in explanation text
export function planetLabel(planetName) {
  const cultural = PLANET_CULTURAL[planetName] || planetName
  return `${planetName} (${cultural})`
}

// ─── Layer 2: Lunar phase ─────────────────────────────────────────────────────
export function getLunarPhase() {
  const phase = new Date().getDate() % 30
  if (phase <= 7)  return { name: 'Waxing', decision:  1, focus:  0, risk:  0, label: 'waxing moon lifts initiative' }
  if (phase <= 15) return { name: 'Full',   decision:  2, focus:  1, risk:  0, label: 'full moon amplifies clarity and focus' }
  if (phase <= 22) return { name: 'Waning', decision:  0, focus:  0, risk:  1, label: 'waning moon raises caution' }
  return            { name: 'Dark',   decision: -1, focus: -1, risk:  0, label: 'dark moon calls for rest, not action' }
}

// ─── Layer 3: Day type (nakshatra-style) ──────────────────────────────────────
const DAY_TYPES = [
  { name: 'Initiate',    decision:  1, communication:  0, risk:  0, focus:  0, label: 'an Initiate day — ideal for starting things' },
  { name: 'Build',       decision:  0, communication:  0, risk:  0, focus:  1, label: 'a Build day — sustained effort is rewarded' },
  { name: 'Communicate', decision:  0, communication:  2, risk:  0, focus:  0, label: 'a Communicate day — conversations carry extra weight' },
  { name: 'Reflect',     decision:  0, communication:  0, risk:  0, focus:  2, label: 'a Reflect day — deep thinking over quick action' },
  { name: 'Restrict',    decision: -2, communication:  0, risk:  1, focus:  0, label: 'a Restrict day — avoid major decisions; review instead' }
]

export function getDayType() {
  return DAY_TYPES[new Date().getDate() % 5]
}

// ─── Layer 4: User trait model ────────────────────────────────────────────────
// Traits are derived deterministically from DOB day (or date as fallback).
// Each trait is in range -1 to +1 and represents a stable behavioral tendency.
export function buildTraits(dob) {
  const dobDay = dob
    ? parseInt((dob.split('-')[2] || dob.split('/')[1] || '0'), 10)
    : new Date().getDate()

  // Each trait uses a different modular offset to ensure variety across users
  const decision_bias       = ((dobDay % 3) - 1)          // -1, 0, +1
  const risk_tolerance      = ((dobDay + 1) % 3) - 1      // -1, 0, +1 (offset)
  const communication_style = (dobDay % 2)                 //  0, +1
  const focus_strength      = (((dobDay + 2) % 3) - 1)    // -1, 0, +1 (offset)

  return { decision_bias, risk_tolerance, communication_style, focus_strength }
}

// Trait narrative for Claude prompts — maps each trait value to a behaviour description
export function traitNarrative(traits) {
  const lines = []

  if (traits.decision_bias > 0)  lines.push('You tend to move quickly on decisions — lean into that today.')
  if (traits.decision_bias < 0)  lines.push('You may overthink decisions — trust the data in front of you.')
  if (traits.decision_bias === 0) lines.push('Your decision pace is balanced — timing matters more than speed.')

  if (traits.risk_tolerance > 0)  lines.push('Your risk tolerance is naturally higher — weigh upsides carefully.')
  if (traits.risk_tolerance < 0)  lines.push('You tend toward caution — that instinct is worth honouring today.')
  if (traits.risk_tolerance === 0) lines.push('Your risk instincts are moderate — follow the signals.')

  if (traits.communication_style > 0) lines.push('Your communication strength is high — use it.')
  if (traits.communication_style === 0) lines.push('Communication takes more effort today — be deliberate.')

  if (traits.focus_strength > 0)  lines.push('Your focus tends to be strong — protect your deep work time.')
  if (traits.focus_strength < 0)  lines.push('Focus may be harder to hold today — work in shorter bursts.')
  if (traits.focus_strength === 0) lines.push('Focus is context-dependent for you — set the environment first.')

  return lines
}

// ─── Human-readable dimension labels ─────────────────────────────────────────
export const DIM_LABEL = {
  decision:      'decision-making clarity',
  communication: 'communication strength',
  focus:         'focus and concentration',
  risk:          'risk sensitivity'
}

// ─── User seed (for slot jitter, separate from trait seed) ───────────────────
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

// ─── Full stacked scoring (6 layers) ─────────────────────────────────────────
// Order: base → planet → lunar → day type → user traits → profile type + jitter
export function scoredSlots(seed, planet, type, lunar, dayType, traits) {
  const p  = planet  || getPlanet()
  const lu = lunar   || getLunarPhase()
  const dt = dayType || getDayType()
  const tb = typeBoost(type)
  const tr = traits  || { decision_bias: 0, risk_tolerance: 0, communication_style: 0, focus_strength: 0 }

  const decAdj  = (seed % 3) - 1   // date-based jitter: -1, 0, +1
  const commAdj = seed % 2          // date-based jitter: 0, +1

  return SLOTS.map(s => {
    const dec   = s.decision      + p.decision      + lu.decision  + dt.decision      + tr.decision_bias      + decAdj  + tb.decision
    const comm  = s.communication + p.communication                + dt.communication + tr.communication_style + commAdj + tb.communication
    const risk  = s.risk          + p.risk          + lu.risk                         + tr.risk_tolerance
    const focus = s.focus         + p.focus         + lu.focus                        + tr.focus_strength                + tb.focus
    const score = dec + comm + focus - risk
    return { ...s, dec, comm, risk, focus, score }
  })
}

// ─── Dominant dimension: planet + lunar + traits combined ─────────────────────
export function dominantDimension(planet, lunar, traits) {
  const p  = planet || getPlanet()
  const lu = lunar  || getLunarPhase()
  const tr = traits || { decision_bias: 0, risk_tolerance: 0, communication_style: 0, focus_strength: 0 }

  const combined = {
    decision:      Math.abs(p.decision      + lu.decision  + tr.decision_bias),
    communication: Math.abs(p.communication               + tr.communication_style),
    focus:         Math.abs(p.focus         + lu.focus     + tr.focus_strength),
    risk:          Math.abs(p.risk          + lu.risk      + tr.risk_tolerance)
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
export function buildReasoning({ planet, lunar, dayType, dominant, ctx, dimScore, riskScore, decision, traits }) {
  const p  = planet  || getPlanet()
  const lu = lunar   || getLunarPhase()
  const dt = dayType || getDayType()
  const tr = traits  || {}
  const nk = getNakshatra()

  const planetInfluence = PLANET_REASONING[p.name]
  const dimHuman  = DIM_LABEL[dominant] || dominant
  const ctxHuman  = DIM_LABEL[ctx]      || ctx
  const riskFlag  = riskScore >= 1 ? 'elevated' : riskScore <= -1 ? 'reduced' : 'neutral'

  return {
    planet:           p.name,
    planetLabel:      planetLabel(p.name),
    planetInfluence,
    lunarPhase:       lu.name,
    lunarLabel:       lu.label,
    dayTypeName:      dt.name,
    dayTypeLabel:     dt.label,
    nakshatraName:    nk.name,
    nakshatraCultural: nk.cultural,
    nakshatraLabel:   nk.label,
    dominant,
    dimHuman,
    ctx,
    ctxHuman,
    dimScore,
    riskScore,
    riskFlag,
    alignedWithPlanet: dominant === ctx,
    decision,
    traits:           tr,
    traitLines:       traitNarrative(tr)
  }
}
