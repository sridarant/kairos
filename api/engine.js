// ─── Base time slots ──────────────────────────────────────────────────────────
export const SLOTS = [
  { time: '07:00–09:00', decision: 1,  communication: 1,  risk: 0,  focus: 1  },
  { time: '09:00–11:00', decision: 2,  communication: 2,  risk: 0,  focus: 2  },
  { time: '11:00–13:00', decision: 1,  communication: 2,  risk: 0,  focus: 1  },
  { time: '13:00–15:00', decision: 0,  communication: -1, risk: -1, focus: 0  },
  { time: '15:00–17:00', decision: -1, communication: -2, risk: -1, focus: -1 },
  { time: '17:00–19:00', decision: -2, communication: -1, risk: -2, focus: -1 }
]

// ─── Layer 1: Planetary ───────────────────────────────────────────────────────
export const PLANETS = [
  { name: 'Sun',     decision:  1, communication:  0, risk:  0, focus:  0 },
  { name: 'Moon',    decision:  0, communication:  0, risk:  0, focus:  1 },
  { name: 'Mars',    decision:  1, communication:  0, risk:  2, focus:  0 },
  { name: 'Mercury', decision:  0, communication:  2, risk:  0, focus:  0 },
  { name: 'Jupiter', decision:  2, communication:  0, risk:  0, focus:  0 },
  { name: 'Venus',   decision:  0, communication:  1, risk:  0, focus:  0 },
  { name: 'Saturn',  decision: -1, communication:  0, risk:  1, focus:  0 }
]

export function getPlanet() {
  return PLANETS[new Date().getDay()]
}

export const PLANET_REASONING = {
  Sun:     'decisiveness is amplified today',
  Moon:    'intuition and focus are heightened',
  Mars:    'bold action is favoured but risk is elevated',
  Mercury: 'communication flows with unusual clarity',
  Jupiter: 'conditions are ripe for confident decisions',
  Venus:   'collaboration and dialogue are well-starred',
  Saturn:  'patience and structure are rewarded over impulse'
}

// ─── Cultural name maps ───────────────────────────────────────────────────────
export const PLANET_CULTURAL = {
  Sun:     'Surya / சூரியன்',
  Moon:    'Chandra / சந்திரன்',
  Mars:    'Kuja / செவ்வாய்',
  Mercury: 'Budha / புதன்',
  Jupiter: 'Guru / குரு',
  Venus:   'Shukra / சுக்கிரன்',
  Saturn:  'Shani / சனி'
}

const NAKSHATRAS = [
  { name: 'Ashwini',    cultural: 'அஸ்வினி / Ashwini',         label: 'a swift, initiating nakshatra' },
  { name: 'Bharani',    cultural: 'பரணி / Bharani',             label: 'a transformative, intense nakshatra' },
  { name: 'Krittika',   cultural: 'கிருத்திகை / Krittika',     label: 'a sharp, purifying nakshatra' },
  { name: 'Rohini',     cultural: 'ரோகிணி / Rohini',           label: 'a fertile, creative nakshatra' },
  { name: 'Mrigashira', cultural: 'மிருகசீரிடம் / Mrigashira', label: 'a curious, seeking nakshatra' },
  { name: 'Ardra',      cultural: 'திருவாதிரை / Ardra',        label: 'a stormy, transformative nakshatra' },
  { name: 'Punarvasu',  cultural: 'புனர்பூசம் / Punarvasu',    label: 'a returning, hopeful nakshatra' },
  { name: 'Pushya',     cultural: 'பூசம் / Pushya',             label: 'a nourishing, auspicious nakshatra' },
  { name: 'Ashlesha',   cultural: 'ஆயில்யம் / Ashlesha',       label: 'a penetrating, intuitive nakshatra' }
]

