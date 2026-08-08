/**
 * /lib/decision/recommendations.js
 *
 * Category-specific recommendation objects.
 * Each category has its own best_time derived from the slot dimension most
 * relevant to that category — NOT the overall golden window.
 *
 * Per-category time computation:
 *   - career, travel, business, legal: maximise 'd' (decision) dimension
 *   - relationships, family, communication: maximise 'c' (communication) dimension
 *   - health, learning, spiritual, home, medical: maximise 'f' (focus) dimension
 *   - finance, shopping, property: minimise 'r' (risk) dimension = safest slot
 *
 * If all slots score identically on a dimension (uniform distribution), the overall
 * golden window is used as authentic fallback.
 */

import { resolveConflict } from './explanation.js'

// ─── Category configuration ───────────────────────────────────────────────────

export const CATEGORIES = {
  career:        { icon:'💼', label:'Career',        dim:'d' },
  finance:       { icon:'💰', label:'Finance',       dim:'r', invertDim:true },
  relationships: { icon:'❤️',  label:'Relationships', dim:'c' },
  health:        { icon:'🌿', label:'Health',        dim:'f' },
  learning:      { icon:'🧠', label:'Learning',      dim:'f' },
  travel:        { icon:'✈️',  label:'Travel',        dim:'d' },
  spiritual:     { icon:'🛕', label:'Spiritual',     dim:'f' },
  home:          { icon:'🏠', label:'Home',          dim:'f' },
  family:        { icon:'👨‍👩‍👧', label:'Family',       dim:'c' },
  shopping:      { icon:'🛍️', label:'Shopping',      dim:'r', invertDim:true },
  medical:       { icon:'🏥', label:'Medical',       dim:'f' },
  communication: { icon:'💬', label:'Communication', dim:'c' },
  business:      { icon:'🏢', label:'Business',      dim:'d' },
  property:      { icon:'🏘️', label:'Property',      dim:'r', invertDim:true },
  legal:         { icon:'⚖️',  label:'Legal',         dim:'d' }
}

// ─── Tier-based actions (concise, non-repetitive) ────────────────────────────

const ACTIONS = {
  career: {
    High:   'Strong conditions for career decisions, interviews, or advancing priorities.',
    Medium: 'Steady day for career work. Progress on existing tasks.',
    Low:    'Keep career decisions light. Focus on routine work only.'
  },
  finance: {
    High:   'Favourable for reviewed financial decisions and planning.',
    Medium: 'Neutral financial energy. Avoid large speculative moves.',
    Low:    'Caution with finances today. Defer major transactions.'
  },
  relationships: {
    High:   'Excellent for important conversations and deepening connections.',
    Medium: 'Good for everyday communication. Be patient in disagreements.',
    Low:    'Avoid heated discussions today. Keep conversations light.'
  },
  health: {
    High:   'Good day for health appointments, exercise, and wellness practices.',
    Medium: 'Steady energy. Maintain routines and avoid overexertion.',
    Low:    'Rest and recuperation. Avoid demanding physical activities.'
  },
  learning: {
    High:   'Strong focus energy. Ideal for study, research, or deep learning.',
    Medium: 'Good for review and consolidation of existing knowledge.',
    Low:    'Light study only. Concentration may be lower than usual.'
  },
  travel: {
    High:   'Favourable for travel planning and departures.',
    Medium: 'Routine travel is fine. Avoid impulsive long-distance plans.',
    Low:    'Delay significant travel decisions if possible.'
  },
  spiritual: {
    High:   'Excellent for meditation, prayer, and reflective practices.',
    Medium: 'Good for quiet reflection and spiritual routines.',
    Low:    'Simple, grounding practices are best today.'
  },
  home: {
    High:   'Good day for home decisions, improvements, and family time.',
    Medium: 'Steady energy for home routines and maintenance.',
    Low:    'Keep home activities light and low-effort.'
  },
  family: {
    High:   'Strong harmony. Good for family gatherings and shared planning.',
    Medium: 'Balanced family energy. Keep plans flexible.',
    Low:    'Be patient with family members. Avoid unresolved tensions.'
  },
  shopping: {
    High:   'Considered purchases are well-supported today.',
    Medium: 'Routine shopping is fine. Avoid impulsive spending.',
    Low:    'Defer significant purchases. Risk of regret is higher.'
  },
  medical: {
    High:   'Good day for health reviews, consultations, and treatments.',
    Medium: 'Routine medical matters are well-supported.',
    Low:    'Postpone elective procedures if possible. Rest is better.'
  },
  communication: {
    High:   'Ideal for important messages, presentations, and negotiations.',
    Medium: 'Good day for routine communication and follow-ups.',
    Low:    'Keep communications brief. Avoid sensitive discussions.'
  },
  business: {
    High:   'Strong conditions for business decisions, pitches, and deals.',
    Medium: 'Steady business day. Focus on execution over new initiatives.',
    Low:    'Avoid major business commitments. Review existing plans.'
  },
  property: {
    High:   'Supported window for property decisions and negotiations.',
    Medium: 'Research is fine; defer final property commitments.',
    Low:    'Avoid property decisions today. Wait for a cleaner window.'
  },
  legal: {
    High:   'Good day for legal reviews, signings, and consultations.',
    Medium: 'Routine legal work is fine. Avoid rushed agreements.',
    Low:    'Defer legal signings. Conditions are less favourable.'
  }
}

