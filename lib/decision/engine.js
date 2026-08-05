/**
 * /lib/decision/engine.js — Layer 3: Decision Engine
 *
 * Converts AstroContext (from lib/astrology) into a canonical DecisionObject.
 * NO natural language generation here.
 * NO astronomical calculations here.
 * ONLY deterministic rule-based decision logic.
 *
 * DecisionObject schema:
 * {
 *   decision:        'DO' | 'WAIT' | 'AVOID'
 *   confidence:      'High' | 'Medium' | 'Low'
 *   stars:           1–5
 *   goldenWindow:    'HH:MM–HH:MM'
 *   avoidWindow:     'HH:MM–HH:MM'
 *   focus:           string (primary activity theme)
 *   categoryScores:  { career:1-5, finance:1-5, ... }
 *   reasons:         string[] (structured data, NOT prose — used by language layer)
 *   timeline:        TimelineEvent[]
 *   signals:         { positive: string[], caution: string[], neutral: string[] }
 *   rawScore:        number (internal, not shown to users)
 * }
 */

import { computeConfidence, scoreToStars, scoreToTier } from './confidence.js'
import { buildTimeline } from './timing.js'
import { runFullReasoning } from '../reasoning/index.js'

// ─── Time slots (base schedule, modified by astro engine) ─────────────────────
const BASE_SLOTS = [
  { time:'07:00–09:00', base:{ d:1,  c:1,  r:0,  f:1  } },
  { time:'09:00–11:00', base:{ d:2,  c:2,  r:0,  f:2  } },
  { time:'11:00–13:00', base:{ d:1,  c:2,  r:0,  f:1  } },
  { time:'13:00–15:00', base:{ d:0,  c:-1, r:-1, f:0  } },
  { time:'15:00–17:00', base:{ d:-1, c:-2, r:-1, f:-1 } },
  { time:'17:00–19:00', base:{ d:-2, c:-1, r:-2, f:-1 } }
]

/**
 * scoreSlots(astroCtx, personalSeed)
 * Applies all astro layers to base slots. Returns scored slot array.
 */
function scoreSlots(astroCtx, personalSeed = 1) {
  const { tithiEffect, nakshatraEffect, varaEffect, yogaEffect, lagna, certaintyFactor } = astroCtx

  // Personal jitter: ±1 on decision, ±0/1 on communication
  const decAdj  = (personalSeed % 3) - 1
  const commAdj = personalSeed % 2

  return BASE_SLOTS.map(slot => {
    const b = slot.base
    // Layer order: base → vara → tithi → nakshatra → yoga → lagna → personal seed
    const dims = {
      d: b.d + (varaEffect.d||0) + (tithiEffect.d||0) + (nakshatraEffect.d||0) + (yogaEffect.d||0) + (lagna ? Math.round(lagna.d||0) : 0) + decAdj,
      c: b.c + (varaEffect.c||0)                       + (nakshatraEffect.c||0) + (yogaEffect.c||0) + commAdj,
      r: b.r + (varaEffect.r||0) + (tithiEffect.r||0) + (nakshatraEffect.r||0) + (yogaEffect.r||0),
      f: b.f + (varaEffect.f||0) + (tithiEffect.f||0) + (nakshatraEffect.f||0) + (yogaEffect.f||0)
    }
    const score = dims.d + dims.c + dims.f - dims.r
    return { time: slot.time, dims, score: +score.toFixed(3) }
  })
}

// ─── Focus label from dominant dimension ──────────────────────────────────────
const FOCUS_OPTS = {
  d: ['Decision Making', 'Career', 'Leadership'],
  c: ['Communication', 'Relationships', 'Networking'],
  f: ['Deep Work', 'Learning', 'Focus'],
  r: ['Caution', 'Health', 'Reflection']
}

function dominantDim(goldenDims) {
  const dims = [
    { k:'d', v: goldenDims.d || 0 },
    { k:'c', v: goldenDims.c || 0 },
    { k:'f', v: goldenDims.f || 0 }
  ].sort((a, b) => b.v - a.v)
  return dims[0].k
}

// ─── Category scores ──────────────────────────────────────────────────────────
const CAT_DIM = {
  career:'d', finance:'r', relationships:'c', health:'f',
  learning:'f', travel:'d', spiritual:'f', home:'f',
  family:'c', shopping:'r', medical:'f'
}

function computeCategoryScores(goldenDims, worstDims, yogas, strengths) {
  // Bonus: active Raja/Dhana yoga lifts career/finance
  const rajaBonus  = yogas.some(y => y.name === 'Raja Yoga')  ? 1 : 0
  const dhanaBonus = yogas.some(y => y.name === 'Dhana Yoga') ? 1 : 0

  const raw = {
    career:        (goldenDims.d || 0) + rajaBonus,
    finance:       -(worstDims.r || 0) + dhanaBonus,   // inverse risk
    relationships: (goldenDims.c || 0),
    health:        (goldenDims.f || 0),
    learning:      (goldenDims.f || 0) + (goldenDims.c || 0) * 0.3,
    travel:        (goldenDims.d || 0) - (goldenDims.r || 0) * 0.5,
    spiritual:     (goldenDims.f || 0),
    home:          (goldenDims.f || 0) * 0.8,
    family:        (goldenDims.c || 0),
    shopping:      -(worstDims.r || 0) * 0.8,
    medical:       (goldenDims.f || 0) * 0.9
  }

  // Normalise each to 1–5
  const norm = v => Math.max(1, Math.min(5, Math.round(((v + 3) / 6) * 4) + 1))
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, norm(v)]))
}

