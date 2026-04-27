const KEYS = {
  sessions:   'kairos_sessions',
  askClicks:  'kairos_ask_clicks',
  lastOpen:   'kairos_last_open',
  actionLog:  'kairos_action_log',   // {id, question, decision, acted} last 10
}

// Call on every app mount
export function trackAppOpen() {
  try {
    const now = Date.now()
    localStorage.setItem(KEYS.lastOpen, now.toString())
    const count = parseInt(localStorage.getItem(KEYS.sessions) || '0', 10)
    localStorage.setItem(KEYS.sessions, (count + 1).toString())
  } catch {}
}

// Call when Ask button is tapped
export function trackAskClick() {
  try {
    const count = parseInt(localStorage.getItem(KEYS.askClicks) || '0', 10)
    localStorage.setItem(KEYS.askClicks, (count + 1).toString())
  } catch {}
}

// Store action-taken response for an ask entry
export function trackActionTaken(id, acted) {
  try {
    const log = getActionLog()
    const idx = log.findIndex(e => e.id === id)
    if (idx !== -1) {
      log[idx].acted = acted
      localStorage.setItem(KEYS.actionLog, JSON.stringify(log))
    }
  } catch {}
}

// Add a new entry to the action log (call after saveEntry)
export function addActionEntry(entry) {
  try {
    const log = getActionLog()
    log.unshift({ id: entry.id, question: entry.question, decision: entry.decision, acted: null })
    localStorage.setItem(KEYS.actionLog, JSON.stringify(log.slice(0, 10)))
  } catch {}
}

export function getActionLog() {
  try { return JSON.parse(localStorage.getItem(KEYS.actionLog) || '[]') } catch { return [] }
}

// Returns { sessionCount, askClicks, actionRate, actionRateDisplay }
export function getAnalytics() {
  try {
    const sessionCount = parseInt(localStorage.getItem(KEYS.sessions) || '0', 10)
    const askClicks    = parseInt(localStorage.getItem(KEYS.askClicks) || '0', 10)
    const log          = getActionLog()
    const rated        = log.filter(e => e.acted !== null)
    const acted        = rated.filter(e => e.acted === true).length
    const actionRate   = rated.length > 0 ? Math.round((acted / rated.length) * 100) : null
    return { sessionCount, askClicks, actionRate, actionRateDisplay: actionRate !== null ? `${actionRate}%` : null }
  } catch {
    return { sessionCount: 0, askClicks: 0, actionRate: null, actionRateDisplay: null }
  }
}
