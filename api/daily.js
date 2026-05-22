import { getFullAstroContext, scoreForUser, computeLagna } from './astro.js'
import { PLANET_CULTURAL } from '../lib/astro/planets.js'

const DO_MSGS = [
  'Use this window for key decisions and important conversations',
  'Tackle your most complex or high-stakes task now',
  'Send proposals, contracts, or critical messages during peak hours',
  'Lead discussions or negotiate — clarity is at its highest',
  'Start high-priority projects that need strong momentum'
]
const AVOID_MSGS = [
  'Do not make financial decisions — risk clarity is low',
  'Avoid committing to new obligations or contracts',
  'Hold off on reactive responses — revisit tomorrow with fresh eyes',
  'Do not multitask on critical work — depth is required',
  'Avoid impulsive choices — wait for a higher-scoring window'
]
const WATCH_MSGS = [
  'Energy will dip — schedule breaks before it affects focus',
  'Decision fatigue builds after midday — front-load important work',
  'Focus may fragment — reduce context-switching',
  'Transition zone — complete open tasks before starting new ones',
  'Stress risk peaks during handoffs — communicate clearly'
]
const SUMMARIES = [
  'Strong window for decisions and deep work.',
  'Good momentum — act on what matters most.',
  'Favourable conditions for key conversations.',
  'Moderate energy — pace yourself today.',
  'Lower clarity window — rest and reflect.',
  'Best used for review, not new commitments.'
]

function buildSummary(scored, reasoning, golden, worst) {
  const traitHint = ''
  const riskFlag  = scored.worst.dims.r > 1 ? ' Manage risk carefully.' : ''
  const cultural   = `${reasoning.dashaLabel} — ${reasoning.planetReasoning}; ${reasoning.nakshatraCultural} (${reasoning.nakshatraLabel}).`
  const chartNote  = reasoning.chartSummary ? ` ${reasoning.chartSummary}.` : ''
  const birthNote  = [
    reasoning.lagnaSign    ? `Lagna in ${reasoning.lagnaSign}`    : '',
    reasoning.moonSignName ? `Moon in ${reasoning.moonSignName}`  : ''
  ].filter(Boolean).join(', ')
  const birthLine = birthNote ? ` ${birthNote} shapes your personal alignment.` : ''
  return (
    `Use your ${golden.time} window for key decisions and important actions. ` +
    `Avoid starting new commitments after ${worst.time}. ` +
    `${cultural}${birthLine}${chartNote}${riskFlag}${traitHint}`
  )
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).end()

  const body     = req.body || {}
  const users    = Array.isArray(body.users) && body.users.length > 0
    ? body.users.slice(0, 3)
    : [{ name: null, dob: null, birth_time: null, type: null }]
  const daysAhead = Math.max(0, Math.min(7, parseInt(body.daysAhead || '0', 10) || 0))

  const astroCtx = await getFullAstroContext(daysAhead)
  const { certaintyFactor, varaPlanet, panchang, positions } = astroCtx

  const members = users.map(u => {
    const scored   = scoreForUser(u, astroCtx)
    const { reasoning, golden, worst, medium, confidence, debug } = scored
    const seed     = (new Date().getDate() + (u.dob ? parseInt((u.dob.split('-')[2]||'0'),10) : 0)) || 1
    const adj      = Math.min(92, Math.round(confidence * certaintyFactor))
    const prefix   = daysAhead > 0 ? 'Likely supportive: ' : ''

    return {
      name:          u.name || 'You',
      golden_window: golden.time,
      avoid_window:  worst.time,
      lagna:         scored.lagna?.name || null,
      moon_sign:     scored.moonSign?.name || null,
      summary:       buildSummary(scored, reasoning, golden, worst),
      do:            prefix + DO_MSGS[Math.abs(seed) % DO_MSGS.length],
      avoid:         `${worst.time} — ` + AVOID_MSGS[(Math.abs(seed)+1) % AVOID_MSGS.length],
      watch:         `${medium.time} — ` + WATCH_MSGS[(Math.abs(seed)+2) % WATCH_MSGS.length],
      confidence:    adj,
      _reasoning:    reasoning,
      _debug:        { ...debug, lagna: scored.lagna, planetHouses: scored.reasoning?.planetHouses, chartSummary: scored.reasoning?.chartSummary, houseBreakdown: scored.reasoning?.houseBreakdown }
    }
  })

  const primary     = members[0]
  const avgConf     = Math.round(members.reduce((s, m) => s + m.confidence, 0) / members.length)
  const domTransit  = positions.transits.filter(t => t.impact)
    .sort((a,b) => Object.values(b.impact).reduce((s,v)=>s+Math.abs(v),0) - Object.values(a.impact).reduce((s,v)=>s+Math.abs(v),0))[0] || null

  res.status(200).json({
    golden_window:      primary.golden_window,
    avoid_window:       primary.avoid_window,
    do:                 primary.do,
    avoid:              primary.avoid,
    watch:              primary.watch,
    planet:             varaPlanet.name,
    lunar_phase:        panchang.lunarPhase.name,
    vara:               varaPlanet.name,
    tithi:              panchang.tithi.tithi,
    tithi_phase:        panchang.tithi.phase,
    nakshatra:          panchang.nakshatra.name,
    moon_sign:          primary.moon_sign,
    dasha:              panchang.dasha,
    days_ahead:         daysAhead,
    certainty_factor:   certaintyFactor,
    transit:            domTransit ? { planet: domTransit.planet, sign: domTransit.sign } : null,
    confidence_summary: avgConf,
    members
  })
}
