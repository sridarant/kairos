import { scoredSlots, buildSeed } from './daily.js'

const FALLBACK = {
  decision: 'wait',
  best_time: null,
  avoid_time: null,
  message: 'Unable to fetch guidance. Try again.',
  confidence: 0
}

function detectDimension(question) {
  const q = question.toLowerCase()
  if (/talk|meeting|conversation|discuss|call|message/.test(q)) return 'communication'
  if (/money|invest|financial|fund|budget|cost|price/.test(q))  return 'risk'
  if (/decision|choose|offer|pick|select|option|should i/.test(q)) return 'decision'
  return 'decision'
}

function evaluate(slots, dimension) {
  const sorted  = [...slots].sort((a, b) => b.score - a.score)
  const best    = sorted[0]
  const worst   = sorted[sorted.length - 1]
  const hour    = new Date().getHours()
  const current = slots.find(s => {
    const [h] = s.time.split('–')[0].split(':').map(Number)
    return hour >= h && hour < h + 2
  }) || slots[0]

  const dimScore  = current[dimension] ?? current.decision
  const riskScore = current.risk

  let decision
  if (dimScore >= 1 && riskScore >= 0)        decision = 'do'
  else if (riskScore <= -1 || dimScore <= -1) decision = 'avoid'
  else                                         decision = 'wait'

  const confidence = Math.min(100, Math.max(0,
    Math.round(((best.score + 6) / 12) * 100)
  ))

  return { decision, best_time: best.time, avoid_time: worst.time, confidence, dimension, dimScore, riskScore }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, context, profile } = req.body || {}
  if (!question) return res.status(400).json(FALLBACK)

  try {
    const seed      = buildSeed(profile?.dob || null)
    const slots     = scoredSlots(seed)
    const dimension = detectDimension(question)
    const result    = evaluate(slots, dimension)

    const userName = profile?.name ? `User: ${profile.name}. ` : ''
    const userType = profile?.type ? `Type: ${profile.type}. ` : ''

    const prompt = `You are a decision-support message writer.

STRUCTURED DATA (do not change these values):
- decision: ${result.decision}
- best_time: ${result.best_time}
- avoid_time: ${result.avoid_time}
- confidence: ${result.confidence}
- dimension scored: ${dimension} (score: ${result.dimScore})
- risk score: ${result.riskScore}
- question: ${question}
- context: ${context || 'none'}
- ${userName}${userType}

TASK:
Write a short 1–2 sentence "message" explaining the decision naturally.
Reference the question topic and user name if provided.
Do NOT invent new logic — use only the data above.

OUTPUT (STRICT JSON — no extra text):
{
  "decision": "${result.decision}",
  "best_time": "${result.best_time}",
  "avoid_time": "${result.avoid_time}",
  "message": "...",
  "confidence": ${result.confidence}
}`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
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
      decision:   json.decision,
      best_time:  result.best_time,
      avoid_time: result.avoid_time,
      message:    json.message,
      confidence: result.confidence
    })
  } catch {
    return res.status(200).json(FALLBACK)
  }
}
