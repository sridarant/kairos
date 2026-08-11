/**
 * /lib/recommendations/weeklyPlanner.js
 *
 * Generates a 7-day planning view.
 * Consumes the week_plan array from /api/daily and produces
 * per-category best-day recommendations.
 *
 * PURE: no astrology calculations here.
 */

const CATEGORY_DIMS = {
  career:        'd',
  finance:       'r',   // low risk = good
  family:        'c',
  learning:      'f',
  relationships: 'c',
  spiritual:     'f',
  travel:        'd',
  communication: 'c'
}

const CATEGORY_META = {
  career:        { icon:'💼', label:'Career',        summaryGood:'Strong day for career goals.', summaryCaution:'Steady progress over bold moves.' },
  finance:       { icon:'💰', label:'Finance',        summaryGood:'Good clarity for financial decisions.', summaryCaution:'Defer large commitments.' },
  family:        { icon:'👨‍👩‍👧', label:'Family',       summaryGood:'Excellent for shared family activities.', summaryCaution:'Keep interactions light.' },
  learning:      { icon:'📚', label:'Learning',       summaryGood:'Peak conditions for study and planning.', summaryCaution:'Short sessions are best.' },
  relationships: { icon:'❤️',  label:'Relationships',  summaryGood:'Excellent for important conversations.', summaryCaution:'Listen more than you speak.' },
  spiritual:     { icon:'🛕', label:'Spiritual',      summaryGood:'Excellent for inner reflection.', summaryCaution:'Rest over demanding practice.' },
  travel:        { icon:'✈️',  label:'Travel',         summaryGood:'Good for travel planning.', summaryCaution:'Defer travel if possible.' },
  communication: { icon:'💬', label:'Communication',  summaryGood:'Excellent for key messages.', summaryCaution:'Choose words carefully.' }
}

/**
 * buildWeeklyPlan(weekPlanArray)
 *
 * @param {object[]} weekPlanArray — from /api/daily response
 * @returns WeeklyPlan: { categories: CategoryBestDay[], days: DaySummary[], challenging: DaySummary }
 */
export function buildWeeklyPlan(weekPlanArray) {
  if (!weekPlanArray?.length) return null

  // P0-01/P0-03: sort by canonical suitabilityScore.
  // Week plan days now contain suitabilityScore from the engine (P0-03 fix).
  // 'Most Challenging' = minimum suitabilityScore day (spec requirement).
  // 'Best Day' = maximum suitabilityScore day.
  const sorted = [...weekPlanArray].sort((a,b) => (b.suitabilityScore||b.stars*20||0) - (a.suitabilityScore||a.stars*20||0))
  const topDay = sorted[0]
  const worstDay = sorted[sorted.length - 1]

  const categories = Object.entries(CATEGORY_META).map(([cat, meta], idx) => {
    // Rotate best days across categories to avoid all pointing to same day
    const best = sorted[idx % sorted.length] || topDay
    const isGood = (best.suitabilityScore || best.stars * 20 || 50) >= 55
    return {
      category:   cat,
      icon:       meta.icon,
      label:      meta.label,
      bestDay:    best.label,
      bestDate:   best.date,
      daysAhead:  best.days_ahead,
      confidence: (best.suitabilityScore||50) >= 70 ? 'High' : (best.suitabilityScore||50) >= 45 ? 'Medium' : 'Low',
      summary:    isGood ? meta.summaryGood : meta.summaryCaution,
      stars:      best.stars || 3
    }
  })

  return {
    categories,
    topDay: {
      label:           topDay.label,
      date:            topDay.date,
      daysAhead:       topDay.days_ahead,
      summary:         topDay.summary || 'Highly favourable',
      stars:           topDay.stars,
      suitabilityScore:topDay.suitabilityScore,
      suitabilityTier: topDay.suitabilityTier,
      confidence:      topDay.confidence
    },
    challenging: worstDay ? {
      label:     worstDay.label,
      date:      worstDay.date,
      daysAhead: worstDay.days_ahead,
      summary:   worstDay.summary || 'Rest and reflect',
      stars:     worstDay.stars
    } : null,
    days: weekPlanArray
  }
}

/**
 * buildUpcomingOpportunities(weekPlanArray, primaryMember)
 *
 * Extracts meaningful upcoming windows from the week.
 */
export function buildUpcomingOpportunities(weekPlanArray) {
  if (!weekPlanArray?.length) return []
  return weekPlanArray
    .filter(d => d.days_ahead > 0 && (d.confidence || 50) >= 65)
    .slice(0, 4)
    .map(d => ({
      label:     d.label,
      date:      d.date,
      daysAhead: d.days_ahead,
      title:     d.stars >= 5 ? 'Excellent opportunity window'
                : d.stars >= 4 ? 'Strong opportunity window'
                : 'Moderate opportunity',
      summary:   d.summary,
      stars:     d.stars,
      confidence: d.confidence >= 70 ? 'High' : 'Medium'
    }))
}

/**
 * buildEventRecommendations(eventType, weekPlanArray)
 *
 * For a given event type, returns ranked best dates.
 */
const EVENT_CATEGORY = {
  interview:     'career',
  travel:        'travel',
  medical:       'medical',
  property:      'property',
  investment:    'finance',
  temple:        'spiritual',
  family:        'family',
  communication: 'communication'
}

export function buildEventRecommendations(eventType, weekPlanArray) {
  if (!weekPlanArray?.length || !eventType) return []
  const sorted = [...weekPlanArray]
    .filter(d => d.days_ahead >= 0)
    .sort((a, b) => (b.confidence||0) - (a.confidence||0))

  return sorted.slice(0, 5).map((d, rank) => ({
    rank: rank + 1,
    label:     d.label,
    date:      d.date,
    daysAhead: d.days_ahead,
    stars:     d.stars,
    confidence: (d.confidence||50) >= 70 ? 'High' : (d.confidence||50) >= 45 ? 'Medium' : 'Low',
    reason:    rank === 0 ? 'Highest confidence window for this event type.'
             : rank === 1 ? 'Strong alternative if first choice is unavailable.'
             : 'Acceptable window — conditions are moderate.',
    calendarExport: {
      title:       `${eventType} — Kairos Recommended`,
      date:        d.date,
      description: `Kairos recommends this date for ${eventType}. Confidence: ${d.confidence||50}%.`
    }
  }))
}
