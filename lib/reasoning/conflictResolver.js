/**
 * /lib/reasoning/conflictResolver.js
 *
 * Identifies and resolves conflicts between evidence nodes.
 * The goal is NOT to pick a winner — it is to produce balanced guidance.
 *
 * Conflict types:
 *   - DIRECT:     one supportive, one challenging, same life areas
 *   - WEIGHT:     conflict exists but one side has much higher weight
 *   - CANCELLED:  yoga or strength effect is cancelled by opposing factor
 *
 * Resolution produces a ConflictSummary that the reasoning engine uses
 * to temper its recommendations.
 */

/**
 * findConflicts(evidenceNodes)
 *
 * Identifies pairs of conflicting evidence.
 * Returns ConflictPair[]
 */
export function findConflicts(evidenceNodes) {
  const conflicts = []
  const supportive  = evidenceNodes.filter(e => e.quality === 'supportive')
  const challenging = evidenceNodes.filter(e => e.quality === 'challenging')

  for (const s of supportive) {
    for (const c of challenging) {
      const sharedAreas = s.areas.filter(a => c.areas.includes(a))
      if (sharedAreas.length === 0) continue

      const weightRatio = s.weight / (c.weight || 0.01)
      conflicts.push({
        supportiveId:    s.id,
        challengingId:   c.id,
        supportiveSubj:  s.subject,
        challengingSubj: c.subject,
        sharedAreas,
        supportiveWeight: s.weight,
        challengingWeight: c.weight,
        weightRatio,       // > 1 = supportive dominates, < 1 = challenging dominates
        resolution: weightRatio >= 2.0 ? 'supportive_dominates'
                  : weightRatio <= 0.5 ? 'challenging_dominates'
                  : 'balanced'
      })
    }
  }
  return conflicts
}

/**
 * resolveConflicts(evidenceNodes)
 *
 * Produces a ConflictSummary used by the reasoning engine.
 * {
 *   hasConflict: boolean
 *   dominantQuality: 'supportive'|'challenging'|'mixed'
 *   balancingNote: string  — used by language layer
 *   suppressedAreas: string[]  — areas where caution is warranted despite overall positivity
 *   amplifiedAreas: string[]   — areas clearly uncontested
 * }
 */
export function resolveConflicts(evidenceNodes) {
  const conflicts = findConflicts(evidenceNodes)

  if (!conflicts.length) {
    const allSupportive  = evidenceNodes.every(e => e.quality !== 'challenging')
    const allChallenging = evidenceNodes.every(e => e.quality !== 'supportive')
    return {
      hasConflict: false,
      dominantQuality: allChallenging ? 'challenging' : 'supportive',
      balancingNote: null,
      suppressedAreas: [],
      amplifiedAreas: evidenceNodes.flatMap(e => e.quality === 'supportive' ? e.areas : []).slice(0, 3)
    }
  }

  // Classify overall conflict dominance
  const avgSupportWeight  = evidenceNodes.filter(e => e.quality === 'supportive').reduce((s,e)=>s+e.weight,0)
  const avgChallengeWeight = evidenceNodes.filter(e => e.quality === 'challenging').reduce((s,e)=>s+e.weight,0)
  const ratio = avgSupportWeight / (avgChallengeWeight || 0.01)

  let dominantQuality
  if (ratio >= 1.8)      dominantQuality = 'supportive'
  else if (ratio <= 0.6) dominantQuality = 'challenging'
  else                   dominantQuality = 'mixed'

  // Suppressed areas: contested by weight-equal opposing forces
  const suppressedAreas = [...new Set(
    conflicts
      .filter(c => c.resolution === 'balanced' || c.resolution === 'challenging_dominates')
      .flatMap(c => c.sharedAreas)
  )]

  // Amplified areas: supportive with no significant opposition
  const contested = new Set(conflicts.flatMap(c => c.sharedAreas))
  const amplifiedAreas = [...new Set(
    evidenceNodes
      .filter(e => e.quality === 'supportive' && e.weight >= 0.6)
      .flatMap(e => e.areas)
      .filter(a => !contested.has(a))
  )]

  // Build balancing note
  const challengerNames = [...new Set(
    conflicts
      .filter(c => c.resolution !== 'supportive_dominates')
      .map(c => c.challengingSubj)
  )].slice(0, 2)
  const supporterNames = [...new Set(
    conflicts
      .filter(c => c.resolution !== 'challenging_dominates')
      .map(c => c.supportiveSubj)
  )].slice(0, 2)

  let balancingNote = null
  if (dominantQuality === 'mixed') {
    balancingNote = `${supporterNames.join(' and ')} support progress, while ${challengerNames.join(' and ')} call for caution — proceed selectively.`
  } else if (dominantQuality === 'supportive' && challengerNames.length) {
    balancingNote = `Overall conditions are favourable, but ${challengerNames.join(' and ')} warrants attention — avoid irreversible commitments.`
  } else if (dominantQuality === 'challenging') {
    balancingNote = `Challenging influences dominate — patient, conservative action serves better than bold moves.`
  }

  return {
    hasConflict: true,
    dominantQuality,
    balancingNote,
    suppressedAreas,
    amplifiedAreas,
    conflicts,
    ratio: +ratio.toFixed(2)
  }
}
