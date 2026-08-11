/**
 * /lib/planning/activityPlanner.js
 *
 * Canonical activity-based planning engine.
 *
 * Constitution §4, §5, §11, §14, §15.
 *
 * React must never perform date ranking or explanation generation.
 * This is the single source of truth for activity-based planning.
 */

// ─── Activity definitions ────────────────────────────────────────────────────

export const ACTIVITY_TYPES = Object.freeze({
  conversation: {
    id:'conversation', label:'Important conversation',
    dim:'c', invert:false, weight:1,
    category:'communication', whyLabel:'Communication indicators'
  },
  meeting: {
    id:'meeting', label:'Important meeting',
    dim:'c', invert:false, weight:1,
    category:'communication', whyLabel:'Communication and clarity indicators'
  },
  career: {
    id:'career', label:'Career / work decision',
    dim:'d', invert:false, weight:1,
    category:'career', whyLabel:'Decision-making indicators'
  },
  finance: {
    id:'finance', label:'Financial decision',
    dim:'r', invert:true, weight:1,
    category:'finance', whyLabel:'Financial risk indicators',
    safetyNote:'Kairos provides reflective timing guidance only. Consult a qualified financial adviser for investment decisions.'
  },
  purchase: {
    id:'purchase', label:'Major purchase',
    dim:'r', invert:true, weight:1,
    category:'finance', whyLabel:'Risk indicators'
  },
  property: {
    id:'property', label:'Property decision',
    dim:'r', invert:true, weight:1,
    category:'property', whyLabel:'Risk and stability indicators',
    safetyNote:'Kairos provides timing guidance only. Property decisions involve many factors beyond astrological indicators.'
  },
  travel: {
    id:'travel', label:'Travel',
    dim:'d', invert:false, weight:1,
    category:'travel', whyLabel:'Movement and decision indicators'
  },
  study: {
    id:'study', label:'Study / learning',
    dim:'f', invert:false, weight:1,
    category:'education', whyLabel:'Focus and mental clarity indicators'
  },
  family: {
    id:'family', label:'Family activity',
    dim:'c', invert:false, weight:0.7,
    secondaryDim:'f', secondaryWeight:0.3,
    category:'family', whyLabel:'Communication and harmony indicators'
  },
  wellness: {
    id:'wellness', label:'Wellness / self-care',
    dim:'f', invert:false, weight:1,
    category:'health', whyLabel:'Focus and vitality indicators'
  },
  medical_routine: {
    id:'medical_routine', label:'Routine health check',
    dim:'f', invert:false, weight:1,
    category:'health', whyLabel:'Clarity and focus indicators',
    medicalCategory:'routine',
    safetyNote:'Timing guidance is supplementary. Never delay necessary medical care for astrological reasons.'
  },
  medical_decision: {
    id:'medical_decision', label:'Medical consultation or decision',
    dim:'f', invert:false, weight:1,
    category:'health', whyLabel:'Clarity indicators',
    medicalCategory:'decision',
    safetyNote:'Always follow professional medical advice. Kairos timing guidance must never be used to delay necessary treatment.'
  },
  other: {
    id:'other', label:'Other',
    dim:'d', invert:false, weight:0.5,
    secondaryDim:'c', secondaryWeight:0.3,
    category:null, whyLabel:'General indicators'
  }
})

// ─── Slot scoring ─────────────────────────────────────────────────────────────

export function activitySlotScore(slot, actDef) {
  if (!actDef || !slot?.dims) return 0
  const primary = slot.dims[actDef.dim] ?? 0
  const pScore  = actDef.invert ? -primary : primary
  if (actDef.secondaryDim) {
    const sec = (slot.dims[actDef.secondaryDim] ?? 0) * (actDef.secondaryWeight || 0.3)
    return pScore * (actDef.weight || 1) + sec
  }
  return pScore * (actDef.weight || 1)
}

export function activityBestWindow(scoredSlots, actDef) {
  if (!scoredSlots?.length) return null
  const best = [...scoredSlots].sort((a, b) => activitySlotScore(b, actDef) - activitySlotScore(a, actDef))[0]
  return best?.time || null
}

// ─── Day scoring ──────────────────────────────────────────────────────────────

