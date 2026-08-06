/**
 * /src/lib/dataClient.js
 *
 * Thin client for /api/data. Falls back to in-memory store if API is
 * unavailable so the UI never breaks.
 * localStorage is used ONLY for the stable anonymous userId.
 */

const API = '/api/data'

// ─── Stable anonymous userId ──────────────────────────────────────────────────
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

// ─── In-memory fallback (used when /api/data is unavailable) ─────────────────
let _mem = {
  user_profile: null,
  history:      [],
  feedback:     [],
  usage_stats:  { sessions: 0, last_open: null }
}

// ─── Core fetch wrappers ──────────────────────────────────────────────────────
async function apiGet() {
  const uid = getUserId()
  try {
    const res = await fetch(`${API}?userId=${encodeURIComponent(uid)}`)
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.json()
  } catch {
    return { ..._mem }
  }
}

async function apiPost(action, body = {}) {
  const uid = getUserId()
  try {
    const res = await fetch(API, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ userId: uid, action, ...body })
    })
    if (!res.ok) throw new Error(`${res.status}`)
    return await res.json()
  } catch {
    // Optimistic in-memory update so UI reflects change immediately
    _applyFallback(action, body)
    return { ok: true, fallback: true }
  }
}

function _applyFallback(action, body) {
  switch (action) {
    case 'save_profile':
      _mem.user_profile = body.user_profile ?? _mem.user_profile; break
    case 'add_history':
      _mem.history = [{ ...body, timestamp: new Date().toISOString() }, ..._mem.history].slice(0, 500); break
    case 'track_feedback':
      _mem.feedback = [..._mem.feedback, { category: body.category, outcome: body.outcome, timestamp: new Date().toISOString() }].slice(-500); break
    case 'track_open':
      _mem.usage_stats.sessions += 1; _mem.usage_stats.last_open = new Date().toISOString(); break
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────
export async function getUserData()             { return apiGet() }
export async function saveProfile(user_profile) { return apiPost('save_profile', { user_profile }) }
export async function addHistory(entry)         { return apiPost('add_history', entry) }
export async function trackOpen()               { return apiPost('track_open') }
export async function trackFeedback(category, action, outcome) {
  return apiPost('track_feedback', { category, action: String(action).slice(0,100), outcome })
}

export function computeAnalytics(history = []) {
  if (!history?.length) return {}
  const days = [...new Set(history.map(e => e.timestamp?.slice(0,10)).filter(Boolean))]
  const actions = history.filter(e => e.outcome === 'helpful' || e.acted === true)
  const actionRate = days.length ? Math.round(actions.length / days.length * 100) : 0
  // Best day by frequency of helpful actions
  const dayCounts = {}
  for (const h of history) {
    if (h.timestamp) {
      const day = new Date(h.timestamp).toLocaleDateString('en-US', { weekday:'long' })
      dayCounts[day] = (dayCounts[day] || 0) + 1
    }
  }
  const bestDay = Object.entries(dayCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || null
  return { totalDays: days.length, actionRate, bestDay, bestWindow: null }
}

export function computeInsight(history = []) {
  if (!history?.length) return null
  const recent  = history.slice(0, 7)
  const helpful = recent.filter(e => e.outcome === 'helpful').length
  if (helpful >= 5) return 'You consistently act on recommendations — your planning is working well.'
  if (helpful >= 3) return 'You act on about half of your recommendations — good engagement.'
  return 'Try acting on one recommendation this week to build a planning habit.'
}

export function minsUntilWindow(windowStr) {
  if (!windowStr) return null
  const start = windowStr.split('–')[0]?.trim()
  if (!start) return null
  const [hh = '0', mm = '0'] = start.split(':')
  const now  = new Date()
  const win  = new Date(now)
  win.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0)
  const diff = Math.round((win - now) / 60000)
  return diff > 0 && diff < 480 ? diff : null
}
