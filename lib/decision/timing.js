/**
 * /lib/decision/timing.js
 *
 * Derives timeline from scored slot data.
 * Quality tier is RELATIVE to the day's score range — not absolute thresholds.
 * This prevents every slot on a strong day from being labelled "Excellent".
 *
 * Quality derivation:
 *   topQuartile   → Excellent (only the genuinely highest slots)
 *   upperMiddle   → Good
 *   lowerMiddle   → Moderate
 *   bottomQuartile → Low energy
 */

// Labels indexed by quality tier and slot dimension signature
const SLOT_LABELS = {
  Excellent:    {
    d: ['Strategic decisions', 'Important meetings', 'Career work'],
    c: ['Key conversations',   'Negotiations',       'Presentations'],
    f: ['Deep focus',          'Creative work',      'Study & learning'],
    r: ['Financial review',    'Careful planning',   'Due diligence']
  },
  Good: {
    d: ['Planning',            'Prioritisation',     'Work decisions'],
    c: ['Communication',       'Follow-ups',         'Routine meetings'],
    f: ['Focused tasks',       'Research',           'Writing'],
    r: ['Financial matters',   'Budgeting',          'Risk review']
  },
  Moderate: {
    d: ['Admin tasks',         'Review & tidy-up',   'Light work'],
    c: ['Brief check-ins',     'Messages',           'Casual conversations'],
    f: ['Routine tasks',       'Short sessions',     'Light reading'],
    r: ['Routine finance',     'Minor purchases',    'Record-keeping']
  },
  'Low energy': {
    d: ['Rest or light tasks', 'Gentle reflection',  'Quiet routines'],
    c: ['Avoid conflicts',     'Rest',               'Gentle family time'],
    f: ['Rest',                'Short walks',        'Light activities'],
    r: ['Defer decisions',     'Avoid purchases',    'Wait and see']
  }
}

/** Dominant dimension for a slot */
function dominantDim(dims) {
  if (!dims) return 'f'
  const entries = [
    { k:'d', v: dims.d || 0 },
    { k:'c', v: dims.c || 0 },
    { k:'f', v: dims.f || 0 },
    { k:'r', v: dims.r || 0 }
  ]
  // For risk-heavy slots, use 'r'; otherwise use highest positive dim
  if ((dims.r || 0) < -1.5) return 'r'
  return entries.filter(e => e.k !== 'r').sort((a,b) => b.v - a.v)[0]?.k || 'f'
}

function slotLabel(quality, dims, seed, idx) {
  const dim    = dominantDim(dims)
  const labels = SLOT_LABELS[quality]?.[dim] || SLOT_LABELS[quality]?.f || ['Quiet period']
  return labels[(seed + idx) % labels.length]
}

/**
 * buildTimeline(scoredSlots, seed)
 *
 * Quality is relative: uses percentile within the day's score range,
 * not fixed absolute thresholds. A "6" on a 9-max day is Good, not Excellent.
 */
export function buildTimeline(scoredSlots, seed = 1) {
  if (!scoredSlots?.length) return []

  const scores  = scoredSlots.map(s => s.score || 0)
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  const range    = maxScore - minScore || 1

  const events = []

  scoredSlots.forEach((slot, i) => {
    const [startStr, endStr] = slot.time.split('–')
    const score    = slot.score || 0
    const pct      = (score - minScore) / range   // 0..1 relative to day's range
    const dims     = slot.dims || {}

    let quality
    if (pct >= 0.8)      quality = 'Excellent'
    else if (pct >= 0.55) quality = 'Good'
    else if (pct >= 0.3)  quality = 'Moderate'
    else                  quality = 'Low energy'

    const label  = slotLabel(quality, dims, seed, i)

    // Split top slots into two 1-hour sub-windows for more granularity
    if ((quality === 'Excellent' || quality === 'Good') && startStr && endStr) {
      const [sh, sm] = startStr.split(':').map(Number)
      const midH = String(sh + 1).padStart(2, '0')
      const mid  = `${midH}:${String(sm).padStart(2, '0')}`
      const label2 = slotLabel(quality, dims, seed + 5, i)

      events.push({ time:startStr, end:mid,    quality, label,  score:+score.toFixed(2), dims })
      events.push({ time:mid,      end:endStr, quality, label:label2, score:+score.toFixed(2), dims })
    } else {
      events.push({ time:startStr, end:endStr, quality, label, score:+score.toFixed(2), dims })
    }
  })

  return events
}

export function bestWindow(scoredSlots) {
  if (!scoredSlots?.length) return null
  return [...scoredSlots].sort((a,b) => b.score - a.score)[0]?.time || null
}

export function avoidWindow(scoredSlots) {
  if (!scoredSlots?.length) return null
  return [...scoredSlots].sort((a,b) => a.score - b.score)[0]?.time || null
}
