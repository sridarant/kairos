/**
 * /lib/recommendations/recommendationRanker.js
 *
 * Ranks RecommendationPackages by priority.
 * Accepts optional user preference weights from analytics data.
 */

/**
 * rankRecommendations(packages, userPrefs?)
 *
 * userPrefs shape: { [category]: { views, expansions, helpful } }
 * Higher engagement = slightly higher priority (max ±0.5 shift).
 */
export function rankRecommendations(packages, userPrefs = {}) {
  return [...packages].sort((a, b) => {
    const aBase  = a.priority || 3
    const bBase  = b.priority || 3
    const aPref  = userEngagementScore(a.category, userPrefs)
    const bPref  = userEngagementScore(b.category, userPrefs)
    return (bBase + bPref) - (aBase + aPref)
  })
}

function userEngagementScore(category, prefs) {
  const p = prefs[category]
  if (!p) return 0
  // Positively engaged categories get a small boost
  const helpfulBonus = (p.helpful || 0) * 0.15
  const expansionBonus = Math.min(0.2, (p.expansions || 0) * 0.05)
  const skippedPenalty = (p.skipped || 0) * -0.1
  return Math.max(-0.5, Math.min(0.5, helpfulBonus + expansionBonus + skippedPenalty))
}

/** Split into top-N and rest */
export function splitRecommendations(ranked, topN = 5) {
  return { top: ranked.slice(0, topN), rest: ranked.slice(topN) }
}
