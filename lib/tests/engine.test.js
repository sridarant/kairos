/**
 * /lib/tests/engine.test.js — Determinism and correctness tests
 * Run: node lib/tests/engine.test.js
 */

import { toJD, computeGrahaPositions, computeTithi, nakshatra, computeLagna } from '../astronomy/ephemeris.js'
import { computeHouses, planetInHouse } from '../astronomy/houses.js'
import { dignityOf } from '../astrology/strength.js'
import { detectAllYogas } from '../astrology/yogas.js'
import { computeFunctionalRoles } from '../astrology/functional.js'
import { getDailyAstronomy, getBirthChart } from '../astronomy/index.js'
import { buildAstroContext } from '../astrology/index.js'
import { buildDecisionObject } from '../decision/engine.js'

let pass = 0, fail = 0
function assert(label, condition, got) {
  if (condition) { console.log(`  ✓ ${label}`); pass++ }
  else           { console.error(`  ✗ ${label}${got !== undefined ? ` (got: ${JSON.stringify(got)})` : ''}`); fail++ }
}

// Layer 1
console.log('\n─── Layer 1: Astronomy ───')
const j2000 = toJD(2000, 1, 1, 12)
assert('JD for J2000.0', Math.abs(j2000 - 2451545.0) < 0.001, j2000)
const jd1 = toJD(2026, 8, 4, 6)
const pos1 = computeGrahaPositions(jd1)
const pos2 = computeGrahaPositions(jd1)
assert('Deterministic Sun longitude', pos1.Sun.sidLon === pos2.Sun.sidLon)
assert('Sun in Cancer/Leo Aug 2026', ['Cancer','Leo'].includes(pos1.Sun.signName), pos1.Sun.signName)
const moonNak = nakshatra(pos1.Moon.sidLon)
assert('Nakshatra index 0–26', moonNak.index >= 0 && moonNak.index < 27)
assert('Nakshatra pada 1–4', moonNak.pada >= 1 && moonNak.pada <= 4)
const tithi = computeTithi(pos1.Sun.sidLon, pos1.Moon.sidLon)
assert('Tithi 1–30', tithi.number >= 1 && tithi.number <= 30)
assert('Tithi phase valid', ['Shukla','Krishna'].includes(tithi.phase))
const lagna = computeLagna(jd1)
const houses = computeHouses(lagna.sidLon)
assert('12 houses', houses.length === 12)
assert('House 1 = Lagna sign', houses[0].sign === lagna.sign)
assert('planetInHouse at lagna = 1', planetInHouse(lagna.sidLon, lagna.sidLon) === 1)

// Layer 2
console.log('\n─── Layer 2: Astrology ───')
assert('Sun exalted Aries', dignityOf('Sun','Aries',10).dignity === 'exalted')
assert('Saturn debilitated Aries', dignityOf('Saturn','Aries',15).dignity === 'debilitated')
assert('Venus debilitated Virgo', dignityOf('Venus','Virgo',5).dignity === 'debilitated')
const roles = computeFunctionalRoles(0)
assert('Mars Yogakaraka for Aries', roles.Mars?.isYogakaraka === true)
assert('Saturn malefic for Aries', roles.Saturn?.role === 'functional_malefic')
const mH = { Moon:1, Jupiter:4, Sun:5, Mercury:5, Mars:8, Venus:2, Saturn:9, Rahu:12, Ketu:6 }
const mG = { Sun:{sidLon:150,signName:'Virgo',sign:5,longitude:0}, Moon:{sidLon:0,signName:'Aries',sign:0,longitude:0}, Mercury:{sidLon:155,signName:'Virgo',sign:5,longitude:5}, Venus:{sidLon:60,signName:'Gemini',sign:2,longitude:0}, Mars:{sidLon:230,signName:'Scorpio',sign:7,longitude:20}, Jupiter:{sidLon:90,signName:'Cancer',sign:3,longitude:0}, Saturn:{sidLon:260,signName:'Sagittarius',sign:8,longitude:20}, Rahu:{sidLon:330,signName:'Pisces',sign:11,longitude:0}, Ketu:{sidLon:150,signName:'Virgo',sign:5,longitude:0} }
const yogas = detectAllYogas(mG, mH, 0)
assert('Gaja Kesari detected', !!yogas.find(y => y.name === 'Gaja Kesari Yoga'), yogas.map(y=>y.name))

// Layer 3
console.log('\n─── Layer 3: Decision Engine ───')
const da = getDailyAstronomy(new Date(2026, 7, 4, 9, 0, 0))
const bc = getBirthChart('15-03-1990', '06:30')
const ctx1 = buildAstroContext(da, bc, '15-03-1990', 0)
const ctx2 = buildAstroContext(da, bc, '15-03-1990', 0)
const d1 = buildDecisionObject(ctx1, 5, 0)
const d2 = buildDecisionObject(ctx2, 5, 0)
assert('Decision deterministic', d1.decision === d2.decision)
assert('GoldenWindow deterministic', d1.goldenWindow === d2.goldenWindow)
assert('Confidence valid', ['High','Medium','Low'].includes(d1.confidence))
assert('Stars 1–5', d1.stars >= 1 && d1.stars <= 5)
assert('Decision valid', ['DO','WAIT','AVOID'].includes(d1.decision))
assert('Category scores present', Object.keys(d1.categoryScores || {}).length >= 5)
assert('Timeline 6+ events', (d1.timeline || []).length >= 6)

console.log(`\n─── ${pass} passed, ${fail} failed ───\n`)
if (fail > 0) process.exitCode = 1
