/**
 * /lib/astrology/index.js — Layer 2 Public API
 *
 * Assembles all astrological interpretation modules into a canonical
 * AstroContext object consumed by lib/decision/engine.js.
 *
 * Data flow: lib/astronomy → lib/astrology → lib/decision
 *
 * AstroContext shape:
 * {
 *   grahas, panchang,                              // from Layer 1
 *   strengths, yogas, dasha, functionalRoles,      // interpretations
 *   aspects, psi, transitContext,                  // deeper analysis
 *   tithiEffect, nakshatraEffect, varaEffect,      // daily signals
 *   lagna, planetHouses, houses,                   // chart geometry
 *   daysAhead, certaintyFactor                     // temporal context
 * }
 */

import { assessPlanetStrength }                        from './strength.js'
import { computeFunctionalRoles }                       from './functional.js'
import { detectAllYogas }                               from './yogas.js'
import { computeAllAspects }                            from './aspects.js'
import { computePSI }                                   from './psi.js'
import { computeVimshottariDasha, dashaFromToday, DASHA_PERIODS } from './dasha.js'
import { tithiEffect, nakshatraEffect, planetaryEffect, yogaEffect } from './scoring.js'
import { buildTransitContext }                          from './transits.js'
import { nakshatra }                                    from '../astronomy/ephemeris.js'

export { assessPlanetStrength }
export { computeFunctionalRoles }
export { detectAllYogas }
export { computeAllAspects }
export { computePSI }
export { tithiEffect, nakshatraEffect, planetaryEffect, yogaEffect }
export { computeVimshottariDasha, dashaFromToday }
export { buildTransitContext }

// ─── Birth chart helpers ───────────────────────────────────────────────────────

function parseDob(dobString) {
  if (!dobString) return null
  const parts = dobString.split('-')
  if (parts.length !== 3) return null
  const [d, mo, y] = parts.map(Number)
  if (!d || !mo || !y || y < 1900) return null
  return new Date(y, mo - 1, d)
}

/**
 * assessAllStrengths(grahas)
 * Returns { planetName: strengthProfile } for all 9 grahas.
 */
export function assessAllStrengths(grahas) {
  const sunLon = grahas.Sun?.sidLon || 0
  const result = {}
  for (const [name, pos] of Object.entries(grahas)) {
    result[name] = assessPlanetStrength(name, pos, sunLon)
  }
  return result
}

/**
 * computeCurrentDasha(moonPos, birthChart, userDob)
 * Returns Vimshottari Dasha state.
 */
export function computeCurrentDasha(moonPos, birthChart, userDob) {
  const moonNak = nakshatra(moonPos?.sidLon || 0)
  if (birthChart && userDob) {
    try {
      const birthDate = parseDob(userDob)
      if (birthDate) {
        const birthMoonSid = birthChart.grahas?.Moon?.sidLon || moonPos.sidLon
        const birthNak     = nakshatra(birthMoonSid)
        const lonInNak     = birthMoonSid % (360 / 27)
        return computeVimshottariDasha(birthNak.index, lonInNak, birthDate)
      }
    } catch {}
  }
  const todayLord = dashaFromToday(moonNak.index)
  return { currentLord: todayLord, currentSub: todayLord, elapsedYears: 0, remainingYears: DASHA_PERIODS[todayLord] || 0 }
}

/**
 * buildAstroContext(dailyAstronomy, birthChart, userDob, daysAhead)
 *
 * MASTER FUNCTION — the only function the Decision Engine needs to call.
 * Returns a complete, validated AstroContext.
 */
export function buildAstroContext(dailyAstronomy, birthChart, userDob, daysAhead = 0) {
  const { grahas, panchang } = dailyAstronomy

  // ── Strengths ──────────────────────────────────────────────────────────────
  const strengths = assessAllStrengths(grahas)

  // ── Functional roles (Lagna-dependent) ────────────────────────────────────
  const lagnaSign = birthChart?.lagna?.sign ?? null
  const functionalRoles = lagnaSign != null ? computeFunctionalRoles(lagnaSign) : {}

  // ── Aspects ────────────────────────────────────────────────────────────────
  const planetHouses = birthChart?.planetHouses || {}
  const aspects      = Object.keys(planetHouses).length > 0 ? computeAllAspects(planetHouses) : {}

  // ── Yogas ──────────────────────────────────────────────────────────────────
  const yogas = detectAllYogas(grahas, planetHouses, lagnaSign ?? 0)

  // ── Dasha ──────────────────────────────────────────────────────────────────
  const dasha = computeCurrentDasha(grahas.Moon, birthChart, userDob)

  // ── Planetary Strength Index ───────────────────────────────────────────────
  const psi = computePSI(grahas, planetHouses, strengths, aspects, dasha, functionalRoles)

  // ── Transits (current vs natal) ────────────────────────────────────────────
  const transitContext = buildTransitContext(grahas, birthChart?.grahas || null, lagnaSign)

  // ── Panchang effects ───────────────────────────────────────────────────────
  const tithiFx     = tithiEffect(panchang.tithi.name, panchang.tithi.phase)
  const nakshatraFx = nakshatraEffect(panchang.nakshatra.name)

  // ── Vara planet effect ─────────────────────────────────────────────────────
  const varaPlanetName = panchang.vara
  const varaStrength   = psi[varaPlanetName]?.psi || 5
  const varaStr        = strengths[varaPlanetName]?.effectiveScore || 3
  const varaHouse      = planetHouses[varaPlanetName] || null
  const varaEffect     = planetaryEffect(varaPlanetName, varaStr, varaHouse)

  // ── Yoga aggregate effect ──────────────────────────────────────────────────
  const yogaFx = yogas.reduce((acc, y) => {
    const fx = yogaEffect(y)
    acc.d += fx.d; acc.c += fx.c; acc.r += fx.r; acc.f += fx.f
    return acc
  }, { d:0, c:0, r:0, f:0 })

  return {
    // Layer 1 inputs (raw astronomical facts)
    grahas, panchang,
    // Layer 2 interpretations
    strengths, functionalRoles, yogas, dasha, psi,
    aspects, transitContext,
    // Aggregated effects for Decision Engine
    tithiEffect: tithiFx,
    nakshatraEffect: nakshatraFx,
    varaEffect,
    yogaEffect: yogaFx,
    // Chart geometry
    lagna:        birthChart?.lagna || null,
    planetHouses,
    houses:       birthChart?.houses || [],
    // Temporal context
    daysAhead,
    certaintyFactor: daysAhead === 0 ? 1.0 : daysAhead <= 3 ? 0.85 : 0.70
  }
}