export function activityDayScore(dayData, actDef) {
  const prim  = dayData.members?.[0] || dayData
  const slots = prim.scoredSlots || dayData.scoredSlots || []

  if (slots.length) {
    const slotScores = slots.map(s => activitySlotScore(s, actDef))
    const maxScore   = Math.max(...slotScores)
    const bestSlot   = slots[slotScores.indexOf(maxScore)]
    // Normalise slot dim score [-3,3] → [0,100]
    const norm = Math.max(0, Math.min(100, Math.round((maxScore + 3) / 6 * 100)))
    return { score:norm, bestWindow:bestSlot.time, bestDimScore:maxScore, isApproximate:false }
  }

  // Fallback without slots (labelled as approximate)
  const suit = prim.suitabilityScore ?? (prim.stars || 3) * 20
  return { score:Math.round(suit * 0.6), bestWindow:prim.golden_window||null, bestDimScore:null, isApproximate:true }
}

// ─── Explanation builder ──────────────────────────────────────────────────────

export function buildActivityExplanation(dayData, actDef) {
  const prim    = dayData.members?.[0] || dayData
  const rr      = prim._reasoningResult || prim.reasoningResult || null
  const catKey  = actDef.category
  const catData = catKey ? rr?.categories?.[catKey] || null : null
  const topEv   = rr?.topEvidence?.[0] || null
  const conflict = rr?.conflictSummary || null

  // Why — grounded in evidence
  let why = null, primaryDriver = null
  if (catData?.keyFactors?.length) {
    const kf = catData.keyFactors[0]
    why = `${actDef.whyLabel} are ${catData.quality === 'supportive' ? 'favourable' : catData.quality === 'caution' ? 'constrained' : 'mixed'} — ${kf.influence}.`
    primaryDriver = kf.subject
  } else if (topEv) {
    why = `${actDef.whyLabel} are influenced by ${topEv.subject} (${topEv.influence}).`
    primaryDriver = topEv.subject
  } else if (prim.suitabilityTier) {
    why = `${actDef.whyLabel} are ${prim.suitabilityTier.toLowerCase()} today.`
  }

  // Caution — only from engine data
  let caution = null
  if (conflict?.suppressedAreas?.includes(catKey)) {
    caution = `${catKey.charAt(0).toUpperCase() + catKey.slice(1)} is one of the more constrained areas today.`
  } else if (conflict?.balancingNote) {
    caution = conflict.balancingNote
  }

  // Confidence — from category stars if available
  const confidence = catData?.stars
    ? catData.stars >= 4 ? 'High' : catData.stars >= 3 ? 'Medium' : 'Low'
    : prim.confidence || 'Medium'

  return { why, primaryDriver, caution, confidence,
    safetyNote:def?.safetyNote||null, medicalCategory:actDef.medicalCategory||null }

  function def() { return actDef }
}

// ─── Main planActivity function ───────────────────────────────────────────────

export function planActivity(horizonDays, activityTypeId, opts = {}) {
  const actDef = ACTIVITY_TYPES[activityTypeId]
  if (!actDef) return { error:`Unknown activity: ${activityTypeId}` }

  const { maxResults = 5 } = opts
  const future = horizonDays.filter(d => d.daysAhead > 0)

  const scored = future.map(d => {
    const { score, bestWindow, bestDimScore, isApproximate } = activityDayScore(d, actDef)
    const explanation = buildActivityExplanation(d, actDef)
    const prim = d.members?.[0] || d
    return {
      daysAhead:       d.daysAhead,
      date:            d.date,
      score,
      bestWindow,
      bestDimScore,
      isApproximate,
      explanation,
      suitabilityScore:prim.suitabilityScore ?? null,
      suitabilityTier: prim.suitabilityTier  ?? null,
      stars:           prim.stars            ?? null
    }
  }).sort((a, b) => b.score - a.score)

  const cautionDay = scored.find(d => d.explanation?.caution && d !== scored[0]) || null

  return {
    activityType:  actDef.id,
    activityLabel: actDef.label,
    ranked:        scored.slice(0, maxResults),
    best:          scored[0]  || null,
    alternative:   scored[1]  || null,
    cautionDay,
    safetyNote:    actDef.safetyNote    || null,
    medicalCategory: actDef.medicalCategory || null
  }
}
