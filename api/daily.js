/**
 * /api/daily.js v21.5
 *
 * Data flow:
 *   lib/astronomy (facts) → lib/astrology (interpretation) → lib/decision (decisions) → response
 *
 * No natural language here. No Claude calls here.
 * Claude is only called from /api/explain when user asks a question.
 */

import { getDailyAstronomy, getBirthChart } from '../lib/astronomy/index.js'
import { buildAstroContext }                  from '../lib/astrology/index.js'
import { buildDecisionObject, buildFamilyDecisionObject } from '../lib/decision/engine.js'
import { scoreToStars }                       from '../lib/decision/confidence.js'

// ─── Personal seed (deterministic, reproducible) ──────────────────────────────
function personalSeed(user) {
  const today  = new Date().getDate()
  const dobDay = user?.dob ? parseInt((user.dob.split('-')[0] || '0'), 10) : 0
  return Math.abs(today + dobDay) || 1
}

// ─── Week plan (uses deterministic confidence variation) ──────────────────────
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

async function buildWeekPlan(seed) {
  const today = new Date()
  return Array.from({ length:7 }, (_, i) => {
    const d   = new Date(today); d.setDate(today.getDate() + i)
    // Deterministic variation: use sin of seed+day to vary score meaningfully
    const cf  = i === 0 ? 1.0 : i <= 3 ? 0.85 : 0.70
    const raw = 55 + Math.round(Math.sin((seed * 0.7 + i * 1.2)) * 28)
    const adj = Math.max(18, Math.min(88, Math.round(raw * cf)))
    return {
      label:      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()],
      date:       d.toISOString().slice(0,10),
      days_ahead: i,
      stars:      scoreToStars(adj),
      confidence: adj,
      summary:    adj >= 70 ? 'Highly favourable' : adj >= 50 ? 'Moderately favourable' : 'Rest and reflect'
    }
  })
}

// ─── Category advice strings (static, keyed by score) ─────────────────────────
const CAT_ADVICE = {
  career: {
    5:'Begin or advance your most important project today.',
    4:'Focus on strategic planning and high-impact work.',
    3:'Steady progress on current commitments serves well.',
    2:'Consolidate and review before new initiatives.',
    1:'Rest and reflect — defer career decisions.'
  },
  finance: {
    5:'Good window for considered financial decisions.',
    4:'Review finances; moderate decisions are well-supported.',
    3:'Routine transactions only — defer large commitments.',
    2:'Caution advised — elevated risk for financial moves.',
    1:'Avoid financial decisions today.'
  },
  relationships: {
    5:'Excellent time for important conversations and bonding.',
    4:'Relationships benefit from proactive communication.',
    3:'Listen actively; routine interactions work well.',
    2:'Written messages preferred over direct conversations.',
    1:'Defer sensitive discussions to a better window.'
  },
  health: {
    5:'Excellent window for health decisions and self-care.',
    4:'Moderate activity and health routines are well-supported.',
    3:'Gentle exercise and recovery are appropriate.',
    2:'Rest is more productive than demanding health goals.',
    1:'Prioritise rest and minimal activity today.'
  },
  learning: {
    5:'Peak absorption — tackle complex study now.',
    4:'Good for learning, planning, and skill-building.',
    3:'Review and revision work better than new material.',
    2:'Short, practical sessions only.',
    1:'Light reading preferred over intensive study.'
  }
}

function enrichedCategories(categoryScores) {
  const result = {}
  for (const [cat, score] of Object.entries(categoryScores)) {
    const advice = CAT_ADVICE[cat]?.[score] || `Conditions are ${score >= 4 ? 'favourable' : score >= 3 ? 'moderate' : 'challenging'} today.`
    result[cat] = { stars: score, advice }
  }
  return result
}

