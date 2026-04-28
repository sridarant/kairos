// /src/lib/dataClient.js
// Thin client for /api/data. Falls back to in-memory store if API is
// unavailable so the UI never breaks. localStorage is used ONLY as a
// resilience cache for the userId — not as source of truth for data.

const API = '/api/data'

// ─── userId (stable anonymous identifier, persisted in localStorage only) ────
function getUserId() {
  try {
    let id = localStorage.getItem('kairos_uid')
    if (!id) {
      id = `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      localStorage.setItem('kairos_uid', id)
    }
    return id
  } catch {
    return 'default'
  }
}

// ─── In-memory fallback ───────────────────────────────────────────────────────
let _memStore = {
  user_profile: null,
  history:      [],
  feedback:     [],
  usage_stats:  { sessions: 0, ask_clicks: 0, last_open: null }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
async function apiGet() {
  const uid = getUserId()
  try {
    const res = await fetch(`${API}?userId=${uid}`)
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    return _memStore
  }
}

async function apiPost(action, body = {}) {
  const uid = getUserId()
  try {
    const res = await fetch(`${API}?action=${action}&userId=${uid}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ ...body, userId: uid, action })
    })
    if (!res.ok) throw new Error()
    return await res.json()
  } catch {
    // Apply optimistic update to in-memory fallback
    _applyFallback(action, body)
    return { ok: true, fallback: true }
  }
}

function _applyFallback(action, body) {
  switch (action) {
    case 'save_profile':
      _memStore.user_profile = body.user_profile ?? _memStore.user_profile
      break
    case 'add_history': {
      const entry = { id: Date.now(), timestamp: new Date().toISOString(),
        question: body.question, decision: body.decision,
        confidence: body.confidence, outcome: null, acted: null }
      _memStore.history = [entry, ..._memStore.history].slice(0, 20)
      break
    }
    case 'update_outcome':
      _memStore.history = _memStore.history.map(e =>
        e.id === body.id ? { ...e, outcome: body.outcome ?? e.outcome, acted: body.acted ?? e.acted } : e
      )
      break
    case 'track_open':
      _memStore.usage_stats.sessions += 1
      _memStore.usage_stats.last_open = new Date().toISOString()
      break
    case 'track_ask':
      _memStore.usage_stats.ask_clicks += 1
      break
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getUserData()               { return apiGet() }
export async function saveProfile(user_profile)   { return apiPost('save_profile', { user_profile }) }
export async function addHistory(entry)            { return apiPost('add_history', entry) }
export async function updateOutcome(id, outcome, acted) {
  return apiPost('update_outcome', { id, outcome, acted })
}
export async function trackOpen()  { return apiPost('track_open') }
export async function trackAsk()   { return apiPost('track_ask') }

// ─── Derived analytics (computed client-side from history) ───────────────────
export function computeAnalytics(history = []) {
  const rated   = history.filter(e => e.outcome !== null)
  const ok      = rated.filter(e => e.outcome === 'success').length
  const acted   = history.filter(e => e.acted === true).length
  const actable = history.filter(e => e.acted !== null).length
  const actionRate   = actable > 0 ? Math.round((acted / actable) * 100) : null
  const successRate  = rated.length > 0 ? ok / rated.length : null
  return {
    sessionCount:        null,   // comes from API
    actionRate,
    actionRateDisplay:   actionRate !== null ? `${actionRate}%` : null,
    successRate,
    decisionBias:        successRate !== null ? (successRate >= 0.7 ? 1 : successRate <= 0.3 ? -1 : 0) : 0,
    riskAdj:             successRate !== null && successRate <= 0.3 ? 1 : 0,
    confidenceMultiplier: successRate !== null ? 0.85 + (successRate * 0.25) : 1
  }
}

// ─── Insight string from history ──────────────────────────────────────────────
export function computeInsight(history = []) {
  const rated = history.filter(e => e.outcome !== null)
  if (rated.length < 3) return null
  const earlyOk = rated.filter(e => e.outcome === 'success' && e.timestamp && new Date(e.timestamp).getHours() < 12).length
  const lateOk  = rated.filter(e => e.outcome === 'success' && e.timestamp && new Date(e.timestamp).getHours() >= 12).length
  const doOk    = rated.filter(e => e.outcome === 'success' && e.decision === 'do').length
  const waitOk  = rated.filter(e => e.outcome === 'success' && e.decision === 'wait').length
  const total   = rated.length
  const ok      = rated.filter(e => e.outcome === 'success').length
  if (earlyOk > lateOk + 1)       return 'You perform better when acting early in the day.'
  if (lateOk > earlyOk + 1)       return 'Your afternoon decisions tend to work out well.'
  if (doOk >= 2 && doOk > waitOk) return 'Acting decisively has paid off for you recently.'
  if (waitOk >= 2)                 return 'Patience has been working in your favour.'
  if (ok > (total - ok) * 2)      return 'Your guidance accuracy has been high — keep trusting it.'
  if ((total - ok) > ok)          return 'Outcomes have been mixed — wait for clearer windows.'
  return 'Your decision patterns are building — keep logging outcomes.'
}

export function minsUntilWindow(windowStr) {
  if (!windowStr) return null
  const start = windowStr.split('–')[0]?.trim()
  if (!start) return null
  const [h, m] = start.split(':').map(Number)
  if (isNaN(h)) return null
  const now  = new Date(), then = new Date()
  then.setHours(h, m || 0, 0, 0)
  const diff = Math.round((then - now) / 60000)
  return diff > 0 ? diff : null
}
