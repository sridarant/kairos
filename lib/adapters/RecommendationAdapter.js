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
  const rawStars       = (typeof pkg.stars === 'number' && pkg.stars >= 1 && pkg.stars <= 5) ? pkg.stars : 3
  // Cap category stars so they cannot exceed overall day stars by more than 1
  // This prevents all categories from showing "5 stars" on a 2-star day
  const stars          = Math.min(rawStars, Math.min(5, (overallStars || 3) + 1))
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
export function adaptRecommendations(pkgs) {
  if (!Array.isArray(pkgs)) return []
  const adapted = pkgs.map(adaptRecommendation).filter(Boolean)
  return validateRecommendations(adapted)
}
