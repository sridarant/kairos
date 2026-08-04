/**
 * /lib/astrology/validation.js
 * Validates birth data and chart integrity.
 * Returns structured validation results with graceful fallback hints.
 */

export function validateBirthData(dob, birthTime) {
  const errors = [], warnings = []

  if (!dob) {
    warnings.push('No date of birth provided — using simplified Dasha and no birth chart')
    return { valid: false, hasDob: false, hasTime: false, errors, warnings, quality: 'none' }
  }

  const parts = dob.split('-')
  if (parts.length !== 3) {
    errors.push(`Invalid DOB format "${dob}" — expected DD-MM-YYYY`)
    return { valid: false, hasDob: false, hasTime: false, errors, warnings, quality: 'none' }
  }

  const [d, mo, y] = parts.map(Number)
  if (isNaN(d) || isNaN(mo) || isNaN(y)) {
    errors.push('DOB contains non-numeric values')
    return { valid: false, hasDob: false, hasTime: false, errors, warnings, quality: 'none' }
  }
  if (d < 1 || d > 31 || mo < 1 || mo > 12 || y < 1900 || y > new Date().getFullYear()) {
    errors.push(`DOB values out of range: day=${d}, month=${mo}, year=${y}`)
    return { valid: false, hasDob: false, hasTime: false, errors, warnings, quality: 'none' }
  }

  const hasDob = true
  let hasTime  = false
  if (birthTime) {
    const [hh, mm] = birthTime.split(':').map(Number)
    if (!isNaN(hh) && hh >= 0 && hh < 24 && !isNaN(mm) && mm >= 0 && mm < 60) {
      hasTime = true
    } else {
      warnings.push(`Invalid birth time "${birthTime}" — using noon (12:00) as default`)
    }
  } else {
    warnings.push('No birth time — Lagna will not be calculated; using Moon sign only')
  }

  return {
    valid:    errors.length === 0,
    hasDob, hasTime, errors, warnings,
    quality:  hasDob && hasTime ? 'full' : hasDob ? 'partial' : 'none'
  }
}

export function validateGrahaPositions(grahas) {
  const issues = []
  const EXPECTED = ['Sun','Moon','Mars','Mercury','Jupiter','Venus','Saturn','Rahu','Ketu']
  for (const p of EXPECTED) {
    if (!grahas[p]) issues.push(`Missing graha: ${p}`)
    else if (grahas[p].sidLon < 0 || grahas[p].sidLon >= 360) issues.push(`${p}: invalid longitude ${grahas[p].sidLon}`)
  }
  return { valid: issues.length === 0, issues }
}
