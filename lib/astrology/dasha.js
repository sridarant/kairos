/**
 * /lib/astrology/dasha.js
 * Layer 2 — Interpretive: Vimshottari Dasha System
 *
 * The Vimshottari Dasha system assigns planetary periods based on the
 * Moon's nakshatra at birth. Total cycle = 120 years.
 *
 * Classical source: [BPHS Ch.46]
 *
 * PURE FUNCTIONS: inputs are birth date and Moon position.
 * Output is a timeline of planetary periods — no scoring here.
 */

// Vimshottari periods in years [BPHS Ch.46]
export const DASHA_PERIODS = {
  Ketu:    7,
  Venus:   20,
  Sun:     6,
  Moon:    10,
  Mars:    7,
  Rahu:    18,
  Jupiter: 16,
  Saturn:  19,
  Mercury: 17
}

// Sequence starting from Ketu
export const DASHA_SEQUENCE = ['Ketu','Venus','Sun','Moon','Mars','Rahu','Jupiter','Saturn','Mercury']

// Which nakshatra starts each dasha lord's cycle
const NAKSHATRA_LORDS = [
  'Ketu','Venus','Sun','Moon','Mars','Rahu',
  'Jupiter','Saturn','Mercury','Ketu','Venus','Sun',
  'Moon','Mars','Rahu','Jupiter','Saturn','Mercury',
  'Ketu','Venus','Sun','Moon','Mars','Rahu',
  'Jupiter','Saturn','Mercury'
]

/**
 * computeVimshottariDasha(moonNakshatraIndex, moonLongitudeInNakshatra, birthDate)
 *
 * @param {number} nakshatraIdx 0–26 (nakshatra index of Moon at birth)
 * @param {number} lonInNak     Moon's longitude within the nakshatra (0–13.333°)
 * @param {Date}   birthDate
 * @returns { currentLord, currentSub, elapsed, remaining, timeline }
 */
export function computeVimshottariDasha(nakshatraIdx, lonInNak, birthDate) {
  const NAK_SPAN      = 360 / 27          // 13.333° per nakshatra
  const TOTAL_YEARS   = 120

  // Fraction elapsed within the birth nakshatra
  const fracElapsed = lonInNak / NAK_SPAN

  // Starting dasha lord
  const birthLord  = NAKSHATRA_LORDS[nakshatraIdx]
  const birthIdx   = DASHA_SEQUENCE.indexOf(birthLord)
  const birthYears = DASHA_PERIODS[birthLord]

  // Years of birth dasha already elapsed at birth
  const yearsElapsedAtBirth = fracElapsed * birthYears

  // Build full dasha timeline from birth
  const now        = new Date()
  const ageMs      = now.getTime() - birthDate.getTime()
  const ageYears   = ageMs / (365.25 * 24 * 3600 * 1000)

  // Total years elapsed in the 120-year cycle at birth
  let cycleOffset = 0
  for (let i = 0; i < birthIdx; i++) {
    cycleOffset += DASHA_PERIODS[DASHA_SEQUENCE[i]]
  }
  const totalElapsed = cycleOffset + yearsElapsedAtBirth + ageYears

  // Position in 120-year cycle (modulo)
  const posInCycle = ((totalElapsed % TOTAL_YEARS) + TOTAL_YEARS) % TOTAL_YEARS

  // Find current mahadasha
  let cumulative = 0
  let currentLord = DASHA_SEQUENCE[0]
  let startOfCurrent = 0
  for (const lord of DASHA_SEQUENCE) {
    if (posInCycle < cumulative + DASHA_PERIODS[lord]) {
      currentLord    = lord
      startOfCurrent = cumulative
      break
    }
    cumulative += DASHA_PERIODS[lord]
  }

  const elapsedInMaha = posInCycle - startOfCurrent
  const remaining     = DASHA_PERIODS[currentLord] - elapsedInMaha

  // Antardasha (sub-period) within current Mahadasha
  const totalDays     = DASHA_PERIODS[currentLord] * 365.25
  const mahaSec       = DASHA_SEQUENCE.indexOf(currentLord)
  const elapsedDays   = elapsedInMaha * 365.25
  let antarCum = 0
  let currentSub = currentLord
  for (let k = 0; k < 9; k++) {
    const subLord   = DASHA_SEQUENCE[(mahaSec + k) % 9]
    const subDays   = (DASHA_PERIODS[subLord] / TOTAL_YEARS) * totalDays
    if (elapsedDays < antarCum + subDays) {
      currentSub = subLord
      break
    }
    antarCum += subDays
  }

  return {
    currentLord,        // Mahadasha lord
    currentSub,         // Antardasha lord
    elapsedYears: +elapsedInMaha.toFixed(2),
    remainingYears: +remaining.toFixed(2)
  }
}

/**
 * dashaFromToday(moonNakshatraIndex, moonLonInNak)
 * Simplified version when birth date is unknown — uses today's moon position
 * to estimate current dasha from a proxy cycle.
 */
export function dashaFromToday(moonNakshatraIndex) {
  // Without birth date, return the nakshatra lord as the effective dasha period
  return NAKSHATRA_LORDS[moonNakshatraIndex] || 'Jupiter'
}
