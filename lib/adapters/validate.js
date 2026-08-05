/**
 * /lib/adapters/validate.js — Runtime DTO Validation
 *
 * assertField: throws in DEV, warns in PROD, never silently continues.
 * validateXxx: validate a complete DTO, return { valid, issues }
 */

const IS_DEV = typeof process !== 'undefined'
  ? process.env.NODE_ENV !== 'production'
  : (typeof import.meta !== 'undefined' && import.meta.env?.DEV)

/**
 * Warn or throw depending on environment.
 */
function warn(msg) {
  if (IS_DEV) console.warn(`[Kairos DTO] ${msg}`)
}

function assertField(obj, field, label) {
  if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
    warn(`${label}: required field "${field}" is missing or empty.`)
    return false
  }
  return true
}

// ─── RecommendationPackage ────────────────────────────────────────────────────
export function validateRecommendation(pkg) {
  if (!pkg || typeof pkg !== 'object') {
    warn('validateRecommendation: received null or non-object')
    return { valid: false, issues: ['null or non-object'] }
  }
  const issues = []
  const required = ['id', 'category', 'title', 'summary', 'confidence', 'bestWindow', 'quality', 'stars']
  for (const f of required) {
    if (!assertField(pkg, f, 'RecommendationPackage')) issues.push(f)
  }
  if (pkg.stars && (pkg.stars < 1 || pkg.stars > 5)) {
    warn(`RecommendationPackage: stars=${pkg.stars} is out of range 1–5`); issues.push('stars_range')
  }
  if (pkg.confidence && !['High','Medium','Low'].includes(pkg.confidence)) {
    warn(`RecommendationPackage: invalid confidence "${pkg.confidence}"`); issues.push('confidence_value')
  }
  return { valid: issues.length === 0, issues }
}

// ─── TimelineEntry ────────────────────────────────────────────────────────────
export function validateTimelineEntry(entry) {
  if (!entry || typeof entry !== 'object') {
    warn('validateTimelineEntry: received null or non-object')
    return { valid: false, issues: ['null'] }
  }
  const issues = []
  if (!assertField(entry, 'startTime', 'TimelineEntry')) issues.push('startTime')
  if (!assertField(entry, 'description', 'TimelineEntry')) issues.push('description')
  if (!assertField(entry, 'quality', 'TimelineEntry')) issues.push('quality')
  return { valid: issues.length === 0, issues }
}

// ─── DailyBrief ──────────────────────────────────────────────────────────────
export function validateDailyBrief(brief) {
  if (!brief || typeof brief !== 'object') {
    warn('validateDailyBrief: received null')
    return { valid: false, issues: ['null'] }
  }
  const issues = []
  const required = ['theme', 'outlook', 'bestWindow', 'confidence', 'stars']
  for (const f of required) {
    if (!assertField(brief, f, 'DailyBrief')) issues.push(f)
  }
  return { valid: issues.length === 0, issues }
}

// ─── WeeklyPlan ───────────────────────────────────────────────────────────────
export function validateWeeklyPlan(plan) {
  if (!plan || typeof plan !== 'object') return { valid: false, issues: ['null'] }
  const issues = []
  if (!Array.isArray(plan.categories) || plan.categories.length === 0) {
    warn('WeeklyPlan: categories is empty'); issues.push('categories')
  }
  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    warn('WeeklyPlan: days is empty'); issues.push('days')
  }
  return { valid: issues.length === 0, issues }
}

// ─── FamilyBrief ─────────────────────────────────────────────────────────────
export function validateFamilyBrief(fb) {
  if (!fb) return { valid: false, issues: ['null'] }
  const issues = []
  if (!assertField(fb, 'energy', 'FamilyBrief')) issues.push('energy')
  return { valid: issues.length === 0, issues }
}

// ─── Batch validate recommendations ──────────────────────────────────────────
export function validateRecommendations(pkgs) {
  const valid = [], invalid = []
  for (const p of (pkgs || [])) {
    const result = validateRecommendation(p)
    if (result.valid) valid.push(p)
    else { invalid.push({ pkg: p, issues: result.issues }); warn(`Filtering invalid recommendation: ${p?.category} — ${result.issues.join(', ')}`) }
  }
  return valid
}

// ─── Dev diagnostics payload ──────────────────────────────────────────────────
export function buildDiagnostics({ brief, recommendations, weeklyPlan, opportunities, timeline, familyBrief }) {
  if (!IS_DEV) return null
  return {
    morningBrief:    validateDailyBrief(brief),
    recommendations: { valid: (recommendations||[]).every(r => validateRecommendation(r).valid), count: (recommendations||[]).length },
    timeline:        { valid: (timeline||[]).every(t => validateTimelineEntry(t).valid), count: (timeline||[]).length },
    weeklyPlan:      validateWeeklyPlan(weeklyPlan),
    opportunities:   { valid: Array.isArray(opportunities) && opportunities.length > 0, count: (opportunities||[]).length },
    familyBrief:     validateFamilyBrief(familyBrief)
  }
}
