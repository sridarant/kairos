/**
 * /lib/reasoning/index.js — Reasoning Engine Public API
 *
 * The Reasoning Engine sits between lib/astrology (evidence sources)
 * and lib/decision (final output contract).
 *
 * Data flow:
 *   AstroContext
 *     → buildEvidenceGraph()     [evidenceBuilder]
 *     → assignWeights()          [priorityEngine]
 *     → runReasoningEngine()     [reasoningEngine — conflict, synthesis, categories]
 *     → buildRecommendations()   [recommendationBuilder]
 *     → buildExplanationMetadata()[explanationBuilder]
 *     → ReasoningResult (consumed by decision/engine.js and api/explain.js)
 */

import { buildEvidenceGraph }         from './evidenceBuilder.js'
import { assignWeights, topEvidence } from './priorityEngine.js'
import { runReasoningEngine }          from './reasoningEngine.js'
import { buildRecommendations }        from './recommendationBuilder.js'
import { buildExplanationMetadata }    from './explanationBuilder.js'

export { buildEvidenceGraph }
export { assignWeights, topEvidence }
export { runReasoningEngine }
export { buildRecommendations }
export { buildExplanationMetadata }

/**
 * runFullReasoning(astroCtx, goldenSlotScore, goldenWindow, avoidWindow)
 *
 * One-call entry point for the decision engine.
 * Returns a complete ReasoningOutput.
 */
export function runFullReasoning(astroCtx, goldenSlotScore, goldenWindow, avoidWindow) {
  // Step 1: Build evidence graph from all astro sources
  const evidenceNodes = buildEvidenceGraph(astroCtx)

  // Step 2: Assign priority weights
  assignWeights(evidenceNodes, astroCtx)

  // Step 3: Reason — synthesis, conflicts, category analysis
  const reasoningResult = runReasoningEngine(evidenceNodes, goldenSlotScore, astroCtx)

  // Step 4: Build ranked recommendations from reasoning
  const recommendations = buildRecommendations(reasoningResult, goldenWindow, evidenceNodes)

  // Step 5: Build explanation metadata for language layer
  const explanationMeta = buildExplanationMetadata(reasoningResult, astroCtx, goldenWindow, avoidWindow)

  return {
    decision:          reasoningResult.decision,
    confidence:        reasoningResult.confidence,
    confidenceScore:   reasoningResult.confidenceScore,
    summary:           reasoningResult.summary,
    recommendations,
    explanationMeta,
    evidenceNodes,
    reasoningResult,
    // Structured signals for signal cards
    signals: {
      positive: evidenceNodes.filter(e => e.quality === 'supportive' && e.weight >= 0.6)
                             .slice(0,3).map(e => `${e.source.toUpperCase()}:${e.subject}:${e.influence}`),
      caution:  evidenceNodes.filter(e => e.quality === 'challenging' && e.weight >= 0.5)
                             .slice(0,2).map(e => `${e.source.toUpperCase()}:${e.subject}:${e.influence}`),
      neutral:  evidenceNodes.filter(e => e.quality === 'neutral' && e.weight >= 0.5)
                             .slice(0,2).map(e => `${e.source.toUpperCase()}:${e.subject}:${e.influence}`)
    }
  }
}
