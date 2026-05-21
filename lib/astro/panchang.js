// /lib/astro/panchang.js
// Panchang layer: Tithi, Nakshatra, Vara, Lunar phase, Moon sign, Dasha.
// Real API integration point — swap the internal logic with external calls here.

// ─── 27 Nakshatra table ───────────────────────────────────────────────────────
export const NAKSHATRAS = [
  { name:'Ashwini',        cultural:'அஸ்வினி / Ashwini',           d: 2, c: 0, r: 0, f: 0, label:'swift and initiating' },
  { name:'Bharani',        cultural:'பரணி / Bharani',               d: 1, c: 0, r: 1, f: 0, label:'transformative and intense' },
  { name:'Krittika',       cultural:'கிருத்திகை / Krittika',       d: 1, c: 0, r: 0, f: 1, label:'sharp and purifying' },
  { name:'Rohini',         cultural:'ரோகிணி / Rohini',             d: 0, c: 1, r: 0, f: 1, label:'fertile and creative' },
  { name:'Mrigashira',     cultural:'மிருகசீரிடம் / Mrigashira',   d: 0, c: 2, r: 0, f: 0, label:'curious and seeking' },
  { name:'Ardra',          cultural:'திருவாதிரை / Ardra',          d: 0, c: 0, r: 2, f: 0, label:'stormy and instability' },
  { name:'Punarvasu',      cultural:'புனர்பூசம் / Punarvasu',      d: 1, c: 0, r:-1, f: 0, label:'returning and hopeful' },
  { name:'Pushya',         cultural:'பூசம் / Pushya',               d: 1, c: 0, r:-1, f: 1, label:'nourishing and stable' },
  { name:'Ashlesha',       cultural:'ஆயில்யம் / Ashlesha',         d: 0, c: 0, r: 1, f: 1, label:'penetrating and intuitive' },
  { name:'Magha',          cultural:'மகம் / Magha',                 d: 2, c: 0, r: 0, f: 0, label:'regal and authoritative' },
  { name:'Purva Phalguni', cultural:'பூரம் / Purva Phalguni',       d: 0, c: 1, r: 0, f: 1, label:'pleasurable and creative' },
  { name:'Uttara Phalguni',cultural:'உத்திரம் / Uttara Phalguni',  d: 1, c: 1, r: 0, f: 0, label:'reliable and generous' },
  { name:'Hasta',          cultural:'அஸ்தம் / Hasta',               d: 0, c: 1, r: 0, f: 2, label:'skilled and dexterous' },
  { name:'Chitra',         cultural:'சித்திரை / Chitra',           d: 0, c: 2, r: 0, f: 0, label:'brilliant and creative' },
  { name:'Swati',          cultural:'சுவாதி / Swati',               d: 0, c: 1, r: 1, f:-1, label:'independent and dispersive' },
  { name:'Vishakha',       cultural:'விசாகம் / Vishakha',           d: 2, c: 0, r: 0, f: 0, label:'purposeful and ambitious' },
  { name:'Anuradha',       cultural:'அனுஷம் / Anuradha',           d: 0, c: 1, r: 0, f: 1, label:'devoted and cooperative' },
  { name:'Jyeshtha',       cultural:'கேட்டை / Jyeshtha',           d: 1, c: 0, r: 1, f: 0, label:'powerful and intense' },
  { name:'Mula',           cultural:'மூலம் / Mula',                 d:-1, c: 0, r: 2, f: 0, label:'investigative and uprooting' },
  { name:'Purva Ashadha',  cultural:'பூராடம் / Purva Ashadha',     d: 1, c: 0, r: 0, f: 1, label:'invincible and purifying' },
  { name:'Uttara Ashadha', cultural:'உத்திராடம் / Uttara Ashadha', d: 2, c: 0, r: 0, f: 0, label:'victorious and unwavering' },
  { name:'Shravana',       cultural:'திருவோணம் / Shravana',        d: 0, c: 2, r: 0, f: 1, label:'listening and connecting' },
  { name:'Dhanishta',      cultural:'அவிட்டம் / Dhanishta',        d: 0, c: 1, r: 0, f: 1, label:'wealthy and musical' },
  { name:'Shatabhisha',    cultural:'சதயம் / Shatabhisha',          d: 0, c: 0, r: 0, f: 2, label:'healing and secretive' },
  { name:'Purva Bhadra',   cultural:'பூரட்டாதி / Purva Bhadra',    d: 1, c: 0, r: 1, f: 0, label:'fierce and transforming' },
  { name:'Uttara Bhadra',  cultural:'உத்திரட்டாதி / Uttara Bhadra',d: 0, c: 0, r: 0, f: 2, label:'deep and stabilising' },
  { name:'Revati',         cultural:'ரேவதி / Revati',               d: 0, c: 1, r:-1, f: 1, label:'nurturing and transcendent' }
]

