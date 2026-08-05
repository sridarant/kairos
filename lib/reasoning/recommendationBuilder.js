/**
 * /lib/reasoning/recommendationBuilder.js
 *
 * Converts ReasoningResult into structured recommendations.
 * Every recommendation answers: What? Why? When? How confident?
 *
 * NO natural language generated here — only structured data for the language layer.
 */

import { topEvidence } from './priorityEngine.js'

// Action templates indexed by [category][quality]
const ACTIONS = {
  career: {
    supportive: 'Begin or advance your most important project.',
    mixed:      'Focus on strategic planning — defer high-stakes initiatives.',
    caution:    'Review and consolidate; avoid new commitments.'
  },
  finance: {
    supportive: 'Good window for considered financial decisions.',
    mixed:      'Routine transactions only — defer large commitments.',
    caution:    'Avoid significant financial transactions today.'
  },
  relationships: {
    supportive: 'Initiate important conversations and strengthen key bonds.',
    mixed:      'Listen actively — written communication preferred.',
    caution:    'Defer sensitive discussions to a clearer window.'
  },
  health: {
    supportive: 'Excellent window for health decisions and self-care.',
    mixed:      'Moderate activity; avoid demanding health decisions.',
    caution:    'Rest and gentle routines — avoid strenuous demands.'
  },
  education: {
    supportive: 'Peak absorption — tackle complex study and planning.',
    mixed:      'Review and revision work better than new material.',
    caution:    'Light reading and revision only.'
  },
  travel: {
    supportive: 'Favourable for planning and beginning journeys.',
    mixed:      'Plan travel but defer booking major commitments.',
    caution:    'Avoid long journeys or travel decisions today.'
  },
  business: {
    supportive: 'Excellent for proposals, contracts and new ventures.',
    mixed:      'Sustain existing work; avoid new business commitments.',
    caution:    'Review existing agreements; defer new business moves.'
  },
  property: {
    supportive: 'Good window for property decisions and negotiations.',
    mixed:      'Research and planning — defer signing or buying.',
    caution:    'Avoid property transactions today.'
  },
  legal: {
    supportive: 'Favourable for legal consultations and agreements.',
    mixed:      'Seek advice; defer signing legal documents.',
    caution:    'Avoid legal action or signing today.'
  },
  communication: {
    supportive: 'Excellent for negotiations, meetings and key messages.',
    mixed:      'Routine communication works; defer critical messages.',
    caution:    'Avoid confrontational or high-stakes communication.'
  },
  learning: {
    supportive: 'Study complex material — learning capacity is high.',
    mixed:      'Review familiar concepts; short sessions work best.',
    caution:    'Practical tasks over intensive intellectual work.'
  },
  family: {
    supportive: 'Gather family for meaningful discussions and bonding.',
    mixed:      'Gentle family time; defer difficult conversations.',
    caution:    'Rest with family; avoid contentious family matters.'
  },
  spiritual: {
    supportive: 'Excellent for meditation, prayer and spiritual practice.',
    mixed:      'Short routines and reflection serve well.',
    caution:    'Inner reflection is available even in challenging periods.'
  },
  shopping: {
    supportive: 'Well-supported for considered, planned purchases.',
    mixed:      'Essentials only — avoid impulse buying.',
    caution:    'Defer non-essential purchases to a stronger window.'
  },
  medical: {
    supportive: 'Good for consultations, check-ups and health decisions.',
    mixed:      'Routine appointments fine — defer major procedures.',
    caution:    'Seek a second opinion; defer significant health decisions.'
  }
}

/**
 * buildRecommendations(reasoningResult, goldenWindow, evidenceNodes)
 *
 * Returns an array of ranked Recommendation objects:
 * {
 *   category, icon, label, action, reason,
 *   bestTime, confidence, stars, quality,
 *   keyEvidence: [{ subject, influence }]
 * }
 */
const CAT_META = {
  career:        { icon:'💼', label:'Career' },
  finance:       { icon:'💰', label:'Finance' },
  relationships: { icon:'❤️',  label:'Relationships' },
  health:        { icon:'🌿', label:'Health' },
  education:     { icon:'📚', label:'Education' },
  travel:        { icon:'✈️',  label:'Travel' },
  business:      { icon:'🏢', label:'Business' },
  property:      { icon:'🏠', label:'Property' },
  legal:         { icon:'⚖️',  label:'Legal' },
  communication: { icon:'💬', label:'Communication' },
  learning:      { icon:'🧠', label:'Learning' },
  family:        { icon:'👨‍👩‍👧', label:'Family' },
  spiritual:     { icon:'🛕', label:'Spiritual' },
  shopping:      { icon:'🛍️', label:'Shopping' },
  medical:       { icon:'🏥', label:'Medical' }
}

export function buildRecommendations(reasoningResult, goldenWindow, evidenceNodes) {
  const { categories, confidence } = reasoningResult
  const recs = []

  for (const [cat, catReason] of Object.entries(categories)) {
    const meta    = CAT_META[cat]
    if (!meta) continue
    const quality = catReason.quality || 'neutral'
    const action  = ACTIONS[cat]?.[quality === 'neutral' ? 'mixed' : quality] || ACTIONS[cat]?.mixed || 'Proceed with awareness.'
    const keyEv   = (catReason.keyFactors || []).slice(0, 2).map(f => ({ subject: f.subject, influence: f.influence }))
    const reasonText = keyEv.length
      ? keyEv.map(e => `${e.subject} ${e.influence}`).join('; ')
      : 'Conditions are mixed today.'

    recs.push({
      category:   cat,
      icon:       meta.icon,
      label:      meta.label,
      action,
      reason:     reasonText,
      bestTime:   goldenWindow,
      confidence: quality === 'supportive' ? confidence : quality === 'caution' ? 'Low' : 'Medium',
      stars:      catReason.stars || 3,
      quality,
      keyEvidence: keyEv,
      // Internal score for ranking
      _score:     catReason.stars || 3
    })
  }

  // Sort by stars descending
  recs.sort((a, b) => b._score - a._score)
  return { top: recs.slice(0, 5), rest: recs.slice(5) }
}
