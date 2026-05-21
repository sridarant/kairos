import { toConfidence } from '../lib/astro/scoring.js'
import { getFullAstroContext, scoreForUser, buildSeed, buildTraits, computeLagna } from './astro.js'
import { PLANET_CULTURAL } from '../lib/astro/planets.js'
import { DIM_LABEL } from '../lib/astro/scoring.js'

// ─── DIM_LABEL (scoring.js doesn't export this — define locally) ──────────────
const DIM_LABELS = {
  d: 'decision-making clarity', c: 'communication strength',
  f: 'focus and concentration',  r: 'risk sensitivity'
}

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
  if (/career|job|work|boss|colleague|project|deadline|client|office|promotion|resign|quit|hire|fired|salary|raise|contract/.test(q))
    return { primary:'d', label:'career',        verb:'act on this career matter' }
  if (/money|invest|financial|fund|budget|cost|price|loan|debt|stock|savings|purchase|buy|spend|sell|rent|pay/.test(q))
    return { primary:'r', label:'financial',     verb:'make this financial move' }
  if (/study|learn|course|skill|read|practice|train|exam|school|university|research/.test(q))
    return { primary:'f', label:'personal',      verb:'pursue this personal goal' }
  if (/health|doctor|medicine|exercise|diet|sleep|wellness|body|symptom|surgery/.test(q))
    return { primary:'f', label:'health',        verb:'act on this health matter' }
  if (/talk|meeting|conversation|discuss|call|message|relationship|friend|family|partner|conflict/.test(q))
    return { primary:'c', label:'communication', verb:'have this conversation' }
  return { primary:'d', label:'personal', verb:'proceed with this decision' }
}

function detectIntensity(question, context) {
  const q = (question + ' ' + (context || '')).toLowerCase()
  if (/resign|quit job|divorce|marry|buy house|sell house|surgery|major|life.changing|irreversible|permanent|borrow large/.test(q)) return 'high'
  if (/quick|small|minor|simple|easy|routine|today only|casual|chat/.test(q)) return 'low'
  return 'medium'
}

function decisionLabel(decision, intensity) {
  if (decision === 'do')    return intensity === 'high' ? 'PROCEED (with care)' : 'DO NOW'
  if (decision === 'avoid') return intensity === 'high' ? 'HOLD OFF TODAY'      : 'AVOID TODAY'
  return                           intensity === 'high' ? 'WAIT FOR CLARITY'    : 'WAIT'
}

function evaluate(slots, ctx) {
  const sorted  = [...slots].sort((a, b) => b.score - a.score)
  const best    = sorted[0]
  const worst   = sorted[sorted.length - 1]
  const hour    = new Date().getHours()
  const current = slots.find(s => {
    const [h] = s.time.split('–')[0].split(':').map(Number)
    return hour >= h && hour < h + 2
  }) || slots[0]

  const dimScore  = current.dims[ctx.primary] ?? current.dims.d
  const riskScore = current.dims.r

  let decision
  if (dimScore >= 0.1 && riskScore <= 0)       decision = 'do'
  else if (riskScore >= 0.1 || dimScore <= -0.1) decision = 'avoid'
  else                                           decision = 'wait'

  const nextBest = decision === 'wait' ? (sorted.find(s => s.time !== current.time) || best) : null

  return { decision, best_time: best.time, avoid_time: worst.time, next_best: nextBest?.time || null,
    confidence: toConfidence(best.score, worst.score), dimScore, riskScore }
}

