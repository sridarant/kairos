// /lib/astro/interactions.js
// Planetary interaction rules — Moon + Dasha, Vara + Lagna

const INTERACTION_TABLE = {
  'Moon+Sun':      { d: 1, c: 0, r: 0, f: 1, note:'Sun sharpens decisions through lunar intuition' },
  'Moon+Moon':     { d: 0, c: 0, r: 0, f: 2, note:'Double lunar energy deepens inner focus' },
  'Moon+Mars':     { d: 1, c: 0, r: 2, f:-1, note:'Mars agitates the lunar field — act boldly but expect turbulence' },
  'Moon+Mercury':  { d: 0, c: 2, r: 0, f: 0, note:'Mercury boosts communication through lunar clarity' },
  'Moon+Jupiter':  { d: 2, c: 0, r:-1, f: 0, note:'Jupiter expands decision clarity via lunar wisdom' },
  'Moon+Venus':    { d: 0, c: 1, r:-1, f: 1, note:'Venus eases relationships and softens risk' },
  'Moon+Saturn':   { d:-1, c: 0, r: 1, f: 1, note:'Saturn restrains impulse, sharpens focus through discipline' },
  'Moon+Rahu':     { d: 1, c: 1, r: 1, f:-1, note:'Rahu amplifies ambition — opportunities appear, caution needed' },
  'Moon+Ketu':     { d:-1, c: 0, r: 0, f: 2, note:'Ketu withdraws energy inward — favours reflection over action' },
  // Vara planet + Lagna interactions (at 0.75× weight)
  'Sun+Lagna':     { d: 2, c: 0, r: 0, f: 0, note:'Solar will aligns with rising energy' },
  'Moon+Lagna':    { d: 0, c: 1, r: 0, f: 1, note:'Lunar sensitivity heightened by Lagna' },
  'Mars+Lagna':    { d: 1, c: 0, r: 2, f: 0, note:'Mars activates Lagna — bold but risky' },
  'Mercury+Lagna': { d: 0, c: 2, r: 0, f: 1, note:'Mercury energises Lagna for articulation' },
  'Jupiter+Lagna': { d: 2, c: 0, r:-1, f: 0, note:'Jupiter expands Lagna potential' },
  'Venus+Lagna':   { d: 0, c: 1, r:-1, f: 1, note:'Venus harmonises with Lagna — social energy rises' },
  'Saturn+Lagna':  { d:-1, c: 0, r: 1, f: 2, note:'Saturn tests Lagna — patience and structure rewarded' },
}

export function computeInteraction(varaPlanetName, dashaPlanetName, lagnaSignName) {
  const agg = { d:0, c:0, r:0, f:0, notes: [] }

  // Moon + Dasha planet interaction
  const moonDashaKey  = `Moon+${dashaPlanetName}`
  const moonDashaDelta = INTERACTION_TABLE[moonDashaKey]
  if (moonDashaDelta) {
    agg.d += moonDashaDelta.d
    agg.c += moonDashaDelta.c
    agg.r += moonDashaDelta.r
    agg.f += moonDashaDelta.f
    agg.notes.push(moonDashaDelta.note)
  }

  // Vara planet + Lagna (0.75× weight)
  if (lagnaSignName) {
    const lagnaKey   = `${varaPlanetName}+Lagna`
    const lagnaDelta = INTERACTION_TABLE[lagnaKey]
    if (lagnaDelta) {
      agg.d += Math.round(lagnaDelta.d * 0.75)
      agg.c += Math.round(lagnaDelta.c * 0.75)
      agg.r += Math.round(lagnaDelta.r * 0.75)
      agg.f += Math.round(lagnaDelta.f * 0.75)
      agg.notes.push(lagnaDelta.note)
    }
  }

  agg.note = agg.notes[0] || null
  return agg
}