// ─── Full 27 Nakshatra system ─────────────────────────────────────────────────
const NAKSHATRAS_27 = [
  { name: 'Ashwini',    cultural: 'அஸ்வினி / Ashwini',         label: 'swift and initiating',      decision:  2, communication:  0, risk:  0, focus:  0 },
  { name: 'Bharani',    cultural: 'பரணி / Bharani',             label: 'transformative and intense', decision:  1, communication:  0, risk:  1, focus:  0 },
  { name: 'Krittika',   cultural: 'கிருத்திகை / Krittika',     label: 'sharp and purifying',        decision:  1, communication:  0, risk:  0, focus:  1 },
  { name: 'Rohini',     cultural: 'ரோகிணி / Rohini',           label: 'fertile and creative',       decision:  0, communication:  1, risk:  0, focus:  1 },
  { name: 'Mrigashira', cultural: 'மிருகசீரிடம் / Mrigashira', label: 'curious and seeking',        decision:  0, communication:  2, risk:  0, focus:  0 },
  { name: 'Ardra',      cultural: 'திருவாதிரை / Ardra',        label: 'stormy and instability',     decision:  0, communication:  0, risk:  2, focus:  0 },
  { name: 'Punarvasu',  cultural: 'புனர்பூசம் / Punarvasu',    label: 'returning and hopeful',      decision:  1, communication:  0, risk: -1, focus:  0 },
  { name: 'Pushya',     cultural: 'பூசம் / Pushya',             label: 'nourishing and stable',      decision:  1, communication:  0, risk: -1, focus:  1 },
  { name: 'Ashlesha',   cultural: 'ஆயில்யம் / Ashlesha',       label: 'penetrating and intuitive',  decision:  0, communication:  0, risk:  1, focus:  1 },
  { name: 'Magha',      cultural: 'மகம் / Magha',               label: 'regal and authoritative',    decision:  2, communication:  0, risk:  0, focus:  0 },
  { name: 'Purva Phalguni', cultural: 'பூரம் / Purva Phalguni', label: 'pleasurable and creative',  decision:  0, communication:  1, risk:  0, focus:  1 },
  { name: 'Uttara Phalguni', cultural: 'உத்திரம் / Uttara Phalguni', label: 'reliable and generous', decision: 1, communication:  1, risk:  0, focus:  0 },
  { name: 'Hasta',      cultural: 'அஸ்தம் / Hasta',             label: 'skilled and dexterous',      decision:  0, communication:  1, risk:  0, focus:  2 },
  { name: 'Chitra',     cultural: 'சித்திரை / Chitra',         label: 'brilliant and creative',     decision:  0, communication:  2, risk:  0, focus:  0 },
  { name: 'Swati',      cultural: 'சுவாதி / Swati',             label: 'independent and dispersive', decision:  0, communication:  1, risk:  1, focus: -1 },
  { name: 'Vishakha',   cultural: 'விசாகம் / Vishakha',         label: 'purposeful and ambitious',   decision:  2, communication:  0, risk:  0, focus:  0 },
  { name: 'Anuradha',   cultural: 'அனுஷம் / Anuradha',         label: 'devoted and cooperative',    decision:  0, communication:  1, risk:  0, focus:  1 },
  { name: 'Jyeshtha',   cultural: 'கேட்டை / Jyeshtha',         label: 'powerful and intense',       decision:  1, communication:  0, risk:  1, focus:  0 },
  { name: 'Mula',       cultural: 'மூலம் / Mula',               label: 'investigative and uprooting',decision: -1, communication:  0, risk:  2, focus:  0 },
  { name: 'Purva Ashadha', cultural: 'பூராடம் / Purva Ashadha', label: 'invincible and purifying',  decision:  1, communication:  0, risk:  0, focus:  1 },
  { name: 'Uttara Ashadha', cultural: 'உத்திராடம் / Uttara Ashadha', label: 'victorious and unwavering', decision: 2, communication: 0, risk: 0, focus: 0 },
  { name: 'Shravana',   cultural: 'திருவோணம் / Shravana',      label: 'listening and connecting',   decision:  0, communication:  2, risk:  0, focus:  1 },
  { name: 'Dhanishta',  cultural: 'அவிட்டம் / Dhanishta',      label: 'wealthy and musical',        decision:  0, communication:  1, risk:  0, focus:  1 },
  { name: 'Shatabhisha', cultural: 'சதயம் / Shatabhisha',      label: 'healing and secretive',      decision:  0, communication:  0, risk:  0, focus:  2 },
  { name: 'Purva Bhadra', cultural: 'பூரட்டாதி / Purva Bhadra', label: 'fierce and transforming',   decision:  1, communication:  0, risk:  1, focus:  0 },
  { name: 'Uttara Bhadra', cultural: 'உத்திரட்டாதி / Uttara Bhadra', label: 'deep and stabilising', decision: 0, communication:  0, risk:  0, focus:  2 },
  { name: 'Revati',     cultural: 'ரேவதி / Revati',             label: 'nurturing and transcendent', decision:  0, communication:  1, risk: -1, focus:  1 }
]

