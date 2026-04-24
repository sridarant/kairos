export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, context } = req.body || {}
  if (!question) return res.status(400).json({ error: 'question required' })

  const hour = new Date().getHours()
  const timeSlots = Array.from({ length: 24 }, (_, i) => ({
    hour: i,
    score: Math.round(50 + 30 * Math.sin((i - 6) * Math.PI / 12))
  }))

  const prompt = `You are a decision-support system.

INPUT:
- question: ${question}
- context: ${context || 'none'}
- current hour: ${hour}
- time slot scores: ${JSON.stringify(timeSlots)}

TASK:
- Determine DO / AVOID / WAIT
- Provide best_time and avoid_time (HH:MM–HH:MM format, or null)
- Provide short message (max 2 sentences)

OUTPUT (STRICT JSON — no extra text, no markdown):
{
  "decision": "do" | "avoid" | "wait",
  "best_time": "HH:MM–HH:MM or null",
  "avoid_time": "HH:MM–HH:MM or null",
  "message": "string",
  "confidence": number
}`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 300,
        messages: [{ role: 'user', content: prompt }]
      })
    })
    const data = await response.json()
    const text = data.content?.[0]?.text || ''
    const json = JSON.parse(text.replace(/```json|```/g, '').trim())
    res.status(200).json(json)
  } catch {
    res.status(500).json({ error: 'AI request failed' })
  }
}
