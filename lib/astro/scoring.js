// /lib/astro/scoring.js
// Weighted scoring system. Replaces flat additive scoring with weighted layers.
// Each layer contributes a fraction of the final score.

// ─── Base time slots ──────────────────────────────────────────────────────────
export const SLOTS = [
  { time:'07:00–09:00', d: 1, c: 1, r: 0, f: 1 },
  { time:'09:00–11:00', d: 2, c: 2, r: 0, f: 2 },
  { time:'11:00–13:00', d: 1, c: 2, r: 0, f: 1 },
  { time:'13:00–15:00', d: 0, c:-1, r:-1, f: 0 },
  { time:'15:00–17:00', d:-1, c:-2, r:-1, f:-1 },
  { time:'17:00–19:00', d:-2, c:-1, r:-2, f:-1 }
]

// ─── Layer weights (must sum to 1.0) ──────────────────────────────────────────
export const WEIGHTS = {
  base:        0.25,   // time-slot base
  vara:        0.08,   // weekday planet (Vara)
  lunar:       0.05,   // lunar phase
  tithi:       0.05,   // tithi
  nakshatra:   0.10,   // nakshatra
  transit:     0.08,   // planetary transits
  interaction: 0.08,   // Moon+Dasha, Vara+Lagna
  lagna:       0.08,   // birth ascendant
  moonSign:    0.05,   // moon sign
  userBias:    0.05,   // personal seed + type
  chart:       0.09    // birth chart house effects
}

// ─── Compute weighted score for one slot ─────────────────────────────────────
// Each layer contributes dims (d/c/r/f), multiplied by its weight × 10 (scale).
export function computeWeightedSlot(slot, layers) {
  const dims = { d:0, c:0, r:0, f:0 }
  const breakdown = {}

  for (const [key, weight] of Object.entries(WEIGHTS)) {
    const layer = layers[key]
    if (!layer) continue
    const ld = (layer.d || 0), lc = (layer.c || 0), lr = (layer.r || 0), lf = (layer.f || 0)
    dims.d += ld * weight
    dims.c += lc * weight
    dims.r += lr * weight
    dims.f += lf * weight
    breakdown[key] = { d: +(ld*weight).toFixed(2), c: +(lc*weight).toFixed(2), r: +(lr*weight).toFixed(2), f: +(lf*weight).toFixed(2) }
  }

  const score = dims.d + dims.c + dims.f - dims.r
  return { ...slot, dims, score: +score.toFixed(3), breakdown }
}

// ─── Full slot scoring ────────────────────────────────────────────────────────
export function scoredSlots(astroCtx, userCtx) {
  const { vara, lunar, tithi, nakshatra, transits, lagna, moonSign, interactions, chartEffects } = astroCtx
  const { seed, typeBoost } = userCtx

  const decAdj  = (seed % 3) - 1
  const commAdj = seed % 2
  const userBias = { d: decAdj, c: commAdj, r: 0, f: 0 }

  // Lagna and moonSign as zodiac dims
  const lagnaLayer    = lagna    ? { d: lagna.d||0,    c: lagna.c||0,    r: lagna.r||0,    f: lagna.f||0    } : null
  const moonSignLayer = moonSign ? { d: moonSign.d||0, c: moonSign.c||0, r: moonSign.r||0, f: moonSign.f||0 } : null

  return SLOTS.map(slot => {
    const layers = {
      base:        { d: slot.d, c: slot.c, r: slot.r, f: slot.f },
      vara:        vara        || null,
      lunar:       lunar       || null,
      tithi:       tithi?.delta ? { d: tithi.delta.d||0, c:0, r: tithi.delta.r||0, f: tithi.delta.f||0 } : null,
      nakshatra:   nakshatra   ? { d: nakshatra.d||0, c: nakshatra.c||0, r: nakshatra.r||0, f: nakshatra.f||0 } : null,
      transit:     transits    || null,
      interaction: interactions || null,
      lagna:       lagnaLayer  || null,
      moonSign:    moonSignLayer ? { d:(moonSignLayer.d*0.5)||0, c:(moonSignLayer.c*0.5)||0, r:(moonSignLayer.r*0.5)||0, f:(moonSignLayer.f*0.5)||0 } : null,
      userBias:    { ...userBias, ...typeBoost }
    }
    return computeWeightedSlot(slot, layers)
  })
}

// ─── Confidence from score spread ─────────────────────────────────────────────
export function toConfidence(bestScore, worstScore) {
  const spread = bestScore - worstScore
  if (spread >= 3.0) return Math.min(92, 80 + Math.round((spread - 3.0) * 10))
  if (spread >= 1.5) return Math.round(60 + ((spread - 1.5) / 1.5) * 20)
  return Math.max(20, Math.round((spread / 1.5) * 60))
}

// ─── Debug breakdown ──────────────────────────────────────────────────────────
export function buildDebugBreakdown(scoredSlotsList) {
  const golden = [...scoredSlotsList].sort((a, b) => b.score - a.score)[0]
  return {
    golden_window: golden.time,
    score:         golden.score,
    dims:          golden.dims,
    layers:        golden.breakdown
  }
}

// ─── Profile type boost ───────────────────────────────────────────────────────
export function getTypeBoost(type) {
  if (!type) return { d:0, c:0, r:0, f:0 }
  const t = type.toLowerCase()
  if (t.includes('work') || t.includes('entrepreneur')) return { d:1, c:1, r:0, f:0 }
  if (t.includes('student'))  return { d:0, c:0, r:0, f:1 }
  if (t.includes('creative')) return { d:0, c:1, r:0, f:1 }
  return { d:0, c:0, r:0, f:0 }
}
