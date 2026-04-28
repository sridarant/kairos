import {
  scoredSlots, buildSeed, buildTraits, getPlanet, getLunarPhase, getDayType,
  dominantDimension, toConfidence, DIM_LABEL, buildReasoning,
  computeLagna, computeMoonSign,
  getTransits, aggregateTransits, dominantTransit,
  getTithi, getNakshatra,
  getMoonCycle, getMoonNakshatra, getMoonSign, getMoonDasha
} from './engine.js'

const FALLBACK = {
  decision: 'wait',
  best_time: null,
  avoid_time: null,
  message: 'Unable to fetch guidance. Try again.',
  confidence: 0
}

// ─── Decision type detection (5 categories) ──────────────────────────────────
function detectContext(question) {
  const q = question.toLowerCase()
  if (/career|job|work|boss|colleague|project|deadline|client|office|promotion|resign|quit|hire|fired|salary|raise|contract/.test(q))
    return { primary: 'decision', secondary: 'communication', label: 'career',        verb: 'act on this career matter' }
  if (/money|invest|financial|fund|budget|cost|price|loan|debt|stock|savings|purchase|buy|spend|sell|rent|pay/.test(q))
    return { primary: 'risk',     secondary: 'decision',      label: 'financial',     verb: 'make this financial move' }
  if (/study|learn|course|skill|read|practice|train|exam|school|university|research|focus/.test(q))
    return { primary: 'focus',    secondary: 'decision',      label: 'personal',      verb: 'pursue this personal goal' }
  if (/health|doctor|medicine|exercise|diet|sleep|wellness|body|symptom|appointment|surgery|therapy/.test(q))
    return { primary: 'focus',    secondary: 'decision',      label: 'health',        verb: 'act on this health matter' }
  if (/talk|meeting|conversation|discuss|call|message|relationship|friend|family|partner|conflict|tell|apologise|confront/.test(q))
    return { primary: 'communication', secondary: 'focus',   label: 'communication', verb: 'have this conversation' }
  return   { primary: 'decision', secondary: 'communication', label: 'personal',      verb: 'proceed with this decision' }
}

// ─── Decision intensity classification ───────────────────────────────────────
function detectIntensity(question, context) {
  const q = (question + ' ' + (context || '')).toLowerCase()
  // High intensity: life-changing, irreversible, high stakes
  if (/resign|quit job|leave|divorce|marry|buy house|sell house|move country|surgery|major|life.changing|irreversible|permanent|borrow large|invest all/.test(q))
    return 'high'
  // Low intensity: routine, reversible, low stakes
  if (/quick|small|minor|simple|easy|routine|today only|this week|try out|casual|chat|check/.test(q))
    return 'low'
  return 'medium'
}