export function getNakshatra() {
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return NAKSHATRAS_27[doy % 27]
}

// Accepts an optional real name from /api/panchang; falls back to deterministic
export function getNakshatraByName(name) {
  if (!name) return getNakshatra()
  const found = NAKSHATRAS_27.find(n => n.name.toLowerCase() === name.toLowerCase())
  return found || getNakshatra()
}

// ─── Tithi (lunar day 1–30) ───────────────────────────────────────────────────
function tithiFromNumber(tithi) {
  let phase, delta, label
  if (tithi <= 5)       { phase = 'Pratipada'; delta = { decision:  1, focus:  0, risk:  0 }; label = 'early lunar phase — favourable for new beginnings' }
  else if (tithi <= 10) { phase = 'Panchami';  delta = { decision:  0, focus:  1, risk:  0 }; label = 'growth phase — build and expand' }
  else if (tithi <= 15) { phase = 'Dashami';   delta = { decision:  2, focus:  0, risk:  0 }; label = 'peak phase — full energy for decisive action' }
  else if (tithi <= 20) { phase = 'Amavasya approach'; delta = { decision: 0, focus: 0, risk: 1 }; label = 'declining phase — caution and review' }
  else                  { phase = 'Closing';   delta = { decision: -1, focus:  0, risk:  0 }; label = 'closure phase — complete, do not begin' }
  return { tithi, phase, delta, label }
}

export function getTithi() {
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return tithiFromNumber((doy % 30) + 1)
}

// Accepts an optional real tithi number from /api/panchang; falls back to deterministic
export function getTithiByNumber(num) {
  if (!num || isNaN(num)) return getTithi()
  const n = Math.max(1, Math.min(30, parseInt(num, 10)))
  return tithiFromNumber(n)
}

// ─── Vara (weekday planet mapping) ───────────────────────────────────────────
// Replaces generic Day Type — Vara is the authentic Panchang weekday ruler
const VARA_MAP = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn']

export function getVara() {
  const planetName = VARA_MAP[new Date().getDay()]
  const planet = PLANETS.find(p => p.name === planetName) || PLANETS[0]
  const cultural = PLANET_CULTURAL[planetName] || planetName
  return {
    name:     planetName,
    cultural: `${planetName} (${cultural})`,
    // Vara applies same dimension deltas as the planet itself
    decision:      planet.decision,
    communication: planet.communication,
    risk:          planet.risk,
    focus:         planet.focus,
    label: `${planetName} Vara — ${PLANET_REASONING[planetName] || 'a focused day'}`
  }
}

export function planetLabel(planetName) {
  const cultural = PLANET_CULTURAL[planetName] || planetName
  return `${planetName} (${cultural})`
}

// ─── Layer 2: Lunar phase (kept for compatibility) ────────────────────────────
export function getLunarPhase() {
  const phase = new Date().getDate() % 30
  if (phase <= 7)  return { name: 'Waxing', decision:  1, focus:  0, risk:  0, label: 'waxing moon lifts initiative' }
  if (phase <= 15) return { name: 'Full',   decision:  2, focus:  1, risk:  0, label: 'full moon amplifies clarity and focus' }
  if (phase <= 22) return { name: 'Waning', decision:  0, focus:  0, risk:  1, label: 'waning moon raises caution' }
  return            { name: 'Dark',   decision: -1, focus: -1, risk:  0, label: 'dark moon calls for rest, not action' }
}

// ─── Layer 3: Day type — replaced by Vara (Panchang weekday ruler) ───────────
// getDayType kept as alias so existing callers don't break; returns Vara instead
export function getDayType() {
  return getVara()
}

// ─── Layer 4: User trait model ────────────────────────────────────────────────
export function buildTraits(dob) {
  const dobDay = dob
    ? parseInt((dob.split('-')[2] || dob.split('/')[1] || '0'), 10)
    : new Date().getDate()
  return {
    decision_bias:       ((dobDay % 3) - 1),
    risk_tolerance:      (((dobDay + 1) % 3) - 1),
    communication_style: (dobDay % 2),
    focus_strength:      (((dobDay + 2) % 3) - 1)
  }
}

