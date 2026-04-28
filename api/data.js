// /api/data.js — Central data API
// Stores user profiles, history, feedback, and usage stats server-side.
// Uses in-memory store (Map) as primary; resets on cold start.
// For production, replace _store with a real DB (Vercel KV, Upstash, etc.).
// All endpoints accept a userId (from client) to namespace data.

// ─── In-memory store (per-process, resets on cold start) ─────────────────────
const _store = new Map()

function getRecord(userId) {
  return _store.get(userId) || {
    user_profile: null,
    history:      [],       // last 20 ask interactions
    feedback:     [],       // outcome-rated entries
    usage_stats:  { sessions: 0, ask_clicks: 0, last_open: null }
  }
}

function setRecord(userId, data) {
  _store.set(userId, data)
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function trimHistory(arr, max = 20) {
  return arr.slice(0, max)
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  const { method, query, body } = req

  // userId is passed as a query param or in body; defaults to 'default'
  const userId = query.userId || body?.userId || 'default'

  // ── GET /api/data → return full record ──────────────────────────────────────
  if (method === 'GET') {
    return res.status(200).json(getRecord(userId))
  }

  // ── POST /api/data?action=X ─────────────────────────────────────────────────
  if (method === 'POST') {
    const action  = query.action || body?.action
    const record  = getRecord(userId)

    switch (action) {

      // Save / update user profile (array of users)
      case 'save_profile': {
        record.user_profile = body.user_profile ?? record.user_profile
        setRecord(userId, record)
        return res.status(200).json({ ok: true })
      }

      // Append a new ask history entry
      case 'add_history': {
        const entry = {
          id:        Date.now(),
          timestamp: new Date().toISOString(),
          question:  body.question,
          decision:  body.decision,
          confidence: body.confidence,
          outcome:   null,
          acted:     null
        }
        record.history = trimHistory([entry, ...record.history])
        setRecord(userId, record)
        return res.status(200).json({ ok: true, id: entry.id })
      }

      // Update outcome (feedback) for a history entry
      case 'update_outcome': {
        const { id, outcome, acted } = body
        record.history = record.history.map(e =>
          e.id === id ? { ...e, outcome: outcome ?? e.outcome, acted: acted ?? e.acted } : e
        )
        setRecord(userId, record)
        return res.status(200).json({ ok: true })
      }

      // Track app open / session
      case 'track_open': {
        record.usage_stats.sessions   += 1
        record.usage_stats.last_open   = new Date().toISOString()
        setRecord(userId, record)
        return res.status(200).json({ ok: true })
      }

      // Track ask click
      case 'track_ask': {
        record.usage_stats.ask_clicks += 1
        setRecord(userId, record)
        return res.status(200).json({ ok: true })
      }

      default:
        return res.status(400).json({ error: 'unknown action' })
    }
  }

  return res.status(405).end()
}