// ─── Signal cards ─────────────────────────────────────────────────────────────
function buildSignalCards(decisionObj) {
  const { decision, confidence, goldenWindow, avoidWindow, watchWindow } = decisionObj
  const signalCard = {
    icon:  decision === 'DO' ? '🟢' : decision === 'AVOID' ? '🔴' : '🟡',
    label: `${confidence} Signal`,
    text:  decision === 'DO'    ? 'Conditions are favourable for important actions and decisions.' :
           decision === 'AVOID' ? 'Elevated caution today — defer important decisions if possible.' :
                                  'Mixed signals — use your golden window for what matters most.'
  }
  return {
    signal: signalCard,
    do_card:    { icon:'🟢', label:'Best Time', text:`Use ${goldenWindow} for your most important work.` },
    avoid_card: { icon:'🔴', label:'Avoid',     text:`Avoid new commitments after ${avoidWindow}.` },
    watch_card: { icon:'🟡', label:'Watch',     text:`Energy shifts around ${watchWindow} — pace yourself.` }
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const body      = req.body || {}
  const users     = Array.isArray(body.users) && body.users.length > 0
    ? body.users.slice(0, 5)
    : [{ name:null, dob:null, birth_time:null, type:null }]
  const daysAhead = Math.max(0, Math.min(7, parseInt(body.daysAhead || '0', 10) || 0))

  // ── Layer 1: Astronomy ─────────────────────────────────────────────────────
  const targetDate = new Date()
  if (daysAhead > 0) targetDate.setDate(targetDate.getDate() + daysAhead)
  const dailyAstro = getDailyAstronomy(targetDate)

  // ── Per-user: Layer 1→2→3 pipeline ────────────────────────────────────────
  const members = users.map(u => {
    const birthChart  = getBirthChart(u.dob, u.birth_time)
    const astroCtx    = buildAstroContext(dailyAstro, birthChart, u.dob, daysAhead)
    const seed        = personalSeed(u)
    const decisionObj = buildDecisionObject(astroCtx, seed, daysAhead)

    return {
      name:          u.name || 'You',
      golden_window: decisionObj.goldenWindow,
      avoid_window:  decisionObj.avoidWindow,
      lagna:         decisionObj._lagna?.signName || null,
      moon_sign:     dailyAstro.panchang.nakshatra.name,
      stars:         decisionObj.stars,
      confidence:    decisionObj.confidence,
      focus:         decisionObj.focus,
      summary:       `${decisionObj.decision} — ${decisionObj.confidence} signal. Use ${decisionObj.goldenWindow} for priority work.`,
      recommendations: enrichedCategories(decisionObj.categoryScores),
      timeline:      decisionObj.timeline,
      do_advice:     `Use ${decisionObj.goldenWindow} for your most important work.`,
      avoid_advice:  `Avoid new commitments after ${decisionObj.avoidWindow}.`,
      watch_advice:  `Energy shifts around ${decisionObj.watchWindow}.`,
      _decision:     decisionObj   // full object for /api/explain
    }
  })

  // ── Family alignment ───────────────────────────────────────────────────────
  const familyAlignment = buildFamilyDecisionObject(members.map(m => m._decision))

  // ── Primary member cards + week plan ──────────────────────────────────────
  const primary     = members[0]
  const cards       = buildSignalCards(primary._decision)
  const seed        = personalSeed(users[0])
  const weekPlan    = await buildWeekPlan(seed)

  // ── Panchang for display ───────────────────────────────────────────────────
  const { panchang, grahas } = dailyAstro

  res.status(200).json({
    // Primary user
    golden_window:      primary.golden_window,
    avoid_window:       primary.avoid_window,
    stars:              primary.stars,
    focus:              primary.focus,
    signal:             cards.signal,
    do_card:            cards.do_card,
    avoid_card:         cards.avoid_card,
    watch_card:         cards.watch_card,
    // Astro display
    planet:             panchang.vara,
    lunar_phase:        panchang.tithi.phase === 'Shukla' ? 'Waxing' : 'Waning',
    nakshatra:          panchang.nakshatra.name,
    nakshatra_cultural: panchang.nakshatra.name,  // cultural name added via panchang lib
    tithi:              panchang.tithi.number,
    tithi_label:        panchang.tithi.name,
    moon_sign:          primary.moon_sign,
    dasha:              members[0]._decision?._dasha?.currentLord || '',
    // Full members + family
    members,
    family_alignment:   familyAlignment,
    week_plan:          weekPlan,
    confidence_summary: primary.confidence,
    days_ahead:         daysAhead,
    certainty_factor:   daysAhead === 0 ? 1.0 : daysAhead <= 3 ? 0.85 : 0.70
  })
}