export function traitNarrative(traits) {
  const lines = []
  if (traits.decision_bias > 0)   lines.push('You tend to move quickly on decisions — lean into that today.')
  if (traits.decision_bias < 0)   lines.push('You may overthink decisions — trust the data in front of you.')
  if (traits.decision_bias === 0) lines.push('Your decision pace is balanced — timing matters more than speed.')
  if (traits.risk_tolerance > 0)   lines.push('Your risk tolerance is naturally higher — weigh upsides carefully.')
  if (traits.risk_tolerance < 0)   lines.push('You tend toward caution — that instinct is worth honouring today.')
  if (traits.risk_tolerance === 0) lines.push('Your risk instincts are moderate — follow the signals.')
  if (traits.communication_style > 0)  lines.push('Your communication strength is high — use it.')
  if (traits.communication_style === 0) lines.push('Communication takes more effort today — be deliberate.')
  if (traits.focus_strength > 0)   lines.push('Your focus tends to be strong — protect your deep work time.')
  if (traits.focus_strength < 0)   lines.push('Focus may be harder to hold today — work in shorter bursts.')
  if (traits.focus_strength === 0) lines.push('Focus is context-dependent for you — set the environment first.')
  return lines
}

// ─── Layer 5: Zodiac sign scoring ─────────────────────────────────────────────
const ZODIAC = [
  { name: 'Aries',       decision:  2, communication:  0, risk:  1, focus:  0 },
  { name: 'Taurus',      decision:  0, communication:  0, risk:  0, focus:  1 },
  { name: 'Gemini',      decision:  0, communication:  2, risk:  0, focus:  0 },
  { name: 'Cancer',      decision:  0, communication:  0, risk:  1, focus:  0 },
  { name: 'Leo',         decision:  1, communication:  0, risk:  0, focus:  0 },
  { name: 'Virgo',       decision:  0, communication:  0, risk:  0, focus:  2 },
  { name: 'Libra',       decision:  0, communication:  1, risk:  0, focus:  0 },
  { name: 'Scorpio',     decision:  0, communication:  0, risk:  2, focus:  0 },
  { name: 'Sagittarius', decision:  1, communication:  0, risk:  0, focus:  0 },
  { name: 'Capricorn',   decision:  0, communication:  0, risk:  0, focus:  1 },
  { name: 'Aquarius',    decision:  0, communication:  1, risk:  0, focus:  0 },
  { name: 'Pisces',      decision:  0, communication:  0, risk:  0, focus:  1 }
]

// ─── Zodiac cultural names ────────────────────────────────────────────────────
export const ZODIAC_CULTURAL = {
  Aries:       'Mesha / மேஷம்',
  Taurus:      'Rishabha / ரிஷபம்',
  Gemini:      'Mithuna / மிதுனம்',
  Cancer:      'Karka / கடகம்',
  Leo:         'Simha / சிம்மம்',
  Virgo:       'Kanya / கன்னி',
  Libra:       'Tula / துலாம்',
  Scorpio:     'Vrischika / விருச்சிகம்',
  Sagittarius: 'Dhanus / தனுசு',
  Capricorn:   'Makara / மகரம்',
  Aquarius:    'Kumbha / கும்பம்',
  Pisces:      'Meena / மீனம்'
}

// "Aries Lagna (Mesha / மேஷம்)"
export function lagnaLabel(signName) {
  if (!signName) return null
  const cultural = ZODIAC_CULTURAL[signName] || signName
  return `${signName} Lagna (${cultural})`
}

// "Gemini Rasi (Mithuna / மிதுனம்)"
export function rasiLabel(signName) {
  if (!signName) return null
  const cultural = ZODIAC_CULTURAL[signName] || signName
  return `${signName} Rasi (${cultural})`
}

// "Jupiter Dasha (Guru / குரு)" — uses existing PLANET_CULTURAL map
export function dashaLabel(planetName) {
  if (!planetName) return null
  const cultural = PLANET_CULTURAL[planetName] || planetName
  return `${planetName} Dasha (${cultural})`
}

// Lagna: derived from birth_time hour — stronger weight (factor 1.0)
// Moon sign: derived from dob day — moderate weight (factor 0.5, rounded)
export function computeLagna(birthTime) {
  if (!birthTime) return null
  const parts = birthTime.split(':')
  const hour  = parseInt(parts[0], 10)
  if (isNaN(hour)) return null
  const idx = Math.floor(hour / 2) % 12
  return { ...ZODIAC[idx], source: 'lagna' }
}

