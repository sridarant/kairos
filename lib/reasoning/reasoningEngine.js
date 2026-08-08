/**
 * /lib/reasoning/reasoningEngine.js
 *
 * Synthesises weighted evidence into structured reasoning.
 * This is the core analytical layer — it does not produce natural language,
 * but it does produce the logical chain that the language layer converts to prose.
 *
 * Reasoning process:
 *   1. Take top-priority evidence
 *   2. Apply conflict resolution
 *   3. For each decision category, determine: supportive / neutral / caution
 *   4. Synthesise a timing recommendation
 *   5. Return a ReasoningResult (input to DecisionEngine and Language Layer)
 */

import { resolveConflicts } from './conflictResolver.js'
import { topEvidence } from './priorityEngine.js'

/**
 * deriveDecision(conflictSummary, topNodes, goldenSlotScore)
 *
 * Derives DO / WAIT / AVOID from reasoning context.
 * The slot score from the existing engine is still used for timing —
 * reasoning supplements it with qualitative intelligence.
 */
function deriveDecision(conflictSummary, topNodes, goldenSlotScore) {
  const { dominantQuality } = conflictSummary
  const hasStrongChallenges = conflictSummary.conflicts?.some(c =>
    c.resolution === 'challenging_dominates' || c.resolution === 'balanced'
  )

  if (dominantQuality === 'challenging') return 'AVOID'
  if (dominantQuality === 'supportive' && !hasStrongChallenges && goldenSlotScore > 1.5) return 'DO'
  if (dominantQuality === 'supportive' && goldenSlotScore > 0.5) return 'DO'
  if (dominantQuality === 'mixed' && goldenSlotScore > 0.5) return 'WAIT'
  if (goldenSlotScore < -0.5) return 'AVOID'
  return 'WAIT'
}

/**
 * reasonForCategory(category, evidenceNodes)
 *
 * For a specific life area, gather relevant evidence and determine:
 * - overall quality (supportive / neutral / caution)
 * - key factors (top 2 evidence nodes affecting this area)
 * - a brief reasoning trace (for language layer)
 */
function reasonForCategory(category, evidenceNodes) {
  const relevant = evidenceNodes.filter(e => e.areas.includes(category))
    .sort((a, b) => b.weight - a.weight)

  if (!relevant.length) return { quality: 'neutral', keyFactors: [], trace: null, stars: 3 }

  const supportive  = relevant.filter(e => e.quality === 'supportive')
  const challenging = relevant.filter(e => e.quality === 'challenging')
  const sSupport    = supportive.reduce((s, e) => s + e.weight, 0)
  const sChallenge  = challenging.reduce((s, e) => s + e.weight, 0)
  const ratio       = sSupport / (sChallenge || 0.01)

  const quality = ratio >= 1.8 ? 'supportive' : ratio <= 0.6 ? 'caution' : 'mixed'
  // Stars reflect actual strength within the quality tier, not just tier membership
  // supportive range: ratio 1.8..∞ → stars 3..5 with fine gradation
  // mixed range: ratio 0.6..1.8 → stars 2..3
  // caution range: ratio 0..0.6 → stars 1..2
  const stars = quality === 'supportive'
    ? Math.min(5, Math.round(2 + ratio * 0.8))    // 1.8→3.4, 2.5→4, 3.5→4.8
    : quality === 'caution'
    ? Math.max(1, Math.round(3 - (1/Math.max(ratio,0.1)) * 0.8))
    : Math.round(2 + (ratio - 0.6) * 0.8)         // mixed: 0.6→2, 1.8→3

  const keyFactors = relevant.slice(0, 2).map(e => ({
    id: e.id, subject: e.subject, quality: e.quality, weight: e.weight,
    influence: e.influence
  }))

  // Reasoning trace: primary driver + any conflict
  const primary    = relevant[0]
  const opposition = challenging[0]
  let trace = primary ? `${primary.subject} (${primary.quality}, weight ${primary.weight.toFixed(2)})` : null
  if (opposition && quality === 'mixed') {
    trace += ` but ${opposition.subject} (${opposition.quality}, weight ${opposition.weight.toFixed(2)}) creates tension`
  }

  return { quality, keyFactors, trace, stars }
}

