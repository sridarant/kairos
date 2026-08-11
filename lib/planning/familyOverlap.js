/**
 * /lib/planning/familyOverlap.js
 *
 * Canonical family timing analysis.
 * Computes actual slot-level overlap — not majority vote.
 * Constitution §4, §5.
 */

/**
 * computeFamilyOverlap(members)
 *
 * Given an array of member objects (each with scoredSlots),
 * returns:
 *   allMembersOverlap   — slots where every member is positive
 *   pairwiseOverlap     — for each pair, their shared positive slots
 *   partialOverlap      — slots where ≥2 (but not all) members are positive
 *   overlapType         — 'all-members' | 'partial' | 'none'
 *   bestSharedWindow    — the best all-member or partial window
 *   explanation         — structured text grounded in the calculation
 */
export function computeFamilyOverlap(members) {
  const withSlots = members.filter(m => m.scoredSlots?.length)

  if (!withSlots.length) {
    return {
      allMembersOverlap:  [],
      pairwiseOverlap:    [],
      partialOverlap:     [],
      overlapType:        'none',
      bestSharedWindow:   null,
      explanation:        'Insufficient data for overlap calculation.'
    }
  }

  if (withSlots.length === 1) {
    const solo = withSlots[0]
    const best = [...solo.scoredSlots].sort((a,b)=>b.score-a.score)[0]
    return {
      allMembersOverlap:  [best?.time].filter(Boolean),
      pairwiseOverlap:    [],
      partialOverlap:     [],
      overlapType:        'all-members',
      bestSharedWindow:   best?.time || null,
      explanation:        'Only one member has a full profile. Showing their personal window.'
    }
  }

  const slotTimes = withSlots[0].scoredSlots.map(s => s.time)

  // All-member intersection: slots where every member scores > 0
  const allMembersOverlap = slotTimes.filter(time =>
    withSlots.every(m => {
      const slot = m.scoredSlots.find(s => s.time === time)
      return slot && slot.score > 0
    })
  )

  // Best all-member slot: highest average score across all members
  const rankByAvg = (times) => times
    .map(time => {
      const avg = withSlots.reduce((sum, m) => {
        const slot = m.scoredSlots.find(s => s.time === time)
        return sum + (slot?.score || 0)
      }, 0) / withSlots.length
      return { time, avg }
    })
    .sort((a, b) => b.avg - a.avg)

  // Partial overlap: slots where ≥2 members are positive
  const partialOverlap = slotTimes.filter(time =>
    withSlots.filter(m => {
      const slot = m.scoredSlots.find(s => s.time === time)
      return slot && slot.score > 0
    }).length >= 2 && !allMembersOverlap.includes(time)
  )

  // Pairwise: for each pair, find their shared slots
  const pairwiseOverlap = []
  for (let i = 0; i < withSlots.length - 1; i++) {
    for (let j = i + 1; j < withSlots.length; j++) {
      const a = withSlots[i], b = withSlots[j]
      const shared = slotTimes.filter(time => {
        const sa = a.scoredSlots.find(s => s.time === time)
        const sb = b.scoredSlots.find(s => s.time === time)
        return sa && sb && sa.score > 0 && sb.score > 0
      })
      if (shared.length) {
        pairwiseOverlap.push({
          members: [a.name, b.name].filter(Boolean),
          windows: shared
        })
      }
    }
  }

  // Determine overlap type and best window
  let overlapType = 'none', bestSharedWindow = null
  const rankedAll     = rankByAvg(allMembersOverlap)
  const rankedPartial = rankByAvg(partialOverlap)

  if (allMembersOverlap.length) {
    overlapType      = 'all-members'
    bestSharedWindow = rankedAll[0]?.time || null
  } else if (partialOverlap.length) {
    overlapType      = 'partial'
    bestSharedWindow = rankedPartial[0]?.time || null
  }

  // Explanation — grounded in the actual calculation
  let explanation = null
  if (overlapType === 'all-members') {
    const count = withSlots.length
    explanation = `All ${count} members have positive indicators during ${bestSharedWindow}. Average suitability score: ${rankedAll[0] ? (rankedAll[0].avg*10).toFixed(0) : 'n/a'}/10.`
  } else if (overlapType === 'partial') {
    const partMembers = withSlots
      .filter(m => {
        const slot = m.scoredSlots.find(s => s.time === bestSharedWindow)
        return slot && slot.score > 0
      })
      .map(m => m.name).filter(Boolean)
    explanation = `${partMembers.join(' and ')} share a positive window at ${bestSharedWindow}. No single window is positive for everyone today.`
  } else {
    explanation = 'No shared positive window found across all members today. Individual windows are listed below.'
  }

  return {
    allMembersOverlap,
    pairwiseOverlap,
    partialOverlap,
    overlapType,
    bestSharedWindow,
    explanation
  }
}
