import {
  scoredSlots, buildSeed, buildTraits, getPlanet, getLunarPhase, getDayType,
  dominantDimension, toConfidence, DIM_LABEL, buildReasoning,
  computeLagna, computeMoonSign,
  getTransits, aggregateTransits, dominantTransit,
  getTithi, getNakshatra, getVara
} from './engine.js'

const FALLBACK = {
  decision: 'wait',
  best_time: null,
  avoid_time: null,
  message: 'Unable to fetch guidance. Try again.',
  confidence: 0
}

function detectContext(question) {
  const q = question.toLowerCase()
  if (/career|job|work|boss|colleague|project|deadline|client|office|promotion|resign|hire|fired|salary raise/.test(q))
    return { primary: 'decision', secondary: 'communication', label: 'work',          verb: 'act on this career matter' }
  if (/money|invest|financial|fund|budget|cost|price|loan|debt|stock|savings|purchase|buy|spend/.test(q))
    return { primary: 'risk',     secondary: 'decision',      label: 'money',         verb: 'make this financial move' }
  if (/study|learn|course|skill|read|practice|train|exam|school|university|research|focus/.test(q))
    return { primary: 'focus',    secondary: 'decision',      label: 'learning',      verb: 'pursue this learning goal' }
  if (/health|doctor|medicine|exercise|diet|sleep|wellness|body|symptom|appointment/.test(q))
    return { primary: 'focus',    secondary: 'decision',      label: 'health',        verb: 'act on this health matter' }
  if (/talk|meeting|conversation|discuss|call|message|relationship|friend|family|partner|conflict/.test(q))
    return { primary: 'communication', secondary: 'focus',   label: 'relationships', verb: 'have this conversation' }
  return   { primary: 'decision', secondary: 'communication', label: 'general',       verb: 'proceed with this decision' }
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

  const dimScore  = current[ctx.primary] ?? current.decision
  const riskScore = current.risk

  let decision
  if (dimScore >= 1 && riskScore >= 0)        decision = 'do'
  else if (riskScore <= -1 || dimScore <= -1) decision = 'avoid'
  else                                         decision = 'wait'

  const nextBest = decision === 'wait'
    ? (sorted.find(s => s.time !== current.time) || best)
    : null

  return {
    decision,
    best_time:  best.time,
    avoid_time: worst.time,
    next_best:  nextBest?.time || null,
    confidence: toConfidence(best.score, worst.score),
    dimScore,
    riskScore
  }
}

