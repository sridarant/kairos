// /lib/astro/chart.js — Birth chart engine foundation
// Computes Lagna, house system, and planet-house interactions.
// Uses birth time and DOB for deterministic personalization.
// REAL API INTEGRATION POINT: replace computeLagnaIndex with Swiss Ephemeris
// when available for true sidereal ascendant calculation.

import { ZODIAC, ZODIAC_NAMES, PLANET_DEFS } from './planets.js'

// ─── 12-house meanings ────────────────────────────────────────────────────────
export const HOUSES = {
  1:  { name: 'Self',           dim: 'd', label: 'identity and initiative' },
  2:  { name: 'Wealth',         dim: 'd', label: 'values and resources' },
  3:  { name: 'Communication',  dim: 'c', label: 'expression and short travel' },
  4:  { name: 'Home',           dim: 'f', label: 'roots and emotional foundation' },
  5:  { name: 'Creativity',     dim: 'c', label: 'creativity and self-expression' },
  6:  { name: 'Health',         dim: 'f', label: 'service, health, and daily work' },
  7:  { name: 'Relationships',  dim: 'c', label: 'partnerships and balance' },
  8:  { name: 'Transformation', dim: 'r', label: 'change, depth, and shared resources' },
  9:  { name: 'Fortune',        dim: 'd', label: 'wisdom, luck, and long journeys' },
  10: { name: 'Career',         dim: 'd', label: 'public role and achievement' },
  11: { name: 'Gains',          dim: 'd', label: 'aspirations and social networks' },
  12: { name: 'Spirituality',   dim: 'f', label: 'solitude, release, and inner life' }
}

// ─── Planet-house impact table ────────────────────────────────────────────────
// Delta per dimension when a planet occupies a house.
// Keyed as "Planet:House"
const PLANET_HOUSE_IMPACTS = {
  'Mercury:3':  { d: 0, c: 3, r: 0, f: 0, note: 'Mercury in 3rd — communication is exceptionally strong' },
  'Mercury:1':  { d: 1, c: 2, r: 0, f: 0, note: 'Mercury rising — articulate and quick-minded' },
  'Mercury:10': { d: 1, c: 1, r: 0, f: 1, note: 'Mercury in career house — sharp professional communication' },
  'Jupiter:9':  { d: 2, c: 0, r:-1, f: 0, note: 'Jupiter in 9th — fortune, wisdom, and bold decisions' },
  'Jupiter:1':  { d: 2, c: 0, r: 0, f: 0, note: 'Jupiter rising — expansive confidence and judgment' },
  'Jupiter:10': { d: 2, c: 1, r: 0, f: 0, note: 'Jupiter in career — visible growth and authority' },
  'Saturn:10':  { d: 1, c: 0, r: 0, f: 2, note: 'Saturn in career house — disciplined, structured progress' },
  'Saturn:1':   { d:-1, c: 0, r: 1, f: 2, note: 'Saturn rising — caution, patience, and endurance' },
  'Saturn:8':   { d:-1, c: 0, r: 2, f: 0, note: 'Saturn in 8th — deep transformation, proceed carefully' },
  'Mars:1':     { d: 2, c: 0, r: 2, f: 0, note: 'Mars in 1st — bold action energy, elevated risk' },
  'Mars:10':    { d: 2, c: 0, r: 1, f: 0, note: 'Mars in career — driven and assertive, watch aggression' },
  'Mars:8':     { d: 1, c: 0, r: 3, f: 0, note: 'Mars in 8th — intense, transformative, high risk' },
  'Venus:7':    { d: 0, c: 2, r:-1, f: 1, note: 'Venus in 7th — relationship harmony and diplomacy' },
  'Venus:5':    { d: 0, c: 2, r: 0, f: 1, note: 'Venus in 5th — creative and romantic energy heightened' },
  'Venus:1':    { d: 0, c: 2, r:-1, f: 0, note: 'Venus rising — graceful, charming, and socially adept' },
  'Moon:4':     { d: 0, c: 0, r: 0, f: 2, note: 'Moon in 4th — deep emotional sensitivity and home focus' },
  'Moon:1':     { d: 0, c: 1, r: 0, f: 2, note: 'Moon rising — intuitive, receptive, emotionally led' },
  'Moon:7':     { d: 0, c: 2, r: 0, f: 0, note: 'Moon in 7th — relational and empathic energy strong' },
  'Sun:10':     { d: 2, c: 0, r: 0, f: 0, note: 'Sun in career house — leadership and visibility amplified' },
  'Sun:1':      { d: 2, c: 0, r: 0, f: 0, note: 'Sun rising — strong will, vitality, and self-expression' },
  'Sun:5':      { d: 1, c: 1, r: 0, f: 0, note: 'Sun in 5th — creative self-expression and confidence' },
}

// ─── Compute Lagna (ascendant) ────────────────────────────────────────────────
// Tropical approximation: each 2 hours of birth time = 1 zodiac sign on ascendant.
// REAL API: replace with sidereal Lagna from Swiss Ephemeris using lat/lon/datetime.
export function computeLagna(birthTime) {
  if (!birthTime) return null
  const h = parseInt(birthTime.split(':')[0], 10)
  if (isNaN(h)) return null
  const idx = Math.floor(h / 2) % 12
  return { index: idx, name: ZODIAC_NAMES[idx], ...ZODIAC[idx] }
}

// ─── Compute planet house positions ──────────────────────────────────────────
// Given a Lagna sign index and today's planetary positions (transits),
// each planet's house = (planetSignIndex - lagnaSignIndex + 12) % 12 + 1
export function computePlanetHouses(lagnaIndex, transits) {
  if (lagnaIndex == null || !transits) return {}
  const houses = {}
  for (const t of transits) {
    const signIdx   = ZODIAC_NAMES.indexOf(t.sign)
    if (signIdx < 0) continue
    const houseNum  = ((signIdx - lagnaIndex + 12) % 12) + 1
    houses[t.planet] = houseNum
  }
  return houses
}

// ─── Compute house effects ────────────────────────────────────────────────────
// Returns aggregated dims from all active planet-house pairs
export function computeHouseEffects(planetHouses) {
  const agg   = { d: 0, c: 0, r: 0, f: 0, notes: [], breakdown: {} }
  for (const [planet, house] of Object.entries(planetHouses)) {
    const key    = `${planet}:${house}`
    const impact = PLANET_HOUSE_IMPACTS[key]
    if (!impact) continue
    agg.d += impact.d
    agg.c += impact.c
    agg.r += impact.r
    agg.f += impact.f
    agg.notes.push(impact.note)
    agg.breakdown[key] = impact
  }
  agg.note = agg.notes[0] || null
  return agg
}

// ─── Build full birth chart ───────────────────────────────────────────────────
export function buildBirthChart(birthTime, transits) {
  const lagna = computeLagna(birthTime)
  if (!lagna) return { lagna: null, planetHouses: {}, houseEffects: { d:0,c:0,r:0,f:0,notes:[],breakdown:{} } }

  const planetHouses = computePlanetHouses(lagna.index, transits)
  const houseEffects = computeHouseEffects(planetHouses)

  return {
    lagna,
    planetHouses,
    houseEffects,
    houses: HOUSES
  }
}

// ─── Birth chart summary for message building ─────────────────────────────────
export function buildChartSummary(chart) {
  if (!chart?.lagna) return null
  const topNotes = chart.houseEffects.notes.slice(0, 2)
  return topNotes.length > 0 ? topNotes.join('; ') : null
}
