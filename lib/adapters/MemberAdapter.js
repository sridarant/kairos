/**
 * /lib/adapters/MemberAdapter.js
 *
 * Adapts raw member objects from /api/daily into canonical camelCase DTOs.
 * Raw members come from buildMember() in api/daily.js.
 *
 * This is the final missing adapter. After this, NO snake_case reaches any
 * React component.
 *
 * MemberDTO:
 * {
 *   name:          string
 *   decision:      'DO' | 'WAIT' | 'AVOID'
 *   confidence:    'High' | 'Medium' | 'Low'
 *   stars:         1..5
 *   focus:         string
 *   goldenWindow:  'HH:MM–HH:MM' | null
 *   avoidWindow:   'HH:MM–HH:MM' | null
 *   summary:       string | null
 *   recommendations: { top: RawRec[], rest: RawRec[] }
 *   timeline:      RawTimelineEntry[]
 *   dasha:         object | null
 *   yoga:          object | null
 * }
 */

const VALID_DECISIONS   = ['DO', 'WAIT', 'AVOID']
const VALID_CONFIDENCE  = ['High', 'Medium', 'Low']

export function adaptMember(raw) {
  if (!raw || typeof raw !== 'object') return null
  if (!raw.name) return null

  return {
    name:         String(raw.name).slice(0, 100),
    decision:     VALID_DECISIONS.includes(raw.decision)  ? raw.decision  : 'WAIT',
    confidence:   VALID_CONFIDENCE.includes(raw.confidence)? raw.confidence: 'Medium',
    stars:        (typeof raw.stars === 'number' && raw.stars >= 1 && raw.stars <= 5) ? raw.stars : 3,
    focus:        raw.focus        || null,
    goldenWindow: raw.golden_window || null,   // snake_case normalised here
    avoidWindow:  raw.avoid_window  || null,   // snake_case normalised here
    summary:      raw.summary      || null,
    recommendations: raw.recommendations || { top:[], rest:[] },
    timeline:     Array.isArray(raw.timeline) ? raw.timeline : [],
    dasha:        raw.dasha || null,
    yoga:         raw.yoga  || null,
  }
}

export function adaptMembers(rawArray) {
  if (!Array.isArray(rawArray)) return []
  return rawArray.map(adaptMember).filter(Boolean)
}
