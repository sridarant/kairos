/**
 * /lib/recommendations/index.js — Recommendation Service
 *
 * The single entry point for all recommendation generation.
 * All UI recommendations originate here.
 */
export { buildDailyPackages, buildRecommendationPackage } from './recommendationBuilder.js'
export { rankRecommendations, splitRecommendations }       from './recommendationRanker.js'
export { validateAndLog, filterValid, isValidPackage }     from './recommendationValidator.js'