// ─── Reason signals (structured data for language layer) ──────────────────────
function buildSignals(astroCtx) {
  const { panchang, yogas, strengths, dasha, tithiEffect, nakshatraEffect } = astroCtx
  const positive = [], caution = [], neutral = []

  // Tithi
  if (tithiEffect.d > 0) positive.push(`TITHI:${panchang.tithi.name}:${tithiEffect.label}`)
  else if (tithiEffect.r > 0) caution.push(`TITHI:${panchang.tithi.name}:${tithiEffect.label}`)
  else neutral.push(`TITHI:${panchang.tithi.name}:${tithiEffect.label}`)

  // Nakshatra
  if (nakshatraEffect.d > 0 || nakshatraEffect.c > 0)
    positive.push(`NAKSHATRA:${panchang.nakshatra.name}:${nakshatraEffect.label}`)
  else if (nakshatraEffect.r > 1)
    caution.push(`NAKSHATRA:${panchang.nakshatra.name}:${nakshatraEffect.label}`)
  else neutral.push(`NAKSHATRA:${panchang.nakshatra.name}:${nakshatraEffect.label}`)

  // Yogas
  yogas.forEach(y => {
    const fx = astroCtx.yogaEffect
    if (y.name.includes('Raja') || y.name.includes('Dhana'))
      positive.push(`YOGA:${y.name}:${y.description}`)
    else if (y.name === 'Graha Yuddha')
      caution.push(`YOGA:${y.name}:${y.description}`)
    else neutral.push(`YOGA:${y.name}:${y.description}`)
  })

  // Vara planet
  const varaPlanet = panchang.vara
  const varaStr    = strengths[varaPlanet]
  if (varaStr?.effectiveScore >= 4) positive.push(`VARA:${varaPlanet}:${varaPlanet} is strong today`)
  else if (varaStr?.effectiveScore <= 2) caution.push(`VARA:${varaPlanet}:${varaPlanet} is weakened today`)
  else neutral.push(`VARA:${varaPlanet}:${varaPlanet} is the day ruler`)

  // Dasha
  neutral.push(`DASHA:${dasha.currentLord}:${dasha.currentLord} Mahadasha, ${dasha.currentSub} Antardasha`)

  return { positive, caution, neutral }
}

/**
 * buildDecisionObject(astroCtx, personalSeed, daysAhead)
 *
 * The canonical decision object. Every screen in the app consumes this.
 * No natural language here — only structured facts.
 *
 * @param {object} astroCtx   — from lib/astrology/index.buildAstroContext()
 * @param {number} personalSeed — derived from user DOB + today's date
 * @param {number} daysAhead
 * @returns DecisionObject
 */
