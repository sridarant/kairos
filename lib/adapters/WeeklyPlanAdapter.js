/**
 * /lib/adapters/WeeklyPlanAdapter.js
 *
 * Converts raw weeklyPlan (from lib/recommendations/weeklyPlanner.js) into a WeeklyPlan DTO.
 * Converts raw opportunities into UpcomingOpportunity DTOs.
 */

import { validateWeeklyPlan } from './validate.js'

const VALID_CONF = new Set(['High', 'Medium', 'Low'])
const confLabel  = n => n >= 70 ? 'High' : n >= 45 ? 'Medium' : 'Low'

/**
 * adaptWeekDay(raw) → WeekDay DTO
 */
function adaptWeekDay(raw) {
  if (!raw || typeof raw !== 'object') return null
  const confidence = raw.confidence ?? 50
  return {
    label:            raw.label      || 'Day',
    date:             raw.date       || '',
    daysAhead:        raw.daysAhead  ?? raw.days_ahead ?? 0,
    stars:            typeof raw.stars === 'number' ? raw.stars : 3,
    confidence,
    confidenceLabel:  confLabel(confidence),
    summary:          raw.summary    || ''
  }
}

/**
 * adaptWeeklyCategory(raw) → WeeklyCategory DTO
 */
function adaptWeeklyCategory(raw) {
  if (!raw) return null
  const conf = VALID_CONF.has(raw.confidence) ? raw.confidence : confLabel(raw.confidence || 50)
  return {
    category:   raw.category  || 'general',
    icon:       raw.icon      || '📅',
    label:      raw.label     || raw.category || 'Category',
    bestDay:    raw.bestDay   || raw.label    || 'This week',
    bestDate:   raw.bestDate  || '',
    daysAhead:  raw.daysAhead ?? raw.days_ahead ?? 0,
    confidence: conf,
    summary:    raw.summary   || '',
    stars:      typeof raw.stars === 'number' ? raw.stars : 3
  }
}

/**
 * adaptWeeklyPlan(raw) → WeeklyPlan DTO
 */
export function adaptWeeklyPlan(raw) {
  if (!raw) return null
  const plan = {
    categories:  (raw.categories || []).map(adaptWeeklyCategory).filter(Boolean),
    days:        (raw.days       || []).map(adaptWeekDay).filter(Boolean),
    topDay:      raw.topDay      ? adaptWeekDay(raw.topDay)      : null,
    challenging: raw.challenging ? adaptWeekDay(raw.challenging) : null
  }
  validateWeeklyPlan(plan)
  return plan
}

/**
 * adaptUpcomingOpportunity(raw) → UpcomingOpportunity DTO
 */
function adaptUpcomingOpportunity(raw) {
  if (!raw) return null
  return {
    label:      raw.label      || 'Upcoming',
    title:      raw.title      || raw.label  || 'Strong opportunity window',
    summary:    raw.summary    || '',
    confidence: VALID_CONF.has(raw.confidence) ? raw.confidence : confLabel(raw.confidence || 50),
    daysAhead:  raw.daysAhead  ?? raw.days_ahead ?? 1,
    stars:      typeof raw.stars === 'number' ? raw.stars : 3
  }
}

/**
 * adaptOpportunities(rawArray) → UpcomingOpportunity[]
 */
export function adaptOpportunities(rawArray) {
  if (!Array.isArray(rawArray)) return []
  return rawArray.map(adaptUpcomingOpportunity).filter(Boolean)
}