export function computeMoonSign(dob) {
  if (!dob) return null
  const dobDay = parseInt((dob.split('-')[2] || dob.split('/')[1] || '0'), 10)
  if (!dobDay) return null
  const idx = dobDay % 12
  return { ...ZODIAC[idx], source: 'moon' }
}

// Apply zodiac impact to a mutable dims object
// lagna: full weight; moon sign: half weight (rounded)
function applyZodiac(dims, zodiac, weight) {
  if (!zodiac) return
  dims.decision      += Math.round(zodiac.decision      * weight)
  dims.communication += Math.round(zodiac.communication * weight)
  dims.risk          += Math.round(zodiac.risk          * weight)
  dims.focus         += Math.round(zodiac.focus         * weight)
}

// ─── Layer 6: Planetary transit simulation ────────────────────────────────────
// Each planet moves through 12 signs at its own speed (days per full cycle).
// position = floor(dayOfYear / speed) % 12 → zodiac index
// This is deterministic: same date = same transit for all users.

const TRANSIT_SPEEDS = {
  Sun:     30,
  Moon:    2,
  Mars:    45,
  Mercury: 25,
  Jupiter: 365,
  Venus:   27,
  Saturn:  900
}

// Transit impact table: each planet's scoring in each zodiac sign.
// Only signs with notable impact are listed; others return null (no impact).
const TRANSIT_IMPACTS = {
  Sun: {
    Aries: { decision: 2, communication: 0, risk: 1, focus: 0 },
    Leo:   { decision: 2, communication: 0, risk: 0, focus: 0 }
  },
  Moon: {
    Cancer: { decision: 0, communication: 1, risk: 0, focus: 1 },
    Taurus: { decision: 0, communication: 0, risk: 0, focus: 2 }
  },
  Mars: {
    Aries:   { decision: 2, communication: 0, risk: 2, focus: 0 },
    Scorpio: { decision: 1, communication: 0, risk: 2, focus: 0 },
    Capricorn: { decision: 2, communication: 0, risk: 1, focus: 0 }
  },
  Mercury: {
    Gemini: { decision: 0, communication: 2, risk: 0, focus: 0 },
    Virgo:  { decision: 0, communication: 1, risk: 0, focus: 2 }
  },
  Jupiter: {
    Sagittarius: { decision: 2, communication: 0, risk: 0, focus: 0 },
    Pisces:      { decision: 0, communication: 1, risk: 0, focus: 1 },
    Cancer:      { decision: 1, communication: 0, risk: 0, focus: 1 }
  },
  Venus: {
    Taurus: { decision: 0, communication: 1, risk: 0, focus: 1 },
    Libra:  { decision: 0, communication: 2, risk: 0, focus: 0 },
    Pisces: { decision: 0, communication: 1, risk: -1, focus: 1 }
  },
  Saturn: {
    Capricorn: { decision:  1, communication: 0, risk:  0, focus: 2 },
    Aquarius:  { decision:  0, communication: 1, risk:  0, focus: 1 },
    Pisces:    { decision: -1, communication: 0, risk:  0, focus: 1 }
  }
}

function dayOfYear() {
  const now   = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  return Math.floor((now - start) / 86400000)
}

// Returns an array of active transits: { planet, sign, impact }
export function getTransits() {
  const doy    = dayOfYear()
  const ZODIAC_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                        'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
  const transits = []

  for (const [planet, speed] of Object.entries(TRANSIT_SPEEDS)) {
    const signIdx  = Math.floor(doy / speed) % 12
    const signName = ZODIAC_NAMES[signIdx]
    const impact   = TRANSIT_IMPACTS[planet]?.[signName] || null
    transits.push({ planet, sign: signName, impact })
  }
  return transits
}

// Aggregate all transit impacts into one delta object
export function aggregateTransits(transits, lagna, moonSign) {
  const agg = { decision: 0, communication: 0, risk: 0, focus: 0 }

  for (const t of transits) {
    if (!t.impact) continue

    let weight = 0.5  // base transit weight (moderate influence)

    // Personal interaction: transit sign matches Lagna → boost (harmonious)
    if (lagna && t.sign === lagna.name)     weight = 1.0
    // Transit sign matches Moon sign → moderate boost (emotional resonance)
    if (moonSign && t.sign === moonSign.name) weight = Math.max(weight, 0.75)

    agg.decision      += Math.round(t.impact.decision      * weight)
    agg.communication += Math.round(t.impact.communication * weight)
    agg.risk          += Math.round(t.impact.risk          * weight)
    agg.focus         += Math.round(t.impact.focus         * weight)
  }
  return agg
}

