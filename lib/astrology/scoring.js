/**
 * /lib/astrology/scoring.js
 * Layer 2 — Interpretive: Timing Score Rules
 *
 * SEPARATES astrological interpretation from astronomical facts.
 * Takes outputs from lib/astronomy/ and lib/astrology/strength.js
 * and returns dimension deltas (d/c/f/r) and explanations.
 *
 * Dimension key:
 *   d = decision-making  c = communication  f = focus  r = risk (inverted: high r = bad)
 *
 * Each rule is documented with classical justification.
 */

/**
 * tithiEffect(tithiName, tithiPhase)
 *
 * Tithi governs daily activity suitability. [Muhurtha Chintamani, BPHS Ch.93]
 * Shukla Panchami, Dashami, Purnima = auspicious (favorable for decisions).
 * Ashtami, Chaturdashi = inauspicious.
 * Krishna period gradually increases caution.
 */
export function tithiEffect(tithiName, tithiPhase) {
  const AUSPICIOUS = ['Pratipada','Dwitiya','Tritiya','Panchami','Saptami',
                      'Dashami','Ekadashi','Dwadashi','Purnima']
  const INAUSPICIOUS = ['Ashtami','Chaturdashi','Amavasya']

  if (INAUSPICIOUS.includes(tithiName)) {
    return { d:-1, c:0, r:1, f:0, label:'Inauspicious tithi — exercise caution and patience.' }
  }
  if (AUSPICIOUS.includes(tithiName)) {
    const isPeak = ['Panchami','Dashami','Purnima'].includes(tithiName)
    return { d: isPeak ? 2 : 1, c:0, r:-1, f: isPeak ? 1 : 0,
             label: isPeak ? 'Peak auspicious tithi — excellent for important actions.'
                           : 'Auspicious tithi — favourable conditions.' }
  }
  const isKrishna = tithiPhase === 'Krishna'
  return { d:0, c:0, r: isKrishna ? 1 : 0, f: isKrishna ? -1 : 0,
           label:'Neutral tithi — proceed with normal awareness.' }
}

/**
 * nakshatraEffect(nakshatraName)
 *
 * Each nakshatra has a classical nature (Tikshna/sharp, Mridu/soft,
 * Sthira/fixed, Chara/moveable, Ugra/fierce, Mishra/mixed). [BPHS Ch.3]
 *
 * Returns dimension deltas appropriate for timing decisions.
 */
const NAKSHATRA_NATURE = {
  Ashwini:         { type:'Kshipra',  d:2, c:0, r:0, f:0,  label:'swift and initiating — excellent for new ventures' },
  Bharani:         { type:'Ugra',     d:0, c:0, r:2, f:0,  label:'fierce — intense transformation, elevated risk' },
  Krittika:        { type:'Tikshna',  d:1, c:0, r:1, f:0,  label:'sharp — cutting clarity, purifying action' },
  Rohini:          { type:'Sthira',   d:0, c:1, r:0, f:1,  label:'stable and fertile — growth, creativity, steadiness' },
  Mrigashira:      { type:'Mridu',    d:0, c:2, r:0, f:0,  label:'gentle — communication and exploration shine' },
  Ardra:           { type:'Tikshna',  d:0, c:0, r:2, f:0,  label:'sharp storm — turbulence and deep change' },
  Punarvasu:       { type:'Chara',    d:1, c:0, r:-1, f:0, label:'moveable and hopeful — renewal and restoration' },
  Pushya:          { type:'Laghu',    d:1, c:0, r:-1, f:1, label:'light and nourishing — the most auspicious nakshatra for ventures' },
  Ashlesha:        { type:'Tikshna',  d:0, c:0, r:1, f:1,  label:'sharp and penetrating — deep insight, complex situations' },
  Magha:           { type:'Ugra',     d:2, c:0, r:0, f:0,  label:'fierce and royal — authority and bold leadership' },
  'Purva Phalguni':{ type:'Ugra',     d:0, c:1, r:0, f:1,  label:'fierce creativity — artistic, pleasure-oriented' },
  'Uttara Phalguni':{ type:'Sthira',  d:1, c:1, r:0, f:0,  label:'stable and generous — sustained partnership' },
  Hasta:           { type:'Laghu',    d:0, c:1, r:0, f:2,  label:'light and skilled — dexterous, practical work excels' },
  Chitra:          { type:'Tikshna',  d:0, c:2, r:0, f:0,  label:'sharp brilliance — creative communication peaks' },
  Swati:           { type:'Chara',    d:0, c:1, r:1, f:-1, label:'moveable wind — independent, scattered energy' },
  Vishakha:        { type:'Mishra',   d:2, c:0, r:0, f:0,  label:'mixed — sharp goal-pursuit, ambitious focus' },
  Anuradha:        { type:'Mridu',    d:0, c:1, r:0, f:1,  label:'gentle devotion — cooperative effort and loyalty' },
  Jyeshtha:        { type:'Tikshna',  d:1, c:0, r:1, f:0,  label:'sharp elder — protective power, intense situations' },
  Mula:            { type:'Tikshna',  d:-1, c:0, r:2, f:0, label:'sharp and uprooting — investigate but avoid new starts' },
  'Purva Ashadha': { type:'Ugra',     d:1, c:0, r:0, f:1,  label:'fierce purification — confidence and cleansing' },
  'Uttara Ashadha':{ type:'Sthira',   d:2, c:0, r:0, f:0,  label:'stable victory — lasting achievement and persistence' },
  Shravana:        { type:'Chara',    d:0, c:2, r:0, f:1,  label:'moveable — listening and learning strongly favoured' },
  Dhanishta:       { type:'Chara',    d:0, c:1, r:0, f:1,  label:'moveable and prosperous — rhythm and coordination' },
  Shatabhisha:     { type:'Chara',    d:0, c:0, r:0, f:2,  label:'moveable — healing research, solitary deep work' },
  'Purva Bhadra':  { type:'Ugra',     d:1, c:0, r:1, f:0,  label:'fierce transformation — intense focus, watch aggression' },
  'Uttara Bhadra': { type:'Sthira',   d:0, c:0, r:0, f:2,  label:'stable depth — spiritual grounding, steady endurance' },
  Revati:          { type:'Mridu',    d:0, c:1, r:-1, f:1, label:'gentle completion — compassion and transcendence' }
}

