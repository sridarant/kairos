/**
 * /api/ask.js  v22.0
 * Uses same astro engine as daily.js. Claude generates the response text.
 */

import { toConfidence } from '../lib/astro/scoring.js'
import { getFullAstroContext, scoreForUser, buildSeed } from './astro.js'

const FALLBACK = {
  decision:'wait', decision_label:'WAIT',
  action:'Hold for now and revisit when conditions are clearer',
  best_time:null, avoid_time:null,
  message:'Signals are mixed today. Use caution and revisit later.',
  balance:'Patience is the safest move when conditions are unclear.',
  confidence:30
}

function detectContext(question) {
  const q = question.toLowerCase()
  if (/career|job|work|boss|office|promotion|resign|quit|hire|contract/.test(q))
    return { primary:'d', label:'career', verb:'act on this career matter' }
  if (/money|invest|financial|loan|debt|stock|buy|sell/.test(q))
    return { primary:'r', label:'financial', verb:'make this financial move' }
  if (/health|doctor|medicine|exercise|diet|surgery/.test(q))
    return { primary:'f', label:'health', verb:'act on this health matter' }
  if (/talk|conversation|discuss|relationship|family|partner|conflict/.test(q))
    return { primary:'c', label:'communication', verb:'have this conversation' }
  return { primary:'d', label:'personal', verb:'proceed with this decision' }
}

function detectIntensity(q, ctx) {
  const s = (q + ' ' + (ctx||'')).toLowerCase()
  if (/resign|divorce|surgery|major|irreversible|permanent/.test(s)) return 'high'
  if (/quick|small|minor|routine|casual/.test(s)) return 'low'
  return 'medium'
}

function decisionLabel(decision, intensity) {
  if (decision === 'do')    return intensity === 'high' ? 'PROCEED (with care)' : 'DO NOW'
  if (decision === 'avoid') return intensity === 'high' ? 'HOLD OFF TODAY' : 'AVOID TODAY'
  return intensity === 'high' ? 'WAIT FOR CLARITY' : 'WAIT'
}

function evalDecision(agg, ctx) {
  const dimScore  = agg[ctx.primary] || agg.d
  const riskScore = agg.r
  let decision
  if (dimScore >= 0.2 && riskScore <= 0.1)       decision = 'do'
  else if (riskScore >= 0.3 || dimScore <= -0.2)  decision = 'avoid'
  else                                             decision = 'wait'
  return { decision, dimScore, riskScore, confidence: Math.round(60 + dimScore * 15 - riskScore * 10) }
}

async function callClaude(prompt, apiKey) {
  const opts = {
    method:'POST',
    headers:{'x-api-key':apiKey,'anthropic-version':'2023-06-01','content-type':'application/json'},
    body: JSON.stringify({ model:'claude-3-haiku-20240307', max_tokens:350,
      messages:[{ role:'user', content: prompt }] })
  }
  const r1 = await fetch('https://api.anthropic.com/v1/messages', opts)
  if (r1.ok) return r1
  await new Promise(r => setTimeout(r, 800))
  return fetch('https://api.anthropic.com/v1/messages', opts)
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, context, profile, feedbackAdj } = req.body || {}
  if (!question) return res.status(400).json(FALLBACK)

  const fbConfMul = feedbackAdj?.confidenceMultiplier || 1

  try {
    const astroCtx = await getFullAstroContext(0)
    const scored   = scoreForUser(profile || {}, astroCtx)
    const { agg, reasoning }  = scored
    const ctx      = detectContext(question)
    const eval_    = evalDecision(agg, ctx)
    const intensity = detectIntensity(question, context)
    const dLabel   = decisionLabel(eval_.decision, intensity)
    const adjConf  = Math.min(92, Math.max(10, Math.round(eval_.confidence * fbConfMul)))

    const TIMES = ['09:00–11:00','09:00–11:00','11:00–13:00','07:00–09:00','11:00–13:00','09:00–11:00','15:00–17:00']
    const best_time = TIMES[new Date().getDay()]

    const prompt = `You are a structured Vedic astrology decision-support writer for Kairos v22.0.

QUESTION: ${question}
CONTEXT: ${context || 'none'} | TYPE: ${ctx.label} | INTENSITY: ${intensity}

ASTRO SYNTHESIS (classical Parashari interpretation):
- Tithi ${reasoning.tithi} (${reasoning.tithiPhase}): ${reasoning.nakshatraLabel}
- Nakshatra: ${reasoning.nakshatra} — ${reasoning.nakshatraLabel}
- Vara lord: ${reasoning.vara}
- Dasha: ${reasoning.dashaLabel || 'not set'}
- Yogas: ${reasoning.yogaNames?.join(', ') || 'none detected'}
${reasoning.notes?.slice(0,2).join(' ') || ''}

ENGINE OUTPUT:
- Decision: ${dLabel}
- Best window: ${best_time}
- Confidence: ${adjConf}

TONE: ${intensity === 'high' ? 'Cautious and measured — this is significant.' : intensity === 'low' ? 'Direct and quick.' : 'Balanced.'}
${profile?.name ? `Address as "${profile.name.split(' ')[0]}"` : ''}

OUTPUT strict JSON only:
{
  "decision": "${eval_.decision}",
  "decision_label": "${dLabel}",
  "action": "<clear instruction>",
  "best_time": "${best_time}",
  "avoid_time": "${eval_.decision === 'do' ? '17:00–19:00' : best_time}",
  "message": "<1-2 sentences: reason + one nakshatra or dasha reference>",
  "balance": "<1 sentence: balanced pro/con>",
  "confidence": ${adjConf}
}`

    const response = await callClaude(prompt, process.env.ANTHROPIC_API_KEY)
    if (!response.ok) return res.status(200).json({ ...FALLBACK, best_time, confidence: adjConf })

    const data  = await response.json()
    const text  = data?.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return res.status(200).json({ ...FALLBACK, best_time, confidence: adjConf })

    const json = JSON.parse(match[0])
    if (!['do','avoid','wait'].includes(json.decision)) throw new Error('invalid')

    return res.status(200).json({
      ...json,
      nakshatra: reasoning.nakshatra,
      moon_sign: astroCtx.grahas?.Moon?.signName || null,
      dasha:     reasoning.dashaLabel,
      context:   ctx.label
    })
  } catch {
    return res.status(200).json(FALLBACK)
  }
}
