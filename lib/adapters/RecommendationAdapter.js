/**
 * /lib/adapters/RecommendationAdapter.js
 *
 * Ensures RecommendationPackages are fully populated before reaching React.
 * All snake_case normalised. All required fields defaulted.
 *
 * This is the ONLY place that normalises recommendation data.
 */

import { validateRecommendations } from './validate.js'

const CAT_META = {
  career:'💼', finance:'💰', money:'💰', relationships:'❤️', health:'🌿',
  learning:'📚', travel:'✈️', spiritual:'🛕', home:'🏠', family:'👨‍👩‍👧',
  shopping:'🛍️', medical:'🏥', communication:'💬', business:'🏢',
  property:'🏠', legal:'⚖️', planning:'📋', education:'📚'
}

function defaultIcon(category) {
  return CAT_META[category] || '📌'
}

/**
 * adaptRecommendation(pkg) → normalised RecommendationPackage
 * Handles any lingering snake_case or missing fields.
 */
export function adaptRecommendation(pkg, overallStars = 3) {
  if (!pkg || typeof pkg !== 'object') return null

  // Normalise all possible field name variants
  const bestWindow    = pkg.bestWindow    || pkg.best_window    || pkg.bestTime    || pkg.best_time    || null
  const avoidWindow   = pkg.avoidWindow   || pkg.avoid_window   || null
  const summary       = pkg.summary       || pkg.action         || pkg.recommendation || ''
  const recommendation = pkg.recommendation || pkg.action       || pkg.summary     || ''
  const reasoning     = pkg.reasoning     || pkg.reason         || pkg.why         || null
  const confidence    = ['High','Medium','Low'].includes(pkg.confidence) ? pkg.confidence : 'Medium'
  const quality       = ['supportive','caution','neutral','mixed'].includes(pkg.quality) ? pkg.quality : 'neutral'
  const stars = (typeof pkg.stars === 'number' && pkg.stars >= 1 && pkg.stars <= 5) ? pkg.stars : 3
  // P0-6: Stars are NOT capped by overall day stars.
  // Finance on a Moderate day CAN legitimately show 4★ because finance uses the
  // risk dimension, not the overall composite.
  // The domain exception is surfaced through isException/exceptionReason in the domain DTO.
  // overallStars parameter kept in signature for backward compat but no longer caps.
  void overallStars
  const feedbackStatus = ['pending','helpful','not_helpful','skipped'].includes(pkg.feedbackStatus) ? pkg.feedbackStatus : 'pending'

  return {
    id:               pkg.id               || `rec_${pkg.category}_${Date.now()}`,
    category:         pkg.category         || 'general',
    priority:         pkg.priority         || pkg._score || stars,
    icon:             pkg.icon             || defaultIcon(pkg.category),
    title:            pkg.title            || pkg.label  || pkg.category || 'Recommendation',
    summary,
    recommendation,
    confidence,
    confidenceReason: pkg.confidenceReason || null,
    evidence:         Array.isArray(pkg.evidence) ? pkg.evidence : [],
    bestWindow,
    avoidWindow,
    quality,
    stars,
    reasoning,
    expiresAt:        pkg.expiresAt        || null,
    feedbackStatus,
    analytics:        pkg.analytics        || { views:0, expansions:0, feedbackAt:null },
    metadata:         pkg.metadata         || {}
  }
}

/**
 * adaptRecommendations(pkgs) → validated, normalised RecommendationPackage[]
 */
/**
 * adaptRecommendations(packages, overallStars)
 *
 * P0-6: Star capping removed. Domain stars reflect domain-specific evidence,
 * not the overall day score. Finance on a Moderate day CAN show 4★.
 * The domain exception model in DailyInsight.domains handles the semantic
 * explanation without hiding the underlying calculation.
 *
 * @param {object[]} packages     raw recommendation packages from engine
 * @param {number}   overallStars kept for backward compat; no longer caps
 */
export function adaptRecommendations(packages, overallStars = 3) {
  if (!Array.isArray(packages)) return []
  const adapted = packages.map(pkg => adaptRecommendation(pkg, overallStars)).filter(Boolean)
  return validateRecommendations(adapted)
}
