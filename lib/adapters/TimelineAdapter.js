/**
 * /lib/adapters/TimelineAdapter.js
 *
 * Converts raw timeline items from lib/decision/timing.js into TimelineEntry DTOs.
 *
 * Raw shape:  { time, end, quality, label, score }
 * DTO shape:  { startTime, endTime, quality, label, description, confidence }
 *
 * No snake_case reaches React.
 */

const QUALITY_TO_CONFIDENCE = {
  Excellent:    'High',
  Good:         'Medium',
  Moderate:     'Medium',
  'Low energy': 'Low'
}

const QUALITY_VALID = new Set(['Excellent', 'Good', 'Moderate', 'Low energy'])

/**
 * adaptTimelineEntry(raw) → TimelineEntry
 */
export function adaptTimelineEntry(raw) {
  if (!raw || typeof raw !== 'object') return null

  const quality = QUALITY_VALID.has(raw.quality) ? raw.quality : 'Moderate'
  return {
    startTime:   raw.time   || raw.startTime   || '',
    endTime:     raw.end    || raw.endTime      || null,
    quality,
    label:       raw.label  || raw.category     || '',
    description: raw.label  || raw.recommendation || raw.text || raw.description || '',
    confidence:  raw.confidence || QUALITY_TO_CONFIDENCE[quality] || 'Medium',
    score:       raw.score  || 0
  }
}

/**
 * adaptTimeline(rawArray) → TimelineEntry[]
 */
export function adaptTimeline(rawArray) {
  if (!Array.isArray(rawArray)) return []
  return rawArray.map(adaptTimelineEntry).filter(Boolean)
}
