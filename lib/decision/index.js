/**
 * DEPRECATED (Sprint 3) — Part of legacy lib/decision alternative stack.
 * Not imported by any production path (api/daily.js uses lib/decision/engine.js).
 * DO NOT add new imports from this file.
 */
// /lib/decision/index.js — Decision Intelligence Engine entry point

import { computeConfidence, scoreToStars, scoreToTier } from './confidence.js'
import { buildWhyExplanation, resolveConflict }          from './explanation.js'
import { buildTimeline, bestWindow, avoidWindow }        from './timing.js'
import { buildAllRecommendations, categoryBestWindow }    from './recommendations.js'

export { computeConfidence, scoreToStars, scoreToTier }
export { buildWhyExplanation, resolveConflict }
export { buildTimeline, bestWindow, avoidWindow }
export { buildAllRecommendations }

/**
 * runDecisionEngine: main entry point called by /api/daily.js
 *
 * @param {object} scored     — output of scoreForUser() from api/astro.js
 * @param {object} astroCtx   — full astro context
 * @param {object} user       — user profile
 * @param {number} daysAhead
 * @returns full decision intelligence output for one user
 */
export function runDecisionEngine(scored, astroCtx, user, daysAhead = 0) {
  const { agg, reasoning, lagna } = scored
  const { panchang } = astroCtx

  // v22: use aggregated dimension deltas from classical Parashari engine
  const goldenDims = { d: agg?.d||0, c: agg?.c||0, f: agg?.f||0, r: agg?.r||0 }
  const worstDims  = { d:-(agg?.d||0), c:0, f:0, r: Math.max(0, agg?.r||0) }
  const varaPlanet = { name: panchang?.vara || 'Mercury' }

  // ── Conflict detection ────────────────────────────────────────────────────
  const strongDims = Object.entries(goldenDims).filter(([k,v]) => k !== 'r' && v > 0.8).map(([k]) => k)
  const weakDims   = Object.entries(goldenDims).filter(([k,v]) => k === 'r' && v > 0.5).map(([k]) => k)
  const conflictNote = resolveConflict(strongDims, weakDims)

  // ── Why explanation ───────────────────────────────────────────────────────
  const why = buildWhyExplanation({
    planetName:   varaPlanet?.name,
    nakshatraName: panchang?.nakshatra?.name,
    tithiPhase:   panchang?.tithi?.phase,
    dominantDim:  reasoning?.dominant || 'd',
    chartNote:    reasoning?.chartSummary
  })

  // ── Confidence ────────────────────────────────────────────────────────────
  const spreadScore      = Math.max(0, (agg?.d||0) + (agg?.c||0) + (agg?.f||0) - (agg?.r||0)) * 1.5
  const transitAgreement = (agg?.d || 0) > 0.1 || (agg?.c || 0) > 0.1
  const nakshatraDelta   = Math.abs(agg?.d||0) + Math.abs(agg?.c||0)
  const lagnaAligned     = !!lagna
  const conf = computeConfidence({
    spreadScore,
    transitAgreement,
    nakshatraDelta,
    tithiPhase:   panchang?.tithi?.phase,
    lagnaAligned,
    familyHarmony: null,
    daysAhead
  })

  // ── Timeline ──────────────────────────────────────────────────────────────
  const seed     = new Date().getDate() + (user?.dob ? parseInt((user.dob.split('-')[0]||'0'),10) : 0)
  // Build a synthetic timeline from agg dims (v22: slot-level calculations deferred to v23)
  const synthSlots = [
    { time:'07:00–09:00', score: (agg?.d||0)*0.5 + (agg?.f||0)*0.3 - (agg?.r||0)*0.2, dims: goldenDims },
    { time:'09:00–11:00', score: (agg?.d||0)     + (agg?.c||0)*0.5 - (agg?.r||0)*0.2, dims: goldenDims },
    { time:'11:00–13:00', score: (agg?.c||0)     + (agg?.f||0)*0.3 - (agg?.r||0)*0.2, dims: goldenDims },
    { time:'13:00–15:00', score: -(agg?.r||0)*0.3, dims: goldenDims },
    { time:'15:00–17:00', score: -(agg?.r||0)*0.5 + (agg?.c||0)*0.2, dims: goldenDims },
    { time:'17:00–19:00', score: -(agg?.r||0)*0.8 - (agg?.d||0)*0.2, dims: goldenDims }
  ]
  const timeline = buildTimeline(synthSlots, seed)

  // ── Recommendations ───────────────────────────────────────────────────────
  // Derive golden/avoid from synthSlots (authentic calculation)
  const sortedSlots = [...synthSlots].sort((a,b) => b.score - a.score)
  const derivedGoldenTime = sortedSlots[0]?.time || '09:00–11:00'
  const derivedAvoidTime  = sortedSlots[sortedSlots.length-1]?.time || '17:00–19:00'

  const { top: topRecs, rest: restRecs } = buildAllRecommendations({
    goldenDims,
    worstDims,
    planetName:    varaPlanet?.name,
    nakshatraName: panchang?.nakshatra?.name || reasoning?.nakshatra,
    goldenTime:    derivedGoldenTime,   // authentic from synthSlots, not hardcoded
    scoredSlots:   synthSlots           // enables per-category best windows (WS1 fix)
  })

  // ── Day focus from top recommendation ─────────────────────────────────────
  const focus = topRecs[0]?.label || 'Decision Making'

  // ── Signal cards ──────────────────────────────────────────────────────────
  const signalText = conflictNote || why
  const signal = {
    icon:  conf.tier === 'High' ? '🟢' : conf.tier === 'Medium' ? '🟡' : '🔴',
    label: `${conf.tier} Signal`,
    text:  signalText
  }

  return {
    golden_window:  derivedGoldenTime,   // authentic: best-scoring synthSlot
    avoid_window:   derivedAvoidTime,
    stars:          conf.stars,
    confidence:     conf.tier,
    confidence_score: conf.score,
    focus,
    why,
    conflict_note:  conflictNote,
    signal,
    do_advice:      `Use 09:00–11:00 for your most important work.`,
    avoid_advice:   `Avoid new commitments after 17:00.`,
    watch_advice:   `Energy shifts around 13:00 — pace accordingly.`,
    timeline,
    recommendations: { top: topRecs, rest: restRecs },
    lagna:          lagna?.name || null,
    moon_sign:      moonSign?.name || null
  }
}

