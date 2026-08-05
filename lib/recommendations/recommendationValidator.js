/**
 * /lib/recommendations/recommendationValidator.js
 *
 * Validates RecommendationPackages before display.
 * Prevents incomplete or expired recommendations from reaching the UI.
 */

export function isValidPackage(pkg) {
  if (!pkg || typeof pkg !== 'object') return false
  if (!pkg.id || !pkg.category || !pkg.recommendation) return false
  // Check expiry
  if (pkg.expiresAt && new Date(pkg.expiresAt) < new Date()) return false
  return true
}

export function filterValid(packages) {
  return (packages || []).filter(isValidPackage)
}

export function validateAndLog(packages) {
  const valid   = []
  const invalid = []
  for (const p of packages) {
    if (isValidPackage(p)) valid.push(p)
    else invalid.push(p)
  }
  if (invalid.length > 0) {
    console.warn(`[RecommendationValidator] ${invalid.length} invalid package(s) filtered out`)
  }
  return valid
}