// Returns the single most notable transit (strongest non-null impact score)
export function dominantTransit(transits) {
  return transits
    .filter(t => t.impact)
    .sort((a, b) => {
      const scoreA = Object.values(a.impact).reduce((s, v) => s + Math.abs(v), 0)
      const scoreB = Object.values(b.impact).reduce((s, v) => s + Math.abs(v), 0)
      return scoreB - scoreA
    })[0] || null
}

// ─── Moon-cycle Nakshatra system ─────────────────────────────────────────────
// moonCycle = dayOfYear % 27 → nakshatra index
// moonSign  = zodiac[floor(moonCycle / 2.25)]  (27 nakshatras / 12 signs ≈ 2.25 per sign)
export function getMoonCycle() {
  const doy = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000)
  return doy % 27
}

export function getMoonNakshatra(moonCycle) {
  const mc = moonCycle !== undefined ? moonCycle : getMoonCycle()
  return NAKSHATRAS_27[mc]
}

export function getMoonSign(moonCycle) {
  const ZODIAC_NAMES = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo',
                        'Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
  const mc  = moonCycle !== undefined ? moonCycle : getMoonCycle()
  const idx = Math.floor(mc / 2.25) % 12
  return { name: ZODIAC_NAMES[idx], ...ZODIAC[idx] }
}

// ─── Moon-based Dasha ─────────────────────────────────────────────────────────
// dashaIndex = moonCycle % 9  → maps to classical 9-planet Vimshottari sequence
const DASHA_PLANETS = ['Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury','Ketu','Venus']

export function getMoonDasha(moonCycle) {
  const mc  = moonCycle !== undefined ? moonCycle : getMoonCycle()
  const idx = mc % 9
  return DASHA_PLANETS[idx]
}

// ─── Planetary interaction scoring layer ─────────────────────────────────────
// Interactions between Moon-derived values and Lagna/transit planet produce
// bonus/penalty deltas applied after all base layers.
const INTERACTIONS = {
  'Moon+Mercury':  { communication:  2, decision:  0, risk:  0, focus:  0 },
  'Moon+Jupiter':  { communication:  0, decision:  2, risk:  0, focus:  0 },
  'Moon+Venus':    { communication:  1, decision:  0, risk: -1, focus:  1 },
  'Moon+Saturn':   { communication:  0, decision: -1, risk:  1, focus:  1 },
  'Moon+Mars':     { communication:  0, decision:  1, risk:  2, focus: -1 },
  'Moon+Sun':      { communication:  0, decision:  1, risk:  0, focus:  1 },
  'Mars+Lagna':    { communication:  0, decision:  1, risk:  2, focus:  0 },
  'Mercury+Lagna': { communication:  2, decision:  0, risk:  0, focus:  1 },
  'Jupiter+Lagna': { communication:  0, decision:  2, risk: -1, focus:  0 },
  'Saturn+Lagna':  { communication:  0, decision: -1, risk:  1, focus:  2 },
  'Venus+Lagna':   { communication:  1, decision:  0, risk: -1, focus:  1 },
  'Sun+Lagna':     { communication:  0, decision:  2, risk:  0, focus:  0 },
}

export function computeInteraction(todayPlanetName, dashaPlanetName, lagnaSignName) {
  const agg = { decision: 0, communication: 0, risk: 0, focus: 0 }

  // Moon (today's lunar body) interacts with today's dasha planet
  const moonDashaKey = `Moon+${dashaPlanetName}`
  const moonDashaDelta = INTERACTIONS[moonDashaKey]
  if (moonDashaDelta) {
    agg.decision      += moonDashaDelta.decision
    agg.communication += moonDashaDelta.communication
    agg.risk          += moonDashaDelta.risk
    agg.focus         += moonDashaDelta.focus
  }

  // Today's planet (Vara) interacts with Lagna sign's ruling planet
  if (lagnaSignName) {
    const lagnaKey = `${todayPlanetName}+Lagna`
    const lagnaDelta = INTERACTIONS[lagnaKey]
    if (lagnaDelta) {
      agg.decision      += Math.round(lagnaDelta.decision      * 0.75)
      agg.communication += Math.round(lagnaDelta.communication * 0.75)
      agg.risk          += Math.round(lagnaDelta.risk          * 0.75)
      agg.focus         += Math.round(lagnaDelta.focus         * 0.75)
    }
  }

  return agg
}


  decision:      'decision-making clarity',
  communication: 'communication strength',
  focus:         'focus and concentration',
  risk:          'risk sensitivity'
}