/**
 * runFamilyDecisionEngine: evaluate combined family signal.
 * Replaces simple average with genuine multi-member analysis.
 */
export function runFamilyDecisionEngine(memberResults) {
  if (!memberResults || memberResults.length < 2) return null

  const scores = memberResults.map(m => m.confidence_score || 50)
  const avg    = scores.reduce((s, v) => s + v, 0) / scores.length

  // Find common golden windows (windows appearing in majority)
  const windowCounts = {}
  memberResults.forEach(m => {
    if (m.golden_window) windowCounts[m.golden_window] = (windowCounts[m.golden_window] || 0) + 1
  })
  const sharedWindow = Object.entries(windowCounts).sort((a,b) => b[1]-a[1])[0]?.[0]

  // Conflicting schedules: members with different avoid windows
  const avoidWindows = [...new Set(memberResults.map(m => m.avoid_window).filter(Boolean))]

  // Combined confidence: penalise variance
  const variance = scores.reduce((s, v) => s + Math.abs(v - avg), 0) / scores.length
  const familyScore = Math.max(10, Math.min(92, Math.round(avg - variance * 0.3)))
  const familyConf  = computeConfidence({ spreadScore: 2, transitAgreement: true,
    nakshatraDelta: 1, tithiPhase: 'Panchami', lagnaAligned: false,
    familyHarmony: familyScore, daysAhead: 0 })

  const SHARED_ACTS = {
    high:   ['Family dinner', 'Planning session', 'Temple visit', 'Family outing'],
    medium: ['Shopping', 'Casual outing', 'Movie night'],
    low:    ['Rest at home', 'Individual activities']
  }
  const AVOID_ACTS = {
    high:   ['No major restrictions today'],
    medium: ['Avoid late travel'],
    low:    ['Avoid arguments', 'Avoid long drives', 'Avoid major decisions']
  }
  const tier = familyConf.tier === 'High' ? 'high' : familyConf.tier === 'Medium' ? 'medium' : 'low'

  return {
    harmony_pct:        familyScore,
    stars:              familyConf.stars,
    confidence:         familyConf.tier,
    best_shared_window: sharedWindow,
    conflict_windows:   avoidWindows.length > 1 ? avoidWindows : [],
    recommended:        SHARED_ACTS[tier],
    avoid:              AVOID_ACTS[tier]
  }
}
