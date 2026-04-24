export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const hour = new Date().getHours()

  const prompt = `You generate daily guidance.

TASK:
- Identify golden window
- Provide do / avoid / watch
- Current hour is ${hour}

OUTPUT (STRICT JSON — no extra text, no markdown):
{
  "golden_window": "...",
  "do": "...",
  "avoid": "...",
  "watch": "...",
  "confidence_summary": number
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
    res.status(200).json({
      golden_window: '11:10 AM – 12:20 PM',
      do: 'Have important conversations',
      avoid: 'Avoid financial decisions after 4 PM',
      watch: 'Energy dip in afternoon',
      confidence_summary: 78
    })
  }
}
