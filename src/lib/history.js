const KEY = 'kairos_history'
const MAX = 20

export function loadHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

export function saveEntry(entry) {
  try {
    const history = loadHistory()
    const newEntry = { ...entry, id: Date.now(), timestamp: new Date().toISOString(), outcome: null }
    history.unshift(newEntry)
    localStorage.setItem(KEY, JSON.stringify(history.slice(0, MAX)))
    return newEntry
  } catch { return null }
}

export function updateOutcome(id, outcome) {
  try {
    const history = loadHistory()
    const idx = history.findIndex(e => e.id === id)
    if (idx !== -1) {
      history[idx].outcome = outcome
      localStorage.setItem(KEY, JSON.stringify(history))
    }
  } catch {}
}

export function computeFeedbackAdj(history) {
  const recent = history.filter(e => e.outcome !== null).slice(0, 10)
  if (recent.length === 0) return { successRate: null, decisionBias: 0, riskAdj: 0, confidenceMultiplier: 1 }
  const successes   = recent.filter(e => e.outcome === 'success').length
  const successRate = successes / recent.length
  return {
    successRate,
    decisionBias:          successRate >= 0.7 ? 1 : successRate <= 0.3 ? -1 : 0,
    riskAdj:               successRate <= 0.3 ? 1 : 0,
    confidenceMultiplier:  0.85 + (successRate * 0.25)
  }
}

// Short insight derived from history patterns
export function computeInsight(history) {
  const rated = history.filter(e => e.outcome !== null)
  if (rated.length < 3) return null

  const earlyOk = rated.filter(e => e.outcome === 'success' && e.timestamp && new Date(e.timestamp).getHours() < 12).length
  const lateOk  = rated.filter(e => e.outcome === 'success' && e.timestamp && new Date(e.timestamp).getHours() >= 12).length
  const doOk    = rated.filter(e => e.outcome === 'success' && e.decision === 'do').length
  const waitOk  = rated.filter(e => e.outcome === 'success' && e.decision === 'wait').length
  const total   = rated.length
  const ok      = rated.filter(e => e.outcome === 'success').length

  if (earlyOk > lateOk + 1)    return 'You perform better when acting early in the day.'
  if (lateOk > earlyOk + 1)    return 'Your afternoon decisions tend to work out well.'
  if (doOk >= 2 && doOk > waitOk) return 'Acting decisively has paid off for you recently.'
  if (waitOk >= 2)              return 'Patience has been working in your favour.'
  if (ok > (total - ok) * 2)   return 'Your guidance accuracy has been high — keep trusting it.'
  if ((total - ok) > ok)        return 'Outcomes have been mixed — consider waiting for clearer windows.'
  return 'Your decision patterns are building — keep logging outcomes.'
}

// Minutes until the start of a window string like "09:00–11:00". Null if already started.
export function minsUntilWindow(windowStr) {
  if (!windowStr) return null
  const start = windowStr.split('–')[0]?.trim()
  if (!start) return null
  const [h, m] = start.split(':').map(Number)
  if (isNaN(h)) return null
  const now  = new Date()
  const then = new Date()
  then.setHours(h, m || 0, 0, 0)
  const diff = Math.round((then - now) / 60000)
  return diff > 0 ? diff : null
}