export function nakshatraEffect(nakshatraName) {
  const n = NAKSHATRA_NATURE[nakshatraName]
  if (!n) return { d:0, c:0, r:0, f:0, label:'Nakshatra influence neutral.' }
  const { type, d, c, r, f, label } = n
  return { d, c, r, f, label, type }
}

/**
 * planetaryEffect(planetName, dignity, house)
 *
 * How a planet's current position affects the four dimensions.
 * Strength (from dignity) modulates the delta. [BPHS]
 */
const BASE_PLANET_EFFECT = {
  Sun:     { d:1,  c:0,  r:0,  f:0 },
  Moon:    { d:0,  c:0,  r:0,  f:1 },
  Mars:    { d:1,  c:0,  r:2,  f:0 },
  Mercury: { d:0,  c:2,  r:0,  f:0 },
  Jupiter: { d:2,  c:0,  r:-1, f:0 },
  Venus:   { d:0,  c:1,  r:-1, f:1 },
  Saturn:  { d:-1, c:0,  r:1,  f:1 },
  Rahu:    { d:1,  c:1,  r:1,  f:-1 },
  Ketu:    { d:-1, c:0,  r:0,  f:2  }
}

// House-based modifiers: which houses amplify or suppress planetary effects
const HOUSE_MODIFIER = {
  1:{ mult:1.2 }, 4:{ mult:0.8 }, 5:{ mult:1.2 }, 7:{ mult:0.9 },
  9:{ mult:1.3 }, 10:{ mult:1.2 }, 11:{ mult:1.0 }, 6:{ mult:0.7 },
  8:{ mult:0.6 }, 12:{ mult:0.5 }
}

export function planetaryEffect(planetName, dignityScore = 3, house = null) {
  const base  = BASE_PLANET_EFFECT[planetName]
  if (!base) return { d:0, c:0, r:0, f:0 }
  // Scale by dignity: 1=debilitated (0.4×), 3=neutral (1×), 5=exalted (1.6×)
  const scale = 0.4 + (dignityScore - 1) * 0.3
  const hmult = (house && HOUSE_MODIFIER[house]?.mult) || 1.0
  const m     = scale * hmult
  return {
    d: +(base.d * m).toFixed(3),
    c: +(base.c * m).toFixed(3),
    r: +(base.r * m).toFixed(3),
    f: +(base.f * m).toFixed(3)
  }
}

/**
 * yogaEffect(yoga)
 *
 * Converts yoga detection output to dimension deltas.
 * Kept separate so yoga detection rules (lib/astrology/yogas.js) and
 * scoring rules (here) can evolve independently.
 */
const YOGA_EFFECTS = {
  'Raja Yoga':   { d:2,  c:1, r:-1, f:0, note:'Raja Yoga — authority and success are strongly supported.' },
  'Dhana Yoga':  { d:1,  c:0, r:-1, f:0, note:'Dhana Yoga — material decisions and finances are favoured.' },
  'Rajju Yoga':  { d:1,  c:0, r:0,  f:0, note:'Rajju Yoga — adaptability and versatility are heightened.' },
  'Musala Yoga': { d:0,  c:0, r:-1, f:2, note:'Musala Yoga — stable, determined focus is available.' },
  'Nala Yoga':   { d:0,  c:1, r:1,  f:0, note:'Nala Yoga — versatile but scattered — discipline required.' },
  'Graha Yuddha':{ d:-1, c:0, r:2,  f:0, note:'Planetary war — conflict energy is heightened; avoid confrontation.' }
}

export function yogaEffect(yoga) {
  return YOGA_EFFECTS[yoga.name] || { d:0, c:0, r:0, f:0, note:'Yoga influence noted.' }
}
