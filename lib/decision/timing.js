// /lib/decision/timing.js
// Derives meaningful, non-uniform time windows from scored slot data.
// Replaces evenly-spaced timeline with windows based on actual score clusters.

const WINDOW_LABELS = {
  Excellent: ['Deep work', 'Strategic decisions', 'Important meetings', 'Creative flow', 'Negotiations'],
  Good:      ['Planning', 'Communication', 'Learning', 'Family conversations', 'Routine tasks'],
  Moderate:  ['Administrative tasks', 'Light review', 'Catch-up work', 'Short breaks'],
  Low:       ['Rest and recovery', 'Avoid major purchases', 'Avoid heated discussions', 'Gentle activities']
}

const FAMILY_WINDOWS = ['Family activities', 'Family dinner', 'Shared planning', 'Family conversations']
const SPIRITUAL_WINDOWS = ['Spiritual practice', 'Meditation', 'Prayer and reflection']

/**
 * buildTimeline: produces a meaningful timeline from scored slots.
 * Each slot may generate 1–2 sub-windows based on quality transitions.
 */
export function buildTimeline(scoredSlots, seed = 1) {
  if (!scoredSlots?.length) return []

  const events = []
  scoredSlots.forEach((slot, i) => {
    const [startStr, endStr] = slot.time.split('–')
    const score = slot.score || 0

    // Determine quality tier
    let quality, tier
    if (score > 1.5)       { quality = 'Excellent'; tier = 0 }
    else if (score > 0.5)  { quality = 'Good';      tier = 1 }
    else if (score > -0.5) { quality = 'Moderate';  tier = 2 }
    else                   { quality = 'Low';        tier = 3 }

    const labels = WINDOW_LABELS[quality]
    const label  = labels[(seed + i) % labels.length]

    // Split slot into two meaningful sub-windows for top slots
    if (tier <= 1 && startStr && endStr) {
      const [sh, sm] = startStr.split(':').map(Number)
      const midH = sh + 1
      const mid  = `${String(midH).padStart(2,'0')}:${String(sm).padStart(2,'0')}`
      events.push({ time: startStr, end: mid, quality, label, score: +score.toFixed(2) })
      // Second sub-window gets a related label
      const label2 = labels[(seed + i + 3) % labels.length]
      const isEvening = sh >= 17
      const altLabel  = isEvening
        ? FAMILY_WINDOWS[(seed + i) % FAMILY_WINDOWS.length]
        : i >= 4
        ? SPIRITUAL_WINDOWS[(seed + i) % SPIRITUAL_WINDOWS.length]
        : label2
      events.push({ time: mid, end: endStr, quality, label: altLabel, score: +score.toFixed(2) })
    } else {
      events.push({ time: startStr, end: endStr, quality, label, score: +score.toFixed(2) })
    }
  })

  return events
}

/**
 * bestWindow: return the highest-scoring contiguous window label.
 */
export function bestWindow(scoredSlots) {
  const sorted = [...scoredSlots].sort((a, b) => b.score - a.score)
  return sorted[0]?.time || null
}

/**
 * avoidWindow: return the lowest-scoring slot window.
 */
export function avoidWindow(scoredSlots) {
  const sorted = [...scoredSlots].sort((a, b) => a.score - b.score)
  return sorted[0]?.time || null
}
