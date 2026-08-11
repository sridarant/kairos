/**
 * DEPRECATED (Sprint 3) — Part of legacy v22 calculation stack.
 * Only imported by api/ask.js and api/astro.js, both deprecated.
 * DO NOT add new imports from this file.
 */
// /lib/astro/planets.js
// Planetary positions and transit scoring.
// REAL API INTEGRATION POINT: replace fetchPlanetaryPositions body with
// a Swiss Ephemeris sidecar, Prokerala API, or AstroAPI.com call.

// ─── Zodiac sign table ────────────────────────────────────────────────────────
export const ZODIAC = [
  { name:'Aries',       d: 2, c: 0, r: 1, f: 0 },
  { name:'Taurus',      d: 0, c: 0, r: 0, f: 1 },
  { name:'Gemini',      d: 0, c: 2, r: 0, f: 0 },
  { name:'Cancer',      d: 0, c: 0, r: 1, f: 0 },
  { name:'Leo',         d: 1, c: 0, r: 0, f: 0 },
  { name:'Virgo',       d: 0, c: 0, r: 0, f: 2 },
  { name:'Libra',       d: 0, c: 1, r: 0, f: 0 },
  { name:'Scorpio',     d: 0, c: 0, r: 2, f: 0 },
  { name:'Sagittarius', d: 1, c: 0, r: 0, f: 0 },
  { name:'Capricorn',   d: 0, c: 0, r: 0, f: 1 },
  { name:'Aquarius',    d: 0, c: 1, r: 0, f: 0 },
  { name:'Pisces',      d: 0, c: 0, r: 0, f: 1 }
]

export const ZODIAC_NAMES = ZODIAC.map(z => z.name)

// ─── Planet definitions ───────────────────────────────────────────────────────
export const PLANET_DEFS = [
  { name:'Sun',     d: 1, c: 0, r: 0, f: 0, speed: 30  },
  { name:'Moon',    d: 0, c: 0, r: 0, f: 1, speed: 2   },
  { name:'Mars',    d: 1, c: 0, r: 2, f: 0, speed: 45  },
  { name:'Mercury', d: 0, c: 2, r: 0, f: 0, speed: 25  },
  { name:'Jupiter', d: 2, c: 0, r: 0, f: 0, speed: 365 },
  { name:'Venus',   d: 0, c: 1, r: 0, f: 0, speed: 27  },
  { name:'Saturn',  d:-1, c: 0, r: 1, f: 0, speed: 900 }
]

export const PLANET_REASONING = {
  Sun:     'decisiveness is amplified today',
  Moon:    'intuition and focus are heightened',
  Mars:    'bold action is favoured but risk is elevated',
  Mercury: 'communication flows with unusual clarity',
  Jupiter: 'conditions are ripe for confident decisions',
  Venus:   'collaboration and dialogue are well-starred',
  Saturn:  'patience and structure are rewarded over impulse',
  Rahu:    'ambition runs high — opportunities are magnified',
  Ketu:    'detachment and insight support inner decisions'
}

export const PLANET_CULTURAL = {
  Sun:'Surya / சூரியன்', Moon:'Chandra / சந்திரன்', Mars:'Kuja / செவ்வாய்',
  Mercury:'Budha / புதன்', Jupiter:'Guru / குரு', Venus:'Shukra / சுக்கிரன்',
  Saturn:'Shani / சனி'
}

// ─── Transit impact table ─────────────────────────────────────────────────────
const TRANSIT_IMPACTS = {
  Sun:     { Aries:{d:2,c:0,r:1,f:0}, Leo:{d:2,c:0,r:0,f:0} },
  Moon:    { Cancer:{d:0,c:1,r:0,f:1}, Taurus:{d:0,c:0,r:0,f:2} },
  Mars:    { Aries:{d:2,c:0,r:2,f:0}, Scorpio:{d:1,c:0,r:2,f:0}, Capricorn:{d:2,c:0,r:1,f:0} },
  Mercury: { Gemini:{d:0,c:2,r:0,f:0}, Virgo:{d:0,c:1,r:0,f:2} },
  Jupiter: { Sagittarius:{d:2,c:0,r:0,f:0}, Pisces:{d:0,c:1,r:0,f:1}, Cancer:{d:1,c:0,r:0,f:1} },
  Venus:   { Taurus:{d:0,c:1,r:0,f:1}, Libra:{d:0,c:2,r:0,f:0}, Pisces:{d:0,c:1,r:-1,f:1} },
  Saturn:  { Capricorn:{d:1,c:0,r:0,f:2}, Aquarius:{d:0,c:1,r:0,f:1}, Pisces:{d:-1,c:0,r:0,f:1} }
}

// ─── Day-of-year helper ───────────────────────────────────────────────────────
function dayOfYear() {
  const n = new Date(), s = new Date(n.getFullYear(), 0, 0)
  return Math.floor((n - s) / 86400000)
}

// ─── Deterministic transit positions ─────────────────────────────────────────
function computeTransits() {
  const doy = dayOfYear()
  return PLANET_DEFS.map(p => {
    const signIdx  = Math.floor(doy / p.speed) % 12
    const signName = ZODIAC_NAMES[signIdx]
    const impact   = TRANSIT_IMPACTS[p.name]?.[signName] || null
    return { planet: p.name, sign: signName, impact }
  })
}

// ─── Weekday planet (Vara) ────────────────────────────────────────────────────
const VARA_ORDER = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']
export function getVaraPlanet() {
  return PLANET_DEFS.find(p => p.name === VARA_ORDER[new Date().getDay()]) || PLANET_DEFS[0]
}

// ─── REAL API INTEGRATION POINT ──────────────────────────────────────────────
// Replace the body below with a real ephemeris call to get planetary positions.
// Return shape must match: { planets, transits, varaPlanet }
export async function fetchPlanetaryPositions(dateStr) {
  const transits   = computeTransits()
  const varaPlanet = getVaraPlanet()

  return {
    planets:    PLANET_DEFS.map(p => ({ ...p, signIndex: Math.floor(dayOfYear() / p.speed) % 12 })),
    transits,
    varaPlanet,
    source:     'deterministic'
  }
}

// ─── Aggregate transit deltas ─────────────────────────────────────────────────
export function aggregateTransits(transits, lagnaSignName, moonSignName) {
  const agg = { d:0, c:0, r:0, f:0 }
  for (const t of transits) {
    if (!t.impact) continue
    let weight = 0.5
    if (lagnaSignName  && t.sign === lagnaSignName)  weight = 1.0
    if (moonSignName   && t.sign === moonSignName)   weight = Math.max(weight, 0.75)
    agg.d += Math.round(t.impact.d * weight)
    agg.c += Math.round(t.impact.c * weight)
    agg.r += Math.round(t.impact.r * weight)
    agg.f += Math.round(t.impact.f * weight)
  }
  return agg
}

export function dominantTransit(transits) {
  return transits.filter(t => t.impact)
    .sort((a, b) => {
      const sa = Object.values(a.impact).reduce((s,v) => s + Math.abs(v), 0)
      const sb = Object.values(b.impact).reduce((s,v) => s + Math.abs(v), 0)
      return sb - sa
    })[0] || null
}
