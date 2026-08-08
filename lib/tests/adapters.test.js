/**
 * /lib/tests/adapters.test.js
 * Adapter layer + DTO validation tests.
 * Run: node lib/tests/adapters.test.js
 *
 * Covers: all 5 adapters + validation + MemberAdapter
 * Includes regression tests for every production bug found in v27-v30.
 */

import { adaptRecommendation, adaptRecommendations } from '../adapters/RecommendationAdapter.js'
import { adaptDailyBrief, adaptTomorrowPreview }     from '../adapters/DailyBriefAdapter.js'
import { adaptTimeline, adaptTimelineEntry }          from '../adapters/TimelineAdapter.js'
import { adaptWeeklyPlan, adaptOpportunities }       from '../adapters/WeeklyPlanAdapter.js'
import { adaptMember, adaptMembers }                 from '../adapters/MemberAdapter.js'
import {
  validateRecommendation, validateDailyBrief,
  validateTimelineEntry, validateWeeklyPlan,
  validateRecommendations
} from '../adapters/validate.js'

let pass = 0, fail = 0
function assert(label, condition, got) {
  if (condition) { console.log(`  ✓ ${label}`); pass++ }
  else { console.error(`  ✗ ${label}${got !== undefined ? ` (got: ${JSON.stringify(got)})` : ''}`); fail++ }
}

// ─── RecommendationAdapter ────────────────────────────────────────────────────
console.log('\n─── RecommendationAdapter ───')

const rec1 = adaptRecommendation({ category:'career', label:'Career', action:'Begin project.', reason:'Mercury supports planning.', bestTime:'09:00–11:00', confidence:'High', stars:4, quality:'supportive' })
assert('title from label',              rec1.title === 'Career', rec1.title)
assert('summary from action',           rec1.summary === 'Begin project.', rec1.summary)
assert('bestWindow from bestTime',      rec1.bestWindow === '09:00–11:00', rec1.bestWindow)
assert('reasoning from reason',         rec1.reasoning === 'Mercury supports planning.', rec1.reasoning)
assert('icon defaulted for career',     rec1.icon === '💼', rec1.icon)
assert('feedbackStatus pending',        rec1.feedbackStatus === 'pending', rec1.feedbackStatus)
assert('quality preserved',             rec1.quality === 'supportive', rec1.quality)
assert('stars preserved',               rec1.stars === 4, rec1.stars)

// REGRESSION v27: snake_case best_time was silently lost
const rec2 = adaptRecommendation({ category:'finance', label:'Finance', action:'Review budget.', reason:'Low risk period.', best_time:'11:00–13:00', confidence:'Medium', stars:3, quality:'neutral' })
assert('REGRESSION: bestWindow from best_time', rec2.bestWindow === '11:00–13:00', rec2.bestWindow)

assert('null input → null',             adaptRecommendation(null) === null)

const rec4 = adaptRecommendation({ category:'health', label:'Health', action:'Rest.', confidence:'SuperHigh', stars:3 })
assert('invalid confidence → Medium',   rec4.confidence === 'Medium', rec4.confidence)

const rec5 = adaptRecommendation({ category:'travel', label:'Travel', action:'Plan trip.', confidence:'Low', stars:8 })
assert('stars > 5 → capped (via overallStars)', rec5.stars <= 5)

const rec7 = adaptRecommendation({ category:'learning', summary:'Study now.', confidence:'High', stars:4 })
assert('summary fallback when no action', rec7.summary === 'Study now.', rec7.summary)

const batch = adaptRecommendations([rec1, null, rec2, undefined])
assert('batch filters null/undefined',  batch.length === 2, batch.length)

const recNoId = adaptRecommendation({ category:'health', label:'Health', action:'Walk.', confidence:'High', stars:3 })
assert('id auto-generated',             typeof recNoId.id === 'string' && recNoId.id.length > 0, recNoId.id)

// overallStars capping
const rec8 = adaptRecommendation({ category:'career', label:'Career', action:'Work.', confidence:'High', stars:5, quality:'supportive' }, 2)
assert('stars capped by overallStars',  rec8.stars <= 3, rec8.stars)

// ─── TimelineAdapter ──────────────────────────────────────────────────────────
console.log('\n─── TimelineAdapter ───')