// ─── User seed ────────────────────────────────────────────────────────────────
export function buildSeed(dob) {
  const dateNum = new Date().getDate()
  const dobDay  = dob ? parseInt((dob.split('-')[2] || dob.split('/')[1] || '0'), 10) : 0
  return dateNum + (dobDay || 0)
}

// ─── Profile type boosts ──────────────────────────────────────────────────────
function typeBoost(type) {
  if (!type) return { decision: 0, communication: 0, focus: 0 }
  const t = type.toLowerCase()
  if (t.includes('work') || t.includes('entrepreneur')) return { decision: 1, communication: 1, focus: 0 }
  if (t.includes('student'))  return { decision: 0, communication: 0, focus: 1 }
  if (t.includes('creative')) return { decision: 0, communication: 1, focus: 1 }
  return { decision: 0, communication: 0, focus: 0 }
}

// ─── Full stacked scoring (12 layers) ────────────────────────────────────────
// Order: base → vara → lunar → tithi → nakshatra(real/moon) → moon sign →
//        lagna → transit → user traits → profile type + jitter → interactions
export function scoredSlots(seed, planet, type, lunar, dayType, traits, lagna, moonSign, transitDelta, realTithi, realNaksh) {
  const p    = planet  || getPlanet()
  const vara = getVara()
  const lu   = lunar   || getLunarPhase()
  const tb   = typeBoost(type)
  const tr   = traits  || { decision_bias: 0, risk_tolerance: 0, communication_style: 0, focus_strength: 0 }
  const td   = transitDelta || { decision: 0, communication: 0, risk: 0, focus: 0 }
  const tth  = realTithi || getTithi()

  // Moon-cycle nakshatra (preferred over calendar fallback)
  const mc   = getMoonCycle()
  const nk   = realNaksh || getMoonNakshatra(mc)

  // Moon sign derived from moon cycle (overrides DOB-based moonSign if not provided)
  const moonSgn = moonSign || getMoonSign(mc)

  // Dasha from moon cycle + interaction delta
  const dasha    = getMoonDasha(mc)
  const interact = computeInteraction(p.name, dasha, lagna?.name || null)

  const decAdj  = (seed % 3) - 1
  const commAdj = seed % 2

  return SLOTS.map(s => {
    const dims = {
      decision:      s.decision      + p.decision      + vara.decision      + lu.decision  + tth.delta.decision + nk.decision      + tr.decision_bias      + decAdj  + tb.decision      + td.decision      + interact.decision,
      communication: s.communication + p.communication + vara.communication                                     + nk.communication + tr.communication_style + commAdj + tb.communication + td.communication + interact.communication,
      risk:          s.risk          + p.risk          + vara.risk          + lu.risk      + tth.delta.risk     + nk.risk          + tr.risk_tolerance                                   + td.risk          + interact.risk,
      focus:         s.focus         + p.focus         + vara.focus         + lu.focus     + tth.delta.focus    + nk.focus         + tr.focus_strength                + tb.focus         + td.focus         + interact.focus
    }
    applyZodiac(dims, lagna,    1.0)
    applyZodiac(dims, moonSgn,  0.5)
    const score = dims.decision + dims.communication + dims.focus - dims.risk
    return { ...s, ...dims, score }
  })
}

