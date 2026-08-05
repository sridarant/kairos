/**
 * /api/explain.js — Layer 4: Language Generation
 *
 * Claude's ONLY responsibility: convert a structured DecisionObject into
 * concise, natural language.
 *
 * Claude NEVER decides:
 *   - DO / WAIT / AVOID
 *   - timing windows
 *   - confidence levels
 *   - category scores
 *   - recommendations
 *
 * These are ALL computed deterministically before this API is called.
 * Claude only converts structured signals into readable prose.
 */

// ─── Safe schema validation ───────────────────────────────────────────────────
const REQUIRED_FIELDS = ['decision', 'confidence', 'goldenWindow']

function validateDecisionObject(obj) {
  if (!obj || typeof obj !== 'object') return false
  return REQUIRED_FIELDS.every(k => obj[k] !== undefined)
}

// ─── Parse Claude response safely ─────────────────────────────────────────────
function safeParse(text) {
  if (!text) return null
  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null
    const parsed = JSON.parse(match[0])
    // Validate required fields
    if (!parsed.explanation || typeof parsed.explanation !== 'string') return null
    if (parsed.explanation.length < 10 || parsed.explanation.length > 400) return null
    return parsed
  } catch { return null }
}

// ─── Fallback explanation (no Claude needed) ──────────────────────────────────
function buildFallback(decisionObj) {
  const { decision, confidence, goldenWindow, avoidWindow, _panchang, _dasha } = decisionObj || {}
  const verb   = decision === 'DO' ? 'Conditions support action' : decision === 'AVOID' ? 'Conditions call for caution' : 'Conditions are mixed'
  const nak    = _panchang?.nakshatra?.name || ''
  const dasha  = _dasha?.currentLord || ''
  const window = goldenWindow ? ` Your strongest window is ${goldenWindow}.` : ''
  const astro  = nak ? ` ${nak} nakshatra${dasha ? ` and ${dasha} Dasha` : ''} shape today's energy.` : ''
  return `${verb} today — ${confidence?.toLowerCase() || 'moderate'} signal.${window}${astro}`
}

// ─── Build the prompt sent to Claude ─────────────────────────────────────────

/**
 * buildPromptFromMeta: uses structured reasoning metadata from the reasoning engine.
 * Richer and more traceable than the fallback prompt.
 */
function buildPromptFromMeta(question, decisionObj, meta) {
  const { decision, confidence, goldenWindow, avoidWindow } = decisionObj
  return `You are the language layer of Kairos, a Vedic astrology decision companion.

The reasoning engine has already determined the following structured output.
Your ONLY job is to write 1–2 natural sentences. Do NOT change any values.

USER QUESTION: "${question}"

ENGINE OUTPUT (fixed — do not alter):
- Decision: ${decision}
- Confidence: ${confidence}
- Best window: ${goldenWindow}
- Avoid after: ${avoidWindow || 'none'}

REASONING CHAIN:
${(meta.decisionRationale || []).join('\n')}

KEY FACTORS:
- Primary driver: ${meta.dominantFactor}
- Supporting: ${(meta.supportingFactors || []).join('; ') || 'none'}
- Conflict: ${(meta.conflictingFactors || []).join('; ') || 'none'}
- ${meta.conflictNote || 'No significant conflict today.'}

CONTEXT:
- Dasha: ${meta.dashaContext}
- Nakshatra: ${meta.nakshatraContext || 'not available'}
- Tithi: ${meta.tithiContext || 'not available'}

INSTRUCTIONS:
1. Write exactly 1–2 sentences.
2. Reference the nakshatra, dasha, or dominant factor naturally.
3. If decision is DO: affirm the action in the context of the question.
4. If decision is WAIT: suggest the best window (${goldenWindow}).
5. If decision is AVOID: advise caution clearly but constructively.
6. If there is a conflict note, weave it in once, briefly.
7. Never mention percentages, scores, or engine internals.
8. Tone: calm, trustworthy, direct.

OUTPUT (strict JSON only):
{ "explanation": "..." }\``
}

