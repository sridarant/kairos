import {
  scoredSlots, buildSeed, buildTraits, getPlanet, getLunarPhase, getDayType,
  dominantDimension, toConfidence, DIM_LABEL, buildReasoning
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
  if (/work|job|career|boss|colleague|project|deadline|client|meeting|office/.test(q))
    return { primary: 'decision', secondary: 'communication', label: 'work' }
  if (/money|invest|financial|fund|budget|cost|price|salary|loan|debt/.test(q))
    return { primary: 'risk', secondary: 'decision', label: 'money' }
  if (/learn|study|course|skill|read|practice|train|exam|school|university/.test(q))
    return { primary: 'focus', secondary: 'decision', label: 'learning' }
  if (/talk|relationship|friend|family|partner|conflict|conversation|discuss|call|message/.test(q))
    return { primary: 'communication', secondary: 'focus', label: 'relationships' }
  return { primary: 'decision', secondary: 'communication', label: 'general' }
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

  return {
    decision,
    best_time:  best.time,
    avoid_time: worst.time,
    confidence: toConfidence(best.score, worst.score),
    dimScore,
    riskScore
  }
}

function buildPrompt(result, r, question, context, profile) {
  const decisionGuide = {
    do:    'Affirm the action clearly — explain why conditions support it.',
    avoid: 'Discourage the action — explain which dimension is unfavourable.',
    wait:  'Recommend patience — conditions are not yet aligned.'
  }[r.decision]

  const riskLine = r.riskFlag === 'elevated'
    ? 'Risk is elevated — include a brief caution.'
    : r.riskFlag === 'reduced'
    ? 'Risk appetite is reduced — conservative actions are favoured.'
    : 'Risk is neutral — no need to mention it.'

  const nameInstruction = profile?.name
    ? `Address ${profile.name.split(' ')[0]} by first name once at the start.`
    : 'Do not use a name.'

  // Pick the single most relevant trait line for personalisation
  const traitHint = r.traitLines && r.traitLines.length > 0
    ? `Personalisation hint (weave in naturally, once): "${r.traitLines[0]}"`
    : 'No personalisation hint.'

  return `You are a decision-support message writer for Kairos v4.1.

FIXED VALUES — do not change:
- decision: ${result.decision}
- best_time: ${result.best_time}
- avoid_time: ${result.avoid_time}
- confidence: ${result.confidence}

INTERNAL REASONING — use to write the message:
- Question: ${question}
- Context: ${r.ctxHuman} (score: ${result.dimScore})
- Planetary influence: ${r.planetLabel} — ${r.planetInfluence}
- Lunar phase: ${r.lunarPhase} — ${r.lunarLabel}
- Day archetype: ${r.dayTypeName} — ${r.dayTypeLabel}
- Nakshatra: ${r.nakshatraCultural} — ${r.nakshatraLabel}
- Dominant dimension: ${r.dimHuman}
- User context: ${context || 'none'}
- Profile type: ${profile?.type || 'none'}

USER TRAIT:
- ${traitHint}

WRITING RULES:
1. ${decisionGuide}
2. Mention ${r.ctxHuman} naturally — not as a label.
3. Reference the planetary influence using the format "${r.planetLabel}" once, naturally. Do not use the word "planet".
4. Optionally include the nakshatra name (${r.nakshatraCultural}) if it adds meaning — keep it brief.
5. ${riskLine}
6. ${nameInstruction}
7. If a trait hint is given, include it naturally — do not quote it verbatim.
8. 1–2 sentences max. Confident, human, specific.

OUTPUT — strict JSON only, no markdown:
{
  "decision": "${result.decision}",
  "best_time": "${result.best_time}",
  "avoid_time": "${result.avoid_time}",
  "message": "...",
  "confidence": ${result.confidence}
}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, context, profile } = req.body || {}
  if (!question) return res.status(400).json(FALLBACK)

  try {
    const planet   = getPlanet()
    const lunar    = getLunarPhase()
    const dayType  = getDayType()
    const seed     = buildSeed(profile?.dob || null)
    const traits   = buildTraits(profile?.dob || null)
    const slots    = scoredSlots(seed, planet, profile?.type || null, lunar, dayType, traits)
    const ctx      = detectContext(question)
    const result   = evaluate(slots, ctx)
    const dominant = dominantDimension(planet, lunar, traits)

    const reasoning = buildReasoning({
      planet, lunar, dayType, traits, dominant,
      ctx:       ctx.primary,
      dimScore:  result.dimScore,
      riskScore: result.riskScore,
      decision:  result.decision
    })
    reasoning.ctxHuman = DIM_LABEL[ctx.primary] || ctx.primary
    reasoning.dimHuman = DIM_LABEL[dominant]     || dominant

    const prompt = buildPrompt(result, reasoning, question, context, profile)

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 240,
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
      message:     json.message,
      confidence:  result.confidence,
      planet:      planet.name,
      lunar_phase: lunar.name,
      day_type:    dayType.name,
      context:     ctx.label
    })
  } catch {
    return res.status(200).json(FALLBACK)
  }
}