// ─── Tithi phases ──────────────────────────────────────────────────────────────
function tithiFromNumber(tithi) {
  const t = Math.max(1, Math.min(30, tithi))
  if (t <= 5)  return { tithi:t, phase:'Pratipada', delta:{d: 1,f: 0,r: 0}, label:'opening phase — favourable for new beginnings' }
  if (t <= 10) return { tithi:t, phase:'Panchami',  delta:{d: 0,f: 1,r: 0}, label:'growth phase — build and expand' }
  if (t <= 15) return { tithi:t, phase:'Dashami',   delta:{d: 2,f: 0,r: 0}, label:'peak phase — full energy for decisive action' }
  if (t <= 20) return { tithi:t, phase:'Declining', delta:{d: 0,f: 0,r: 1}, label:'declining phase — caution and review' }
  return              { tithi:t, phase:'Closing',   delta:{d:-1,f: 0,r: 0}, label:'closure phase — complete, do not begin' }
}

// ─── Moon cycle helpers ───────────────────────────────────────────────────────
function dayOfYear() {
  const n = new Date(), s = new Date(n.getFullYear(), 0, 0)
  return Math.floor((n - s) / 86400000)
}

export function getMoonCycle() { return dayOfYear() % 27 }

export function getNakshatraByIndex(mc) {
  return NAKSHATRAS[mc % 27]
}

export function getNakshatraByName(name) {
  if (!name) return null
  return NAKSHATRAS.find(n => n.name.toLowerCase() === name.toLowerCase()) || null
}

const ZODIAC_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                      'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']

export function getMoonSignFromCycle(mc) {
  return ZODIAC_NAMES[Math.floor(mc / 2.25) % 12]
}

const DASHA_PLANETS = ['Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus']
export function getDashaFromCycle(mc) { return DASHA_PLANETS[mc % 9] }

// ─── Lunar phase ──────────────────────────────────────────────────────────────
export function getLunarPhaseData() {
  const phase = dayOfYear() % 30
  if (phase <= 7)  return { name:'Waxing', d: 1, f: 0, r: 0, label:'waxing moon lifts initiative' }
  if (phase <= 15) return { name:'Full',   d: 2, f: 1, r: 0, label:'full moon amplifies clarity and focus' }
  if (phase <= 22) return { name:'Waning', d: 0, f: 0, r: 1, label:'waning moon raises caution' }
  return                   { name:'Dark',  d:-1, f:-1, r: 0, label:'dark moon calls for rest, not action' }
}

// ─── Vara (weekday planet) ────────────────────────────────────────────────────
const VARA_PLANETS = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']
export function getVaraData(planets) {
  const name = VARA_PLANETS[new Date().getDay()]
  const p    = (planets || []).find(x => x.name === name) || { d:0, c:0, r:0, f:0 }
  return { name, ...p }
}

// ─── Main Panchang fetch ──────────────────────────────────────────────────────
// REAL API INTEGRATION POINT:
// Replace the body of this function with a call to a real Panchang API
// (e.g. Prokerala, Drik Panchang, or Swiss Ephemeris endpoint).
// The function must return the same shape regardless of source.
export async function fetchPanchang(dateStr) {
  // Deterministic fallback (always returns consistent values)
  const mc      = getMoonCycle()
  const naksh   = getNakshatraByIndex(mc)
  const tithi   = tithiFromNumber((dayOfYear() % 30) + 1)
  const moonSign = getMoonSignFromCycle(mc)
  const dasha   = getDashaFromCycle(mc)
  const lunar   = getLunarPhaseData()

  return {
    nakshatra:    naksh,
    tithi,
    moonSign,
    dasha,
    lunarPhase:   lunar,
    moonCycle:    mc,
    source:       'deterministic'
  }
}