// Decision label by intensity + engine output
function decisionLabel(decision, intensity) {
  if (decision === 'do')    return intensity === 'high' ? 'PROCEED (with care)'  : 'DO NOW'
  if (decision === 'avoid') return intensity === 'high' ? 'HOLD OFF TODAY'       : 'AVOID TODAY'
  return                           intensity === 'high' ? 'WAIT FOR CLARITY'     : 'WAIT'
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

function buildPrompt(result, r, ctx, question, context, profile, intensity) {
  const firstName = profile?.name ? profile.name.split(' ')[0] : null
  const dLabel = decisionLabel(r.decision, intensity)

  const actionMap = {
    do:    `Proceed with ${ctx.verb} now`,
    wait:  `Hold — act during ${result.next_best || result.best_time}`,
    avoid: `Do not ${ctx.verb} today`
  }
  const action = actionMap[r.decision]

  const riskLine = r.riskFlag === 'elevated'
    ? 'Risk is elevated — add one brief caution.'
    : r.riskFlag === 'reduced'
    ? 'Risk appetite is reduced — note conservative action is favoured.'
    : ''

  const traitHint = r.traitLines?.length > 0
    ? `User tendency (weave in once): "${r.traitLines[0]}"`
    : ''

  const culturalTerms = [`${r.dashaLabel} ${r.planetInfluence}`]
  if (r.transitLabel) culturalTerms.push(`active transit: ${r.transitLabel}`)
  if (r.lagnaLabel && ['career', 'personal', 'general'].includes(ctx.label))
    culturalTerms.push(`your ${r.lagnaLabel}`)
  else if (r.rasiLabel && ['communication'].includes(ctx.label))
    culturalTerms.push(`your ${r.rasiLabel}`)
  const culturalLine = `Cultural context (max 2, natural, no "planet" word): ${culturalTerms.slice(0, 2).join('; ')}.`

  const toneGuide = intensity === 'high'
    ? 'TONE: Cautious and structured. This is a significant decision — be measured, not casual.'
    : intensity === 'low'
    ? 'TONE: Direct and quick. This is a minor decision — be crisp, no padding.'
    : 'TONE: Balanced. Clear but not abrupt.'

  const nameLine = firstName ? `Open with "${firstName}, " then the decision label.` : 'Do not use a name.'

  const balanceExamples = {
    career:        'Pro: strong window for initiative. Con: note if risk is elevated.',
    financial:     'Pro: timing clarity supports the move. Con: note if risk flag is elevated.',
    communication: 'Pro: communication dimension is favourable. Con: note if energy is low.',
    health:        'Pro: focus supports clear thinking now. Con: note if caution is needed.',
    personal:      'Pro: aligned timing. Con: note any tension in scores.'
  }
  const balanceGuide = balanceExamples[ctx.label] || balanceExamples.personal

  return `You are a structured decision-support writer for Kairos v15.0.

DECISION CONTEXT:
- Type: ${ctx.label}
- Intensity: ${intensity}
- Question: ${question}
- User context: ${context || 'none'}
- Profile type: ${profile?.type || 'none'}

FIXED ENGINE VALUES — embed exactly:
- Decision label: ${dLabel}
- Action: ${action}
- Best window: ${result.best_time}
- Avoid window: ${result.avoid_time}
- Confidence: ${result.confidence}

ASTRO REASONING (use 2–3 of these naturally):
- Dominant dimension: ${r.dimHuman} (score: ${result.dimScore})
- Moon in ${r.nakshatraName || 'Nakshatra'}: ${r.nakshatraLabel || 'adds its character'}
- Moon sign today: ${r.moonSignName || 'not set'} (${r.moonSignCultural || ''})
- Active Dasha: ${r.dashaLabel} — shapes the underlying life-phase energy
${r.interactNote ? `- Interaction: ${r.interactNote}` : ''}
- ${culturalLine}
${traitHint ? `- ${traitHint}` : ''}

${toneGuide}

STRUCTURE — produce exactly this JSON:
{
  "decision": "${r.decision}",
  "decision_label": "${dLabel}",
  "action": "${action}",
  "best_time": "${result.best_time}",
  "avoid_time": "${result.avoid_time}",
  "message": "<1-2 sentences: reason + one astro reference (nakshatra, moon sign, or dasha)>",
  "balance": "<1 sentence pros/cons — ${balanceGuide}>",
  "confidence": ${result.confidence}
}

RULES:
1. message: state reason using ${r.dimHuman}; include one natural reference to nakshatra OR moon sign OR dasha. Max 2 sentences.
2. balance: one sentence, genuinely balanced. ${riskLine ? riskLine : 'No special risk note.'}
3. ${nameLine}
4. No markdown. Strict JSON only.`
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
    const traits = {
      ...rawTraits,
      decision_bias:  rawTraits.decision_bias  + fbDecBias,
      risk_tolerance: rawTraits.risk_tolerance + fbRiskAdj
    }
    const lagna        = computeLagna(profile?.birth_time || null)
    const transits     = getTransits()

    // Moon-cycle derived values
    const mc           = getMoonCycle()
    const realNaksh    = getMoonNakshatra(mc)
    const moonSign     = getMoonSign(mc)
    const realTithi    = getTithi()
    const dasha        = getMoonDasha(mc)

    const transitDelta = aggregateTransits(transits, lagna, moonSign)
    const domTransit   = dominantTransit(transits)
    const slots        = scoredSlots(seed, planet, profile?.type || null, lunar, dayType, traits, lagna, moonSign, transitDelta, realTithi, realNaksh)
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
      decision:  result.decision,
      realTithi,
      realNaksh
    })
    reasoning.ctxHuman = DIM_LABEL[ctx.primary] || ctx.primary
    reasoning.dimHuman = DIM_LABEL[dominant]     || dominant

    // Use adjusted confidence throughout prompt and response
    const intensity = detectIntensity(question, context)
    const resultWithAdj = { ...result, confidence: adjustedConfidence }
    const prompt = buildPrompt(resultWithAdj, reasoning, ctx, question, context, profile, intensity)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 350,
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
      decision:       json.decision,
      decision_label: json.decision_label || json.decision.toUpperCase(),
      action:         json.action || null,
      best_time:      result.best_time,
      avoid_time:     result.avoid_time,
      next_best:      result.next_best,
      message:        json.message,
      balance:        json.balance || null,
      confidence:     adjustedConfidence,
      planet:      planet.name,
      lunar_phase: lunar.name,
      vara:        planet.name,   // Vara IS the weekday planet
      tithi:       realTithi.tithi,
      nakshatra:   realNaksh.name,
      moon_sign:   moonSign?.name || null,
      dasha:       dasha,
      lagna:       lagna?.name    || null,
      moon_sign:   moonSign?.name || null,
      transit:     domTransit ? { planet: domTransit.planet, sign: domTransit.sign } : null,
      context:     ctx.label
    })
  } catch {
    return res.status(200).json(FALLBACK)
  }
}