export function buildDecisionObject(astroCtx, personalSeed = 1, daysAhead = 0) {
  const slots   = scoreSlots(astroCtx, personalSeed)
  const sorted  = [...slots].sort((a, b) => b.score - a.score)
  const golden  = sorted[0]
  const worst   = sorted[sorted.length - 1]
  const medium  = [...slots].sort((a, b) => Math.abs(a.score - 0) - Math.abs(b.score - 0))[0]

  const goldenDims = golden.dims
  const worstDims  = worst.dims

  // ── Confidence ──────────────────────────────────────────────────────────────
  const spreadScore      = golden.score - worst.score
  // Use transit net score if available (positive = supportive transits)
  const transitAgreement = (astroCtx.transitContext?.netScore || 0) >= 0 ||
                           (goldenDims.d || 0) > 0 || (goldenDims.c || 0) > 0
  const nakshatraFx      = astroCtx.nakshatraEffect
  const nakshatraDelta   = Math.abs(nakshatraFx.d || 0) + Math.abs(nakshatraFx.c || 0)
  const tithiPhase       = astroCtx.panchang.tithi.name
  const lagnaAligned     = !!astroCtx.lagna
  // Sade Sati reduces confidence
  const sadeSatiPenalty  = astroCtx.transitContext?.isSadeSati ? -8 : 0

  const confResult = computeConfidence({
    spreadScore, transitAgreement, nakshatraDelta,
    tithiPhase, lagnaAligned, familyHarmony: null, daysAhead
  })
  // Apply Sade Sati penalty post-computation
  if (sadeSatiPenalty && confResult.score) {
    confResult.score = Math.max(10, confResult.score + sadeSatiPenalty)
    confResult.tier  = confResult.score >= 70 ? 'High' : confResult.score >= 45 ? 'Medium' : 'Low'
  }

  // ── Decision (DO/WAIT/AVOID) ────────────────────────────────────────────────
  // Based on golden slot score and risk dimension
  let decision
  if (golden.score > 1.5 && (goldenDims.r || 0) < 1)        decision = 'DO'
  else if (golden.score < -0.5 || (goldenDims.r || 0) > 2)  decision = 'AVOID'
  else                                                         decision = 'WAIT'

  // Apply future-date softening: never 'AVOID' for +5–7 days (not enough precision)
  if (daysAhead >= 5 && decision === 'AVOID') decision = 'WAIT'

  // ── Focus ───────────────────────────────────────────────────────────────────
  const dom   = dominantDim(goldenDims)
  const focus = FOCUS_OPTS[dom]?.[personalSeed % 3] || 'Decision Making'

  // ── Category scores ─────────────────────────────────────────────────────────
  const categoryScores = computeCategoryScores(
    goldenDims, worstDims, astroCtx.yogas, astroCtx.strengths
  )

  // Signals from reasoning engine (evidence-based, not score-based)
  const signals = reasoning.signals

  // ── Timeline ────────────────────────────────────────────────────────────────
  const timeline = buildTimeline(slots, personalSeed)

  // ── Recommendations (structured, no prose) ───────────────────────────────
  const reasons = [
    ...signals.positive.slice(0, 2),
    ...signals.caution.slice(0, 1)
  ]

  // ── Reasoning Engine integration ──────────────────────────────────────────
  // Run the full reasoning pipeline on top of the slot scores
  const reasoning = runFullReasoning(astroCtx, +golden.score.toFixed(3), golden.time, worst.time)

  // Reasoning decision overrides slot-only decision when evidence is strong
  const finalDecision = reasoning.confidenceScore >= 55 ? reasoning.decision : decision

  return {
    decision: finalDecision,         // 'DO' | 'WAIT' | 'AVOID'
    confidence: reasoning.confidence || confResult.tier, // from reasoning engine
    stars:      scoreToStars(reasoning.confidenceScore || confResult.score),
    rawScore:   +golden.score.toFixed(3),
    goldenWindow: golden.time,
    avoidWindow:  worst.time,
    watchWindow:  medium.time,
    focus,
    categoryScores,
    reasons,
    signals,
    timeline,
    // Reasoning engine outputs
    recommendations: reasoning.recommendations,
    explanationMeta: reasoning.explanationMeta,
    _reasoningResult: reasoning.reasoningResult,
    // Internal references (for language layer)
    _panchang:    astroCtx.panchang,
    _dasha:       astroCtx.dasha,
    _yogas:       astroCtx.yogas,
    _lagna:       astroCtx.lagna,
    _nakshatraFx: nakshatraFx,
    _tithiFx:     astroCtx.tithiEffect,
    _varaEffect:  astroCtx.varaEffect,
    _certainty:   astroCtx.certaintyFactor
  }
}

/**
 * buildFamilyDecisionObject(memberDecisions)
 * Genuine multi-member analysis — no simple averaging.
 */
export function buildFamilyDecisionObject(memberDecisions) {
  if (!memberDecisions?.length) return null
  const scores  = memberDecisions.map(m => m.rawScore || 0)
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length
  const variance = scores.reduce((a, b) => a + Math.abs(b - avgScore), 0) / scores.length

  // Shared windows: find golden windows that appear in majority
  const wins = memberDecisions.map(m => m.goldenWindow).filter(Boolean)
  const winCount = {}
  wins.forEach(w => { winCount[w] = (winCount[w] || 0) + 1 })
  const sharedWindow = Object.entries(winCount).sort((a,b) => b[1]-a[1])[0]?.[0]

  // Conflict windows
  const avoidWins = [...new Set(memberDecisions.map(m => m.avoidWindow).filter(Boolean))]

  // Harmony: penalise high variance between members
  const harmonyScore = Math.max(10, Math.min(95, Math.round((avgScore + 3) / 6 * 90 - variance * 5)))
  const harmonyConf  = computeConfidence({ spreadScore: avgScore, transitAgreement: avgScore > 0,
    nakshatraDelta: 1, tithiPhase: 'Panchami', lagnaAligned: false,
    familyHarmony: harmonyScore, daysAhead: 0 })

  const tier = harmonyConf.tier === 'High' ? 'high' : harmonyConf.tier === 'Medium' ? 'medium' : 'low'
  const RECOMMENDED = {
    high:   ['Family dinner', 'Planning session', 'Temple visit', 'Outing'],
    medium: ['Shopping', 'Casual outing', 'Movie night'],
    low:    ['Rest at home', 'Individual activities']
  }
  const AVOID_SHARED = {
    high: ['No major restrictions'], medium: ['Avoid late travel'], low: ['Avoid arguments', 'Defer major decisions']
  }

  return {
    harmonyScore,
    stars:             harmonyConf.stars,
    confidence:        harmonyConf.tier,
    bestSharedWindow:  sharedWindow,
    conflictWindows:   avoidWins.length > 1 ? avoidWins : [],
    recommended:       RECOMMENDED[tier],
    avoid:             AVOID_SHARED[tier]
  }
}