function buildPrompt(question, decisionObj) {
  const {
    decision, confidence, goldenWindow, avoidWindow,
    _panchang, _dasha, _yogas, _lagna, signals, _nakshatraFx,
    explanationMeta
  } = decisionObj

  // Use pre-built explanation metadata from reasoning engine when available
  if (explanationMeta) {
    return buildPromptFromMeta(question, decisionObj, explanationMeta)
  }

  // Structured signals summary
  const positives = (signals?.positive || []).slice(0, 3).map(s => s.split(':').slice(1).join(': '))
  const cautions  = (signals?.caution  || []).slice(0, 2).map(s => s.split(':').slice(1).join(': '))
  const yogaNames = (_yogas || []).map(y => y.name).join(', ') || 'none active'

  return `You are the language layer of Kairos, a Vedic astrology decision companion.

The decision engine has already produced the following structured output. 
Your ONLY job is to convert it into concise, natural English. 
Do NOT change, invent, or override any of these values.

USER QUESTION:
"${question}"

ENGINE OUTPUT (do not change these):
- Decision: ${decision}
- Confidence: ${confidence}
- Best window: ${goldenWindow}
- Avoid window: ${avoidWindow || 'none'}
- Nakshatra: ${_panchang?.nakshatra?.name} (${_nakshatraFx?.label || ''})
- Tithi: ${_panchang?.tithi?.name} (${_panchang?.tithi?.phase})
- Dasha: ${_dasha?.currentLord} Mahadasha / ${_dasha?.currentSub} Antardasha
- Active yogas: ${yogaNames}
- Lagna: ${_lagna?.signName || 'unknown'}
- Positive signals: ${positives.join(' | ') || 'none'}
- Caution signals: ${cautions.join(' | ') || 'none'}

INSTRUCTIONS:
- Write 1–2 sentences maximum.
- Reference the nakshatra, dasha or tithi naturally — do NOT list them mechanically.
- If decision is DO: affirm the action in the context of the question.
- If decision is WAIT: suggest timing. Reference goldenWindow.
- If decision is AVOID: advise caution clearly but constructively.
- Do NOT mention percentages or raw numbers.
- Do NOT say "the engine says" or "according to the data".
- Tone: calm, trustworthy, concise.

OUTPUT (strict JSON only, no markdown):
{ "explanation": "..." }`
}

// ─── API call with retry ───────────────────────────────────────────────────────
async function callClaude(prompt, apiKey) {
  const opts = {
    method:'POST',
    headers:{ 'x-api-key':apiKey, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
    body: JSON.stringify({ model:'claude-haiku-4-5', max_tokens:200, messages:[{ role:'user', content:prompt }] })
  }
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', opts)
    if (r.ok) return r
    // 1 retry after 700ms
    await new Promise(res => setTimeout(res, 700))
    return fetch('https://api.anthropic.com/v1/messages', opts)
  } catch { return null }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { question, decisionObject } = req.body || {}

  if (!question) return res.status(400).json({ error: 'question required' })

  // Validate the decision object before doing anything
  if (!validateDecisionObject(decisionObject)) {
    return res.status(400).json({
      error: 'invalid_decision_object',
      explanation: buildFallback(decisionObject)
    })
  }

  // If no API key, return fallback immediately (no error)
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(200).json({
      explanation: buildFallback(decisionObject),
      source: 'fallback'
    })
  }

  try {
    const prompt  = buildPrompt(question, decisionObject)
    const response = await callClaude(prompt, process.env.ANTHROPIC_API_KEY)

    if (!response?.ok) {
      return res.status(200).json({ explanation: buildFallback(decisionObject), source: 'fallback' })
    }

    const data   = await response.json()
    const text   = data?.content?.[0]?.text || ''
    const parsed = safeParse(text)

    if (!parsed) {
      return res.status(200).json({ explanation: buildFallback(decisionObject), source: 'fallback' })
    }

    return res.status(200).json({
      explanation: parsed.explanation,
      source: 'claude'
    })
  } catch {
    return res.status(200).json({ explanation: buildFallback(decisionObject), source: 'fallback' })
  }
}
