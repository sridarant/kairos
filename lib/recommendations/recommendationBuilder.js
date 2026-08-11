/**
 * /lib/recommendations/recommendationBuilder.js
 *
 * Builds a canonical RecommendationPackage from the Decision Engine output.
 * This is the single source of truth for ALL recommendations in the application.
 *
 * RecommendationPackage shape:
 * {
 *   id, category, priority, title, summary, recommendation,
 *   confidence, confidenceReason, evidence, bestWindow, avoidWindow,
 *   familyImpact, reasoning, opportunities, cautions,
 *   expiresAt, feedbackStatus, analytics, metadata
 * }
 */

import { nanoid } from '../utils/nanoid.js'  // lib/utils — no src dependency

const CAT_META = {
  career:        { icon:'💼', title:'Career' },
  finance:       { icon:'💰', title:'Finance' },
  relationships: { icon:'❤️',  title:'Relationships' },
  health:        { icon:'🌿', title:'Health' },
  education:     { icon:'📚', title:'Education' },
  learning:      { icon:'🧠', title:'Learning' },
  travel:        { icon:'✈️',  title:'Travel' },
  business:      { icon:'🏢', title:'Business' },
  property:      { icon:'🏠', title:'Property' },
  legal:         { icon:'⚖️',  title:'Legal' },
  communication: { icon:'💬', title:'Communication' },
  family:        { icon:'👨‍👩‍👧', title:'Family' },
  spiritual:     { icon:'🛕', title:'Spiritual' },
  shopping:      { icon:'🛍️', title:'Shopping' },
  medical:       { icon:'🏥', title:'Medical' }
}

function confidenceReason(rec, reasoningResult) {
  const top = reasoningResult?.topEvidence?.[0]
  if (!top) return null
  return `Based on ${top.subject} (${top.quality}) — ${top.influence}`
}

/**
 * buildRecommendationPackage(rawRec, reasoningResult, goldenWindow, avoidWindow, familyAlignment)
 *
 * Converts a raw recommendation from the decision engine into a full RecommendationPackage.
 */
export function buildRecommendationPackage(rawRec, reasoningResult, goldenWindow, avoidWindow, familyAlignment) {
  const meta = CAT_META[rawRec.category] || { icon:'✦', title: rawRec.category }
  const now  = new Date()
  const expiresAt = new Date(now)
  expiresAt.setHours(23, 59, 59, 0)

  return {
    id:               `rec_${rawRec.category}_${now.toISOString().slice(0,10)}`,
    category:         rawRec.category,
    priority:         rawRec._score || rawRec.stars || 3,
    icon:             rawRec.icon || meta.icon,
    title:            rawRec.label || meta.title,
    summary:          rawRec.action,
    recommendation:   rawRec.action,
    confidence:       rawRec.confidence,
    confidenceReason: confidenceReason(rawRec, reasoningResult),
    evidence:         rawRec.keyEvidence || [],
    bestWindow:       rawRec.bestTime || rawRec.best_time || goldenWindow,
    avoidWindow:      avoidWindow,
    quality:          rawRec.quality || 'neutral',
    stars:            rawRec.stars || 3,
    familyImpact:     familyAlignment ? {
      harmony:   familyAlignment.confidence,
      bestShared: familyAlignment.best_shared_window || familyAlignment.bestSharedWindow
    } : null,
    reasoning:        rawRec.reason,
    expiresAt:        expiresAt.toISOString(),
    feedbackStatus:   'pending',   // 'helpful'|'not_helpful'|'skipped'|'pending'
    analytics:        { views:0, expansions:0, feedbackAt:null },
    metadata:         {
      nakshatra:  null,   // filled by caller
      dasha:      null,
      date:       now.toISOString().slice(0,10)
    }
  }
}

/**
 * buildDailyPackages(memberDecision, reasoningResult, familyAlignment)
 *
 * Converts the per-member decision output into a full set of RecommendationPackages.
 */
export function buildDailyPackages(memberDecision, reasoningResult, familyAlignment) {
  const top  = memberDecision?.recommendations?.top  || []
  const rest = memberDecision?.recommendations?.rest || []
  const all  = [...top, ...rest]

  return all.map(r => buildRecommendationPackage(
    r, reasoningResult,
    memberDecision.golden_window, memberDecision.avoid_window,
    familyAlignment
  ))
}
