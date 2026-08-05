/**
 * /lib/tests/adapters.test.js
 * Tests for the adapter layer and DTO validation.
 * Run: node lib/tests/adapters.test.js
 */

import { adaptRecommendation, adaptRecommendations } from '../adapters/RecommendationAdapter.js'
import { adaptDailyBrief, adaptTomorrowPreview }     from '../adapters/DailyBriefAdapter.js'
import { adaptTimeline, adaptTimelineEntry }          from '../adapters/TimelineAdapter.js'
import { adaptWeeklyPlan, adaptOpportunities }       from '../adapters/WeeklyPlanAdapter.js'
import { validateRecommendation, validateDailyBrief, validateTimelineEntry } from '../adapters/validate.js'

let pass = 0, fail = 0
function assert(label, condition, got) {
  if (condition) { console.log(`  ✓ ${label}`); pass++ }
  else { console.error(`  ✗ ${label}${got !== undefined ? ` (got: ${JSON.stringify(got)})` : ''}`); fail++ }
}

console.log('\n─── RecommendationAdapter ───')
// Normal case
const rec1 = adaptRecommendation({ category:'career', label:'Career', action:'Begin project.', reason:'Mercury supports planning.', bestTime:'09:00–11:00', confidence:'High', stars:4, quality:'supportive' })
assert('title populated from label',           rec1.title === 'Career', rec1.title)
assert('summary from action',                  rec1.summary === 'Begin project.', rec1.summary)
assert('bestWindow from bestTime',             rec1.bestWindow === '09:00–11:00', rec1.bestWindow)
assert('reasoning from reason',                rec1.reasoning === 'Mercury supports planning.', rec1.reasoning)
assert('icon defaulted for career',            rec1.icon === '💼', rec1.icon)
assert('feedbackStatus defaults to pending',   rec1.feedbackStatus === 'pending', rec1.feedbackStatus)

// snake_case input
const rec2 = adaptRecommendation({ category:'finance', label:'Finance', action:'Review budget.', reason:'Low risk period.', best_time:'11:00–13:00', confidence:'Medium', stars:3, quality:'neutral' })
assert('bestWindow from best_time fallback',   rec2.bestWindow === '11:00–13:00', rec2.bestWindow)

// Null input
const rec3 = adaptRecommendation(null)
assert('null input returns null',              rec3 === null)

// Invalid confidence
const rec4 = adaptRecommendation({ category:'health', label:'Health', action:'Rest.', confidence:'SuperHigh', stars:3 })
assert('invalid confidence defaults to Medium', rec4.confidence === 'Medium', rec4.confidence)

// Stars clamped
const rec5 = adaptRecommendation({ category:'travel', label:'Travel', action:'Plan trip.', confidence:'Low', stars:8 })
assert('out-of-range stars defaults to 3',    rec5.stars === 3, rec5.stars)

// Batch + filtering
const batch = adaptRecommendations([rec1, null, rec2])
assert('batch filters null',                  batch.length === 2, batch.length)

console.log('\n─── TimelineAdapter ───')
const t1 = adaptTimelineEntry({ time:'09:00', end:'11:00', quality:'Excellent', label:'Planning', score:2.1 })
assert('startTime from time',    t1.startTime === '09:00', t1.startTime)
assert('endTime from end',       t1.endTime === '11:00',   t1.endTime)
assert('description from label', t1.description === 'Planning', t1.description)
assert('confidence High for Excellent', t1.confidence === 'High', t1.confidence)

const t2 = adaptTimelineEntry({ time:'13:00', quality:'Low energy', label:'Rest.', score:-1.5 })
assert('Low energy → Low confidence', t2.confidence === 'Low', t2.confidence)

const timeline = adaptTimeline([{ time:'09:00', end:'10:00', quality:'Good', label:'Work' }, null])
assert('adaptTimeline filters null', timeline.length === 1, timeline.length)