const t1 = adaptTimelineEntry({ time:'09:00', end:'11:00', quality:'Excellent', label:'Planning', score:2.1 })
assert('startTime from time',           t1.startTime === '09:00', t1.startTime)
assert('endTime from end',              t1.endTime === '11:00', t1.endTime)
assert('REGRESSION: description from label', t1.description === 'Planning', t1.description)
assert('confidence High for Excellent', t1.confidence === 'High', t1.confidence)

const t2 = adaptTimelineEntry({ time:'13:00', quality:'Low energy', label:'Rest period', score:-1.5 })
assert('Low energy → Low confidence',   t2.confidence === 'Low', t2.confidence)

const t3 = adaptTimelineEntry({ time:'15:00', quality:'Unknown', label:'Work', score:0 })
assert('unknown quality → Moderate',    t3.quality === 'Moderate', t3.quality)

const timeline = adaptTimeline([{ time:'09:00', end:'10:00', quality:'Good', label:'Work' }, null, undefined])
assert('adaptTimeline filters nulls',   timeline.length === 1, timeline.length)
assert('adaptTimeline([]) → []',        adaptTimeline([]).length === 0)

// ─── DailyBriefAdapter ────────────────────────────────────────────────────────
console.log('\n─── DailyBriefAdapter ───')

const rawBrief = {
  theme:'Career Focus', outlook:'Positive', bestWindow:'09:00–11:00', avoidWindow:'17:00–19:00',
  confidence:'High', decisionOfDay:'Begin your most important project now.',
  opportunities: [{ category:'career', icon:'💼', label:'Career', advice:'Great timing.', confidence:'High', bestTime:'09:00–11:00' }],
  cautions:      [{ category:'finance', icon:'💰', label:'Finance', advice:'Defer large moves.', confidence:'Low' }],
  familyBrief:   { energy:'High', bestWindow:'18:00–20:00', activities:['Dinner'], avoid:[], confidence:'High', memberCount:2 },
  tomorrowPreview: { label:'Tomorrow', stars:4, summary:'Good day.', confidence:'High', days_ahead:1 }
}
const daily = { golden_window:'09:00–11:00', members:[{ stars:4, confidence:'High', summary:'Do work.' }] }
const brief  = adaptDailyBrief(rawBrief, daily)

assert('brief.theme',                   brief.theme === 'Career Focus', brief.theme)
assert('brief.outlook',                 brief.outlook === 'Positive', brief.outlook)
assert('brief.bestWindow',              brief.bestWindow === '09:00–11:00', brief.bestWindow)
assert('brief.opportunities adapted',   brief.opportunities.length === 1)
assert('brief.cautions adapted',        brief.cautions.length === 1)
assert('brief.familyBrief.energy',      brief.familyBrief?.energy === 'High')
assert('brief.tomorrowPreview.daysAhead', brief.tomorrowPreview?.daysAhead === 1)
assert('brief.summary from decisionOfDay', brief.summary === 'Begin your most important project now.')

// REGRESSION v27: daily.why didn't exist
const briefNoWhy = adaptDailyBrief(null, { golden_window:'10:00', focus:'Learning', members:[{ stars:3, confidence:'Medium', summary:'Steady day.' }] })
assert('REGRESSION: summary from member not daily.why', briefNoWhy?.summary === 'Steady day.')
assert('both null → null',              adaptDailyBrief(null, null) === null)

const tp = adaptTomorrowPreview({ label:'Tomorrow', stars:4, summary:'Good.', confidence:'High', days_ahead:1 })
assert('tomorrowPreview.daysAhead',     tp.daysAhead === 1)
assert('tomorrowPreview null → null',   adaptTomorrowPreview(null) === null)

// ─── WeeklyPlanAdapter ────────────────────────────────────────────────────────
console.log('\n─── WeeklyPlanAdapter ───')

const rawWeekly = {
  categories:[{ category:'career', icon:'💼', label:'Career', bestDay:'Monday', bestDate:'2026-08-10', daysAhead:5, confidence:'High', summary:'Great day.', stars:4 }],
  days:[{ label:'Today', date:'2026-08-05', days_ahead:0, stars:4, confidence:72, summary:'Favourable' }],
  topDay:{ label:'Friday', date:'2026-08-09', days_ahead:4, stars:5, confidence:85, summary:'Excellent' },
  challenging:{ label:'Wednesday', date:'2026-08-07', days_ahead:2, stars:2, confidence:35, summary:'Rest' }
}
const wp = adaptWeeklyPlan(rawWeekly)
assert('categories adapted',            wp.categories.length === 1)
// REGRESSION v27: days_ahead (snake) wasn't mapped to daysAhead (camel)
assert('REGRESSION: daysAhead from days_ahead', wp.days[0].daysAhead === 0, wp.days[0].daysAhead)
assert('challenging.label',             wp.challenging?.label === 'Wednesday')
assert('null weeklyPlan → null',        adaptWeeklyPlan(null) === null)

