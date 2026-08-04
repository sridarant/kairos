// /lib/decision/recommendations.js
// Generates prioritised, explainable recommendations for 12 life categories.
// Each recommendation answers: What? Why? When? How confident?

import { buildCategoryExplanation, resolveConflict } from './explanation.js'
import { scoreToTier, scoreToStars } from './confidence.js'

// Category definitions: primary dimension, secondary dimension, icon
const CATEGORIES = {
  career:       { dim:'d', sec:'c', icon:'💼', label:'Career' },
  money:        { dim:'r', sec:'d', icon:'💰', label:'Money',     invertRisk: true },
  relationships:{ dim:'c', sec:'f', icon:'❤️', label:'Relationships' },
  health:       { dim:'f', sec:'d', icon:'🌿', label:'Health' },
  learning:     { dim:'f', sec:'c', icon:'📚', label:'Learning' },
  travel:       { dim:'d', sec:'r', icon:'✈️', label:'Travel' },
  spiritual:    { dim:'f', sec:'c', icon:'🛕', label:'Spiritual' },
  home:         { dim:'f', sec:'d', icon:'🏠', label:'Home' },
  family:       { dim:'c', sec:'f', icon:'👨‍👩‍👧', label:'Family' },
  shopping:     { dim:'r', sec:'c', icon:'🛍️', label:'Shopping', invertRisk: true },
  medical:      { dim:'f', sec:'d', icon:'🏥', label:'Medical' }
}

// Action templates per category × confidence tier
const ACTIONS = {
  career: {
    High:   'Begin or advance your most important project today.',
    Medium: 'Focus on strategic planning and relationship-building.',
    Low:    'Review and consolidate existing commitments.'
  },
  money: {
    High:   'Good window to review finances and make considered decisions.',
    Medium: 'Defer large commitments; focus on budgeting and review.',
    Low:    'Avoid financial transactions today — caution is warranted.'
  },
  relationships: {
    High:   'Initiate important conversations and strengthen key bonds.',
    Medium: 'Listen actively; written communication may land better than calls.',
    Low:    'Avoid confrontational discussions — defer to a better window.'
  },
  health: {
    High:   'Excellent window for health decisions, exercise, and self-care.',
    Medium: 'Moderate activity supports recovery — avoid demanding choices.',
    Low:    'Rest and gentle routines serve better than ambitious health goals.'
  },
  learning: {
    High:   'Study complex material and tackle challenging intellectual work.',
    Medium: 'Revisit familiar concepts; review and consolidation work well.',
    Low:    'Short, practical sessions outperform deep study today.'
  },
  travel: {
    High:   'Favourable for planning and beginning travel.',
    Medium: 'Plan travel but defer booking major commitments.',
    Low:    'Avoid long journeys or travel decisions today.'
  },
  spiritual: {
    High:   'Excellent for meditation, temple visits, and spiritual practice.',
    Medium: 'Short spiritual routines and reflection are beneficial.',
    Low:    'Inner reflection is available even when outer practice is limited.'
  },
  home: {
    High:   'Begin home projects, renovation planning, or family decisions.',
    Medium: 'Light household tasks and maintenance serve well.',
    Low:    'Rest at home rather than begin new projects.'
  },
  family: {
    High:   'Gather family for discussions, planning, or shared activities.',
    Medium: 'Gentle family conversations and light activities are well-supported.',
    Low:    'Avoid family tensions — this is a day for individual restoration.'
  },
  shopping: {
    High:   'Well-supported for considered, planned purchases.',
    Medium: 'Stick to essentials — avoid impulse buying.',
    Low:    'Defer non-essential purchases to a stronger window.'
  },
  medical: {
    High:   'Good window for consultations, check-ups, and health decisions.',
    Medium: 'Routine appointments are fine; defer major procedures.',
    Low:    'Seek second opinions before committing to significant health decisions.'
  }
}

/**
 * scoreCategory: compute a category-specific score from slot dims.
 * Returns a normalised 0–100 value.
 */
function scoreCategory(cat, goldenDims, worstDims) {
  const def = CATEGORIES[cat]
  if (!def) return 50

  const primaryScore = goldenDims?.[def.dim] || 0
  const secScore     = goldenDims?.[def.sec]  || 0

  // For risk-inverse categories (money, shopping): lower risk = better
  let raw = def.invertRisk
    ? (primaryScore < 0 ? 70 + Math.abs(primaryScore) * 5 : 50 - primaryScore * 8)
    : ((primaryScore * 0.7 + secScore * 0.3) * 12 + 50)

  return Math.max(10, Math.min(95, Math.round(raw)))
}

/**
 * buildRecommendation: a single category recommendation object.
 */
function buildRecommendation(cat, { goldenDims, worstDims, planetName, nakshatraName, goldenTime }) {
  const def    = CATEGORIES[cat]
  const score  = scoreCategory(cat, goldenDims, worstDims)
  const tier   = scoreToTier(score)
  const stars  = scoreToStars(score)
  const action = ACTIONS[cat]?.[tier] || 'Proceed with awareness today.'

  // Identify conflicting dims
  const strongDims = Object.entries(goldenDims || {})
    .filter(([,v]) => v > 0.8).map(([k]) => k)
  const weakDims   = Object.entries(goldenDims || {})
    .filter(([,v]) => v < -0.5).map(([k]) => k)

  const conflict = resolveConflict(strongDims, weakDims)
  const reason   = conflict || buildCategoryExplanation(cat, goldenDims, planetName, nakshatraName)

  return {
    category:  cat,
    icon:      def.icon,
    label:     def.label,
    action,
    reason,
    best_time: goldenTime,
    confidence: tier,
    stars,
    score      // internal, used for priority ranking
  }
}

/**
 * buildAllRecommendations: produce ranked list of recommendations.
 * Returns top 5 prioritised + remainder.
 */
export function buildAllRecommendations(params) {
  const all = Object.keys(CATEGORIES).map(cat => buildRecommendation(cat, params))
  const sorted = [...all].sort((a, b) => b.score - a.score)
  return {
    top:  sorted.slice(0, 5),
    rest: sorted.slice(5)
  }
}