// ─── Per-category best window from scored slots ───────────────────────────────

/**
 * categoryBestWindow(cat, scoredSlots) → HH:MM–HH:MM or null
 *
 * Independently scores each slot for the given category's primary dimension.
 * This is the correct fix for WS1: prevents the overall golden window from
 * being inherited by every category indiscriminately.
 */
export function categoryBestWindow(cat, scoredSlots) {
  const def = CATEGORIES[cat]
  if (!def || !scoredSlots?.length) return null

  const dim = def.dim
  const invert = def.invertDim   // true for finance/shopping/property (lower risk = better)

  const sorted = [...scoredSlots].sort((a, b) =>
    invert
      ? (a.dims[dim] || 0) - (b.dims[dim] || 0)   // lowest risk
      : (b.dims[dim] || 0) - (a.dims[dim] || 0)   // highest value
  )

  // If top two slots are tied (uniform distribution), return null so caller uses golden
  const top = sorted[0]
  const second = sorted[1]
  if (second && top.dims[dim] === second.dims[dim]) {
    // Check if ALL slots are the same (fully uniform)
    const allSame = sorted.every(s => s.dims[dim] === top.dims[dim])
    if (allSame) return null   // genuine uniform → caller uses golden as authentic fallback
  }

  return top.time
}

// ─── Score a category ─────────────────────────────────────────────────────────

function scoreCategory(cat, goldenDims, worstDims) {
  switch (cat) {
    case 'career':        return goldenDims.d || 0
    case 'finance':       return -(worstDims.r || 0)
    case 'relationships': return goldenDims.c || 0
    case 'health':        return goldenDims.f || 0
    case 'learning':      return (goldenDims.f || 0) + (goldenDims.c || 0) * 0.3
    case 'travel':        return (goldenDims.d || 0) - (goldenDims.r || 0) * 0.5
    case 'spiritual':     return goldenDims.f || 0
    case 'home':          return (goldenDims.f || 0) * 0.8
    case 'family':        return goldenDims.c || 0
    case 'shopping':      return -(worstDims.r || 0) * 0.8
    case 'medical':       return (goldenDims.f || 0) * 0.9
    case 'communication': return goldenDims.c || 0
    case 'business':      return (goldenDims.d || 0) + (goldenDims.c || 0) * 0.5
    case 'property':      return -(worstDims.r || 0) * 0.9
    case 'legal':         return (goldenDims.d || 0) * 0.9
    default:              return 0
  }
}

function scoreToTier(score) {
  if (score >= 2)  return 'High'
  if (score >= 0)  return 'Medium'
  return 'Low'
}

function scoreToStars(score) {
  if (score >= 2.5) return 5
  if (score >= 1.5) return 4
  if (score >= 0.5) return 3
  if (score >= -0.5)return 2
  return 1
}

function buildCategoryExplanation(cat, goldenDims, planetName, nakshatraName) {
  const dim = CATEGORIES[cat]?.dim
  if (!dim) return null

  const catLabel = CATEGORIES[cat]?.label || cat
  const strength = goldenDims[dim] > 1.5 ? 'strong' : goldenDims[dim] > 0 ? 'moderate' : 'limited'
  const planet   = planetName   ? ` ${planetName} supports` : 'Conditions support'
  const nak      = nakshatraName ? ` during ${nakshatraName}` : ''

  return `${planet} ${catLabel.toLowerCase()} today with ${strength} alignment${nak}.`
}

// ─── Build one recommendation ─────────────────────────────────────────────────

/**
 * buildRecommendation(cat, params)
 *
 * params includes scoredSlots (NEW) so this function can independently
 * compute the category-specific best window.
 */
function buildRecommendation(cat, { goldenDims, worstDims, planetName, nakshatraName, goldenTime, scoredSlots }) {
  const def    = CATEGORIES[cat]
  const score  = scoreCategory(cat, goldenDims, worstDims)
  const tier   = scoreToTier(score)
  const stars  = scoreToStars(score)
  const action = ACTIONS[cat]?.[tier] || 'Proceed with awareness today.'

  const strongDims = Object.entries(goldenDims || {}).filter(([,v]) => v > 0.8).map(([k]) => k)
  const weakDims   = Object.entries(goldenDims || {}).filter(([,v]) => v < -0.5).map(([k]) => k)

  const conflict = resolveConflict(strongDims, weakDims)
  const reason   = conflict || buildCategoryExplanation(cat, goldenDims, planetName, nakshatraName)

  // Per-category best window: independent calculation using dimension scores
  // Falls back to goldenTime only if dimension values are genuinely uniform
  const catBestTime = categoryBestWindow(cat, scoredSlots) || goldenTime

  return {
    category:  cat,
    icon:      def.icon,
    label:     def.label,
    action,
    reason,
    best_time: catBestTime,        // ← per-category, not global golden
    confidence: tier,
    stars,
    score
  }
}

// ─── Build all recommendations ────────────────────────────────────────────────

export function buildAllRecommendations(params) {
  const all    = Object.keys(CATEGORIES).map(cat => buildRecommendation(cat, params))
  const sorted = [...all].sort((a, b) => b.score - a.score)
  return {
    top:  sorted.slice(0, 5),
    rest: sorted.slice(5)
  }
}