const opp = adaptOpportunities([{ label:'Monday', title:'Strong window', summary:'Good.', confidence:'High', daysAhead:5, stars:4 }])
assert('opportunities adapted',         opp.length === 1)
assert('opportunity.daysAhead',         opp[0].daysAhead === 5)
assert('adaptOpportunities([]) → []',   adaptOpportunities([]).length === 0)
assert('adaptOpportunities(null) → []', adaptOpportunities(null).length === 0)

// ─── MemberAdapter ────────────────────────────────────────────────────────────
console.log('\n─── MemberAdapter ───')

const rawMember = {
  name: 'Sridaran',
  decision: 'DO',
  confidence: 'High',
  stars: 4,
  focus: 'Career & Decision Making',
  golden_window: '09:00–11:00',
  avoid_window:  '17:00–19:00',
  summary: 'Strong day for important work.',
  recommendations: { top: [], rest: [] },
  timeline: [{ time:'09:00', end:'11:00', quality:'Excellent', label:'Deep work' }],
  dasha: null,
  yoga: null
}

const m1 = adaptMember(rawMember)
assert('name preserved',                m1.name === 'Sridaran', m1.name)
assert('decision preserved',            m1.decision === 'DO', m1.decision)
assert('stars preserved',               m1.stars === 4, m1.stars)
assert('goldenWindow from golden_window', m1.goldenWindow === '09:00–11:00', m1.goldenWindow)
assert('avoidWindow from avoid_window',  m1.avoidWindow === '17:00–19:00', m1.avoidWindow)
assert('no snake_case in output',       !('golden_window' in m1))
assert('no snake_case avoid in output', !('avoid_window' in m1))
assert('timeline preserved',            m1.timeline.length === 1)

assert('null member → null',            adaptMember(null) === null)
assert('member without name → null',    adaptMember({ stars:3 }) === null)
assert('invalid decision → WAIT',       adaptMember({ name:'X', decision:'MAYBE' }).decision === 'WAIT')
assert('invalid confidence → Medium',   adaptMember({ name:'X', confidence:'SuperHigh' }).confidence === 'Medium')

const members = adaptMembers([rawMember, null, { name:'Kalpana', decision:'WAIT', confidence:'Medium', stars:3, golden_window:'11:00–13:00', avoid_window:'15:00–17:00' }])
assert('adaptMembers filters nulls',    members.length === 2)
assert('second member goldenWindow',    members[1].goldenWindow === '11:00–13:00', members[1].goldenWindow)
assert('adaptMembers([]) → []',         adaptMembers([]).length === 0)
assert('adaptMembers(null) → []',       adaptMembers(null).length === 0)

// ─── Validation ───────────────────────────────────────────────────────────────
console.log('\n─── Validation ───')

assert('valid rec passes',              validateRecommendation(rec1).valid === true)
assert('incomplete rec fails',          validateRecommendation({ category:'x' }).valid === false)
assert('null rec fails',                validateRecommendation(null).valid === false)
assert('valid brief passes',            validateDailyBrief(brief).valid === true)
assert('null brief fails',              validateDailyBrief(null).valid === false)
assert('valid timeline entry passes',   validateTimelineEntry(t1).valid === true)
assert('empty timeline entry fails',    validateTimelineEntry({}).valid === false)

const batchMixed = [rec1, { category:'x' }, null, rec2]
const batchValid  = validateRecommendations(batchMixed)
assert('batch validation keeps valid',  batchValid.length === 2, batchValid.length)
assert('valid weeklyPlan passes',       validateWeeklyPlan(wp).valid === true)
assert('null weeklyPlan fails',         validateWeeklyPlan(null).valid === false)

console.log(`\n─── ${pass} passed, ${fail} failed ───\n`)
if (fail > 0) process.exitCode = 1