console.log('\n─── DailyBriefAdapter ───')
const rawBrief = {
  theme:'Career', outlook:'Positive', bestWindow:'09:00–11:00', avoidWindow:'17:00–19:00',
  confidence:'High', decisionOfDay:'Begin your project now.',
  opportunities:[{ category:'career', icon:'💼', label:'Career', advice:'Great day.', confidence:'High', bestTime:'09:00–11:00' }],
  cautions:     [{ category:'finance', icon:'💰', label:'Finance', advice:'Defer large moves.', confidence:'Low' }],
  familyBrief:  { energy:'High', bestWindow:'18:00–20:00', activities:['Dinner'], avoid:[], confidence:'High', memberCount:2 },
  tomorrowPreview: { label:'Tomorrow', stars:4, summary:'Good day.', confidence:'High', days_ahead:1 }
}
const brief = adaptDailyBrief(rawBrief, { golden_window:'09:00–11:00', members:[{ stars:4, confidence:'High', summary:'Do work.' }] })
assert('brief.theme correct',            brief.theme === 'Career', brief.theme)
assert('brief.outlook correct',          brief.outlook === 'Positive', brief.outlook)
assert('brief.bestWindow correct',       brief.bestWindow === '09:00–11:00', brief.bestWindow)
assert('brief.opportunities adapted',    brief.opportunities.length === 1, brief.opportunities.length)
assert('brief.cautions adapted',         brief.cautions.length === 1, brief.cautions.length)
assert('brief.familyBrief.energy',       brief.familyBrief?.energy === 'High', brief.familyBrief?.energy)
assert('brief.tomorrowPreview.daysAhead', brief.tomorrowPreview?.daysAhead === 1, brief.tomorrowPreview?.daysAhead)

// Fallback when raw brief missing
const briefFallback = adaptDailyBrief(null, { golden_window:'10:00–12:00', focus:'Learning', members:[{ stars:3, confidence:'Medium', summary:'Steady day.' }] })
assert('fallback bestWindow from daily', briefFallback?.bestWindow === '10:00–12:00', briefFallback?.bestWindow)
assert('fallback theme from daily.focus', briefFallback?.theme === 'Learning', briefFallback?.theme)

console.log('\n─── WeeklyPlanAdapter ───')
const rawWeekly = {
  categories:[{ category:'career', icon:'💼', label:'Career', bestDay:'Monday', bestDate:'2026-08-10', daysAhead:5, confidence:'High', summary:'Great day.', stars:4 }],
  days:[{ label:'Today', date:'2026-08-05', days_ahead:0, stars:4, confidence:72, summary:'Favourable' }],
  topDay:{ label:'Friday', date:'2026-08-09', days_ahead:4, stars:5, confidence:85, summary:'Excellent' },
  challenging:{ label:'Wednesday', date:'2026-08-07', days_ahead:2, stars:2, confidence:35, summary:'Rest' }
}
const wp = adaptWeeklyPlan(rawWeekly)
assert('weeklyPlan.categories adapted',     wp.categories.length === 1, wp.categories.length)
assert('weeklyPlan.days adapted',           wp.days.length === 1, wp.days.length)
assert('weeklyPlan.days[0].confidenceLabel', wp.days[0].confidenceLabel === 'High', wp.days[0].confidenceLabel)
assert('weeklyPlan.days[0].daysAhead from days_ahead', wp.days[0].daysAhead === 0, wp.days[0].daysAhead)
assert('weeklyPlan.challenging adapted',    wp.challenging?.label === 'Wednesday', wp.challenging?.label)
assert('weeklyPlan.topDay adapted',         wp.topDay?.label === 'Friday', wp.topDay?.label)

const opp = adaptOpportunities([{ label:'Monday', title:'Strong window', summary:'Good day.', confidence:'High', daysAhead:5, stars:4 }])
assert('opportunities adapted',             opp.length === 1, opp.length)
assert('opportunity.daysAhead',             opp[0].daysAhead === 5, opp[0].daysAhead)

console.log('\n─── Validation ───')
const { valid: v1, issues: i1 } = validateRecommendation(rec1)
assert('valid rec passes',                  v1 === true, i1)
const { valid: v2, issues: i2 } = validateRecommendation({ category:'x' })  // missing required fields
assert('incomplete rec fails',              v2 === false)

const { valid: v3 } = validateDailyBrief(brief)
assert('valid brief passes',                v3 === true)
const { valid: v4 } = validateDailyBrief(null)
assert('null brief fails',                  v4 === false)

const { valid: v5 } = validateTimelineEntry(t1)
assert('valid timeline entry passes',       v5 === true)
const { valid: v6 } = validateTimelineEntry({})
assert('empty timeline entry fails',        v6 === false)

console.log(`\n─── ${pass} passed, ${fail} failed ───\n`)
if (fail > 0) process.exitCode = 1