// ─── Dominant dimension ───────────────────────────────────────────────────────
export function dominantDimension(planet, lunar, traits, lagna, moonSign, transitDelta) {
  const p   = planet || getPlanet()
  const lu  = lunar  || getLunarPhase()
  const tr  = traits || { decision_bias: 0, risk_tolerance: 0, communication_style: 0, focus_strength: 0 }
  const td  = transitDelta || { decision: 0, communication: 0, risk: 0, focus: 0 }
  const mc  = getMoonCycle()
  const moonSgn  = moonSign || getMoonSign(mc)
  const dasha    = getMoonDasha(mc)
  const interact = computeInteraction(p.name, dasha, lagna?.name || null)

  const combined = {
    decision:      Math.abs(p.decision      + lu.decision  + tr.decision_bias      + (lagna?.decision || 0) + Math.round((moonSgn?.decision || 0) * 0.5)      + td.decision      + interact.decision),
    communication: Math.abs(p.communication               + tr.communication_style + (lagna?.communication || 0) + Math.round((moonSgn?.communication || 0) * 0.5) + td.communication + interact.communication),
    focus:         Math.abs(p.focus         + lu.focus     + tr.focus_strength     + (lagna?.focus || 0) + Math.round((moonSgn?.focus || 0) * 0.5)         + td.focus         + interact.focus),
    risk:          Math.abs(p.risk          + lu.risk      + tr.risk_tolerance     + (lagna?.risk || 0) + Math.round((moonSgn?.risk || 0) * 0.5)           + td.risk          + interact.risk)
  }
  return Object.entries(combined).sort((a, b) => b[1] - a[1])[0][0]
}

// ─── Confidence from score spread ─────────────────────────────────────────────
export function toConfidence(bestScore, worstScore) {
  const spread = bestScore - worstScore
  if (spread >= 14) return Math.min(92, 80 + Math.round((spread - 14) * 2))
  if (spread >= 8)  return Math.round(60 + ((spread - 8) / 6) * 15)
  return Math.max(20, Math.round((spread / 8) * 60))
}

// ─── Reasoning builder ────────────────────────────────────────────────────────
export function buildReasoning({ planet, lunar, dayType, dominant, ctx, dimScore, riskScore, decision, traits, lagna, moonSign, transitInfo, realTithi, realNaksh }) {
  const p    = planet  || getPlanet()
  const lu   = lunar   || getLunarPhase()
  const vara = getVara()
  const tth  = realTithi || getTithi()

  // Moon-cycle values
  const mc        = getMoonCycle()
  const nk        = realNaksh || getMoonNakshatra(mc)
  const moonSgn   = moonSign  || getMoonSign(mc)
  const dashaPlanet = getMoonDasha(mc)
  const interact  = computeInteraction(p.name, dashaPlanet, lagna?.name || null)

  const tr   = traits  || {}

  const planetInfluence = PLANET_REASONING[p.name]
  const dimHuman  = DIM_LABEL[dominant] || dominant
  const ctxHuman  = DIM_LABEL[ctx]      || ctx
  const riskFlag  = riskScore >= 1 ? 'elevated' : riskScore <= -1 ? 'reduced' : 'neutral'
  const dashaLabelStr = dashaLabel(dashaPlanet)

  const transitLabel = transitInfo
    ? `${transitInfo.planet} transiting ${transitInfo.sign} (${planetLabel(transitInfo.planet)})`
    : null

  // Interaction note for message building
  const interactNote = Object.values(interact).some(v => v !== 0)
    ? `Moon in ${nk.name} activates ${dashaPlanet} Dasha interaction`
    : null

  return {
    planet:            p.name,
    planetLabel:       planetLabel(p.name),
    planetInfluence,
    dashaLabel:        dashaLabelStr,
    dashaPlanet,
    // Vara
    varaName:          vara.name,
    varaCultural:      vara.cultural,
    varaLabel:         vara.label,
    // Tithi
    tithi:             tth.tithi,
    tithiPhase:        tth.phase,
    tithiLabel:        tth.label,
    // Moon-cycle Nakshatra
    nakshatraName:     nk.name,
    nakshatraCultural: nk.cultural,
    nakshatraLabel:    nk.label,
    // Moon sign (derived from moon cycle)
    moonSignName:      moonSgn?.name || null,
    moonSignCultural:  rasiLabel(moonSgn?.name),
    rasiLabel:         rasiLabel(moonSgn?.name),
    // Interaction
    interactNote,
    // Lunar phase
    lunarPhase:        lu.name,
    lunarLabel:        lu.label,
    // Birth Lagna
    lagnaSign:         lagna?.name    || null,
    lagnaLabel:        lagnaLabel(lagna?.name),
    // Transit
    transitLabel,
    transitPlanet:     transitInfo?.planet || null,
    transitSign:       transitInfo?.sign   || null,
    dominant,
    dimHuman,
    ctx,
    ctxHuman,
    dimScore,
    riskScore,
    riskFlag,
    alignedWithPlanet: dominant === ctx,
    decision,
    traits:            tr,
    traitLines:        traitNarrative(tr)
  }
}
  }
}