async function callClaude(prompt, apiKey) {
  const opts = {
    method:'POST',
    headers:{ 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
    body: JSON.stringify({ model:'claude-3-haiku-20240307', max_tokens:350, messages:[{ role:'user', content:prompt }] })
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

  const fbDecBias = feedbackAdj?.decisionBias || 0
  const fbRiskAdj = feedbackAdj?.riskAdj      || 0
  const fbConfMul = feedbackAdj?.confidenceMultiplier || 1

  try {
    const astroCtx = await getFullAstroContext(0)

    // Adjust user with feedback bias
    const userWithBias = {
      ...profile,
      _biasOverride: { d: fbDecBias, r: fbRiskAdj }
    }
    const scored    = scoreForUser(userWithBias, astroCtx)
    const { reasoning, slots } = scored

    const ctx      = detectContext(question)
    const result   = evaluate(slots, ctx)
    const intensity = detectIntensity(question, context)
    const dLabel   = decisionLabel(result.decision, intensity)
    const adjConf  = Math.min(92, Math.max(10, Math.round(result.confidence * fbConfMul)))
    const dimHuman = DIM_LABELS[ctx.primary] || ctx.primary

    const actionMap = {
      do:    `Proceed with ${ctx.verb} now`,
      wait:  `Hold — act during ${result.next_best || result.best_time}`,
      avoid: `Do not ${ctx.verb} today`
    }
    const action = actionMap[result.decision]

    const prompt = `You are a structured decision-support writer for Kairos v17.0.

DECISION CONTEXT:
- Type: ${ctx.label} | Intensity: ${intensity}
- Question: ${question}
- User context: ${context || 'none'}

FIXED ENGINE VALUES:
- Decision label: ${dLabel}
- Action: ${action}
- Best window: ${result.best_time}
- Avoid window: ${result.avoid_time}
- Confidence: ${adjConf}

ASTRO REASONING (reference 1–2 naturally):
- Dominant dimension: ${dimHuman}
- Moon in ${reasoning.nakshatraName}: ${reasoning.nakshatraLabel}
- Moon sign: ${reasoning.moonSignName || 'unknown'} | Dasha: ${reasoning.dashaLabel}
${reasoning.interactNote ? `- Interaction: ${reasoning.interactNote}` : ''}

TONE: ${intensity === 'high' ? 'Cautious and measured.' : intensity === 'low' ? 'Direct and quick.' : 'Balanced and clear.'}
${profile?.name ? `Open with "${profile.name.split(' ')[0]}, " then the decision.` : 'No name.'}

OUTPUT (strict JSON only):
{
  "decision": "${result.decision}",
  "decision_label": "${dLabel}",
  "action": "${action}",
  "best_time": "${result.best_time}",
  "avoid_time": "${result.avoid_time}",
  "message": "<1-2 sentences with one astro reference>",
  "balance": "<1 sentence pros/cons>",
  "confidence": ${adjConf}
}`

    const response = await callClaude(prompt, process.env.ANTHROPIC_API_KEY)

    if (!response.ok) return res.status(200).json({ ...FALLBACK, best_time: result.best_time, avoid_time: result.avoid_time, confidence: adjConf })

    const data  = await response.json()
    const text  = data?.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return res.status(200).json({ ...FALLBACK, best_time: result.best_time, avoid_time: result.avoid_time, confidence: adjConf })

    const json = JSON.parse(match[0])
    if (!['do','avoid','wait'].includes(json.decision)) throw new Error('invalid')
    if (!json.message) throw new Error('no_message')

    return res.status(200).json({
      decision:       json.decision,
      decision_label: json.decision_label || dLabel,
      action:         json.action || action,
      best_time:      result.best_time,
      avoid_time:     result.avoid_time,
      next_best:      result.next_best,
      message:        json.message,
      balance:        json.balance || null,
      confidence:     adjConf,
      planet:         astroCtx.varaPlanet.name,
      lunar_phase:    astroCtx.panchang.lunarPhase.name,
      tithi:          astroCtx.panchang.tithi.tithi,
      nakshatra:      reasoning.nakshatraName,
      moon_sign:      reasoning.moonSignName,
      dasha:          astroCtx.panchang.dasha,
      context:        ctx.label,
      debug:          scored.debug
    })
  } catch {
    return res.status(200).json(FALLBACK)
  }
}
