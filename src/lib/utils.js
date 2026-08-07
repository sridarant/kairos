/**
 * /src/lib/utils.js — Pure utility functions.
 * No localStorage. No API calls. No side effects.
 */

/**
 * minsUntilWindow("09:00–11:00") → minutes until start, or null if past/irrelevant.
 */
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
  return diff > 0 && diff < 480 ? diff : null
}

/**
 * computeInsight(feedbackHistory[]) → one-line insight string or null.
 */
export function computeInsight(history = []) {
  if (!history?.length) return null
  const rated = history.filter(e => e.outcome)
  if (rated.length < 3) return null
  const ok    = rated.filter(e => e.outcome === 'helpful').length
  const total = rated.length
  if (ok >= Math.ceil(total * 0.7)) return 'You consistently act on recommendations — keep trusting the guidance.'
  if (ok >= Math.ceil(total * 0.4)) return 'You act on about half of your recommendations — good engagement.'
  return 'Try acting on one recommendation this week to build a planning habit.'
}

/**
 * computeAnalytics(feedbackHistory[]) → simple usage stats object.
 */
export function computeAnalytics(history = []) {
  if (!history?.length) return { totalDays:0, actionRate:0, bestDay:null }
  const days     = [...new Set(history.map(e => e.timestamp?.slice(0, 10)).filter(Boolean))]
  const actions  = history.filter(e => e.outcome === 'helpful')
  const actionRate = days.length ? Math.round(actions.length / days.length * 100) : 0
  const dayCounts  = {}
  for (const h of history) {
    if (h.timestamp) {
      const day = new Date(h.timestamp).toLocaleDateString('en-US', { weekday:'long' })
      dayCounts[day] = (dayCounts[day] || 0) + 1
    }
  }
  const bestDay = Object.entries(dayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null
  return { totalDays: days.length, actionRate, bestDay }
}