function buildPrompt(result, r, ctx, question, context, profile) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : null

  const actionMap = {
    do:    `Proceed with ${ctx.verb} now`,
    wait:  `Hold for now — act during ${result.next_best || result.best_time}`,
    avoid: `Do not ${ctx.verb} today`
  }
  const action = actionMap[r.decision]

  const riskLine = r.riskFlag === 'elevated'
    ? 'Risk is elevated — include one brief caution about timing.'
    : r.riskFlag === 'reduced'
    ? 'Risk appetite is reduced — note conservative action is favoured.'
    : ''

  const traitHint = r.traitLines?.length > 0
    ? `User tendency (weave in once, naturally): "${r.traitLines[0]}"`
    : ''

  // Cultural terms: Dasha always; transit if active; Lagna or Rasi by context
  const culturalTerms = [`${r.dashaLabel} ${r.planetInfluence}`]
  if (r.transitLabel) culturalTerms.push(`active transit: ${r.transitLabel}`)
  if (r.lagnaLabel && ['decision', 'work', 'career', 'general'].includes(ctx.label)) {
    culturalTerms.push(`your ${r.lagnaLabel}`)
  } else if (r.rasiLabel && ['communication', 'relationships'].includes(ctx.label)) {
    culturalTerms.push(`your ${r.rasiLabel}`)
  }

  const culturalLine = `Cultural context (use max 2, naturally, no "planet" word): ${culturalTerms.slice(0, 2).join('; ')}.`
  const nameLine = firstName ? `Open with "${firstName}, " then the action.` : 'Do not use a name.'

  return `You are an actionable decision-support writer for Kairos v8.0.

FIXED VALUES — embed exactly:
- decision: ${r.decision}
- action:   ${action}
- best_time: ${result.best_time}
- avoid_time: ${result.avoid_time}
- confidence: ${result.confidence}

PANCHANG CONTEXT (today's astrological structure):
- Vara: ${r.varaCultural} — ${r.varaLabel}
- Tithi ${r.tithi}: ${r.tithiLabel}
- Nakshatra: ${r.nakshatraCultural} — ${r.nakshatraLabel}

ADDITIONAL CONTEXT:
- Question: ${question}
- Context type: ${ctx.label} (dimension: ${r.ctxHuman})
- Dominant dimension: ${r.dimHuman}
- Dasha: ${r.dashaLabel} — ${r.planetInfluence}
- Lunar: ${r.lunarPhase}
${r.transitLabel ? `- Active transit: ${r.transitLabel}` : ''}
- Additional context: ${context || 'none'}
${traitHint ? `- ${traitHint}` : ''}

CULTURAL TERMS:
- ${culturalLine}

STRUCTURE (1–2 natural sentences):
1. Start with the action: "${action}."
2. Add timing: ${result.best_time} to act, ${result.avoid_time} to avoid.
3. One short reason referencing ${r.dimHuman} — use the Vara or Nakshatra as the astrological anchor (e.g. "${r.varaName} Vara" or "${r.nakshatraName}").
4. Max 1 additional cultural term (Dasha, Lagna, or transit) if it adds clarity.
${riskLine ? `5. ${riskLine}` : ''}
${nameLine}

OUTPUT — strict JSON only, no markdown:
{
  "decision": "${r.decision}",
  "best_time": "${result.best_time}",
  "avoid_time": "${result.avoid_time}",
  "message": "...",
  "confidence": ${result.confidence}
}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, context, profile, feedbackAdj } = req.body || {}
  if (!question) return res.status(400).json(FALLBACK)

  // Safely extract feedback adjustments sent from frontend localStorage
  const fbDecBias = (feedbackAdj?.decisionBias   || 0)
  const fbRiskAdj = (feedbackAdj?.riskAdj         || 0)
  const fbConfMul = (feedbackAdj?.confidenceMultiplier || 1)

  try {
    const planet       = getPlanet()
    const lunar        = getLunarPhase()
    const dayType      = getDayType()
    const seed         = buildSeed(profile?.dob || null)
    const rawTraits    = buildTraits(profile?.dob || null)
    // Merge feedback adjustments into traits so they flow through the full engine
    const traits = {
      ...rawTraits,
      decision_bias:  rawTraits.decision_bias  + fbDecBias,
      risk_tolerance: rawTraits.risk_tolerance + fbRiskAdj
    }
    const lagna        = computeLagna(profile?.birth_time || null)
    const moonSign     = computeMoonSign(profile?.dob || null)
    const transits     = getTransits()
    const transitDelta = aggregateTransits(transits, lagna, moonSign)
    const domTransit   = dominantTransit(transits)
    const slots        = scoredSlots(seed, planet, profile?.type || null, lunar, dayType, traits, lagna, moonSign, transitDelta)
    const ctx          = detectContext(question)
    const result       = evaluate(slots, ctx)
    const dominant     = dominantDimension(planet, lunar, traits, lagna, moonSign, transitDelta)

    // Apply confidence multiplier from feedback history
    const adjustedConfidence = Math.min(92, Math.max(10, Math.round(result.confidence * fbConfMul)))

    const reasoning = buildReasoning({
      planet, lunar, dayType, traits, lagna, moonSign,
      transitInfo: domTransit,
      dominant,
      ctx:       ctx.primary,
      dimScore:  result.dimScore,
      riskScore: result.riskScore,
      decision:  result.decision
    })
    reasoning.ctxHuman = DIM_LABEL[ctx.primary] || ctx.primary
    reasoning.dimHuman = DIM_LABEL[dominant]     || dominant

    // Use adjusted confidence throughout prompt and response
    const resultWithAdj = { ...result, confidence: adjustedConfidence }
    const prompt = buildPrompt(resultWithAdj, reasoning, ctx, question, context, profile)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 260,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    if (!response.ok) throw new Error('api_error')

    const data  = await response.json()
    const text  = data?.content?.[0]?.text || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('parse_error')

    const json = JSON.parse(match[0])
    if (!['do', 'avoid', 'wait'].includes(json.decision)) throw new Error('invalid_decision')
    if (!json.message) throw new Error('no_message')

    return res.status(200).json({
      decision:    json.decision,
      best_time:   result.best_time,
      avoid_time:  result.avoid_time,
      next_best:   result.next_best,
      message:     json.message,
      confidence:  adjustedConfidence,
      planet:      planet.name,
      lunar_phase: lunar.name,
      vara:        planet.name,   // Vara IS the weekday planet
      tithi:       getTithi().tithi,
      nakshatra:   getNakshatra().name,
      lagna:       lagna?.name    || null,
      moon_sign:   moonSign?.name || null,
      transit:     domTransit ? { planet: domTransit.planet, sign: domTransit.sign } : null,
      context:     ctx.label
    })
  } catch {
    return res.status(200).json(FALLBACK)
  }
}