/**
 * buildCategoryReasons(evidenceNodes)
 * Returns per-category reasoning for all 15 life areas.
 */
const CATEGORIES = [
  'career','finance','relationships','health','education',
  'travel','business','property','legal','communication',
  'learning','family','spiritual','shopping','medical'
]

function buildCategoryReasons(evidenceNodes) {
  const result = {}
  for (const cat of CATEGORIES) {
    result[cat] = reasonForCategory(cat, evidenceNodes)
  }
  return result
}

/**
 * synthesiseSummary(conflictSummary, topNodes, dashaNode)
 * Produces the overall day reasoning as a structured object.
 */
function synthesiseSummary(conflictSummary, topNodes, dashaNode) {
  const { dominantQuality, balancingNote, amplifiedAreas, suppressedAreas } = conflictSummary

  const primaryDriver = topNodes[0]
  const secondDriver  = topNodes[1]

  // The "why" chain: most important factors in order
  const reasonChain = topNodes.slice(0, 3).map(n => ({
    subject:   n.subject,
    influence: n.influence,
    quality:   n.quality,
    strength:  n.strength,
    source:    n.source
  }))

  return {
    dominantQuality,
    primaryDriver: primaryDriver ? { subject: primaryDriver.subject, influence: primaryDriver.influence, quality: primaryDriver.quality } : null,
    dashaContext:  dashaNode ? { subject: dashaNode.subject, influence: dashaNode.influence } : null,
    reasonChain,
    balancingNote,
    amplifiedAreas: amplifiedAreas.slice(0, 3),
    suppressedAreas: suppressedAreas.slice(0, 2)
  }
}

/**
 * runReasoningEngine(evidenceNodes, goldenSlotScore, astroCtx)
 *
 * Master reasoning function.
 * @param {EvidenceNode[]} evidenceNodes  — weighted evidence graph
 * @param {number} goldenSlotScore        — best time slot score from base engine
 * @param {object} astroCtx               — for supplemental context
 * @returns ReasoningResult
 */
export function runReasoningEngine(evidenceNodes, goldenSlotScore, astroCtx) {
  // Priority evidence (already weighted and sorted)
  const topNodes   = topEvidence(evidenceNodes, 6)
  const conflictSummary = resolveConflicts(evidenceNodes)
  const dashaNode  = evidenceNodes.find(e => e.source === 'dasha')

  const decision   = deriveDecision(conflictSummary, topNodes, goldenSlotScore)
  const categories = buildCategoryReasons(evidenceNodes)
  const summary    = synthesiseSummary(conflictSummary, topNodes, dashaNode)

  // Confidence from evidence alignment
  const supportCount   = evidenceNodes.filter(e => e.quality === 'supportive').length
  const challengeCount = evidenceNodes.filter(e => e.quality === 'challenging').length
  const total          = evidenceNodes.length || 1
  const alignmentScore = (supportCount - challengeCount * 1.2) / total

  // Apply certainty factor for future dates
  const certFactor    = astroCtx.certaintyFactor || 1.0
  const baseConfScore = 50 + Math.round(alignmentScore * 40)
  const adjConfScore  = Math.max(10, Math.min(92, Math.round(baseConfScore * certFactor)))
  const confidence    = adjConfScore >= 70 ? 'High' : adjConfScore >= 45 ? 'Medium' : 'Low'

  return {
    decision,
    confidence,
    confidenceScore: adjConfScore,
    summary,
    conflictSummary,
    categories,
    topEvidence: topNodes.map(n => ({
      id: n.id, subject: n.subject, quality: n.quality,
      strength: n.strength, influence: n.influence, weight: n.weight
    })),
    evidenceCount: { total, supportive: supportCount, challenging: challengeCount }
  }
}
