/**
 * /lib/dto/index.js — Canonical Data Transfer Objects
 *
 * These are the ONLY object shapes consumed by React.
 * No raw engine object may reach the UI.
 *
 * Rules:
 *   - All fields camelCase
 *   - All fields have a documented type and default
 *   - Required fields throw in dev if missing; use fallback in prod
 *
 * DTOs are plain objects — no classes, no methods.
 * Construction always goes through adapters.
 */

// ─── Confidence levels ────────────────────────────────────────────────────────
export const CONFIDENCE = Object.freeze({ HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low' })

// ─── Recommendation quality ───────────────────────────────────────────────────
export const QUALITY = Object.freeze({ SUPPORTIVE: 'supportive', CAUTION: 'caution', NEUTRAL: 'neutral', MIXED: 'mixed' })

// ─── DTO shapes (as JSDoc for documentation; no runtime enforcement needed here) ──

/**
 * RecommendationPackage
 * @typedef {object} RecommendationPackage
 * @property {string}   id
 * @property {string}   category
 * @property {number}   priority       1–5
 * @property {string}   icon
 * @property {string}   title
 * @property {string}   summary        one-line action
 * @property {string}   recommendation full action text
 * @property {string}   confidence     'High'|'Medium'|'Low'
 * @property {string}   [confidenceReason]
 * @property {object[]} [evidence]
 * @property {string}   bestWindow     'HH:MM–HH:MM'
 * @property {string}   [avoidWindow]
 * @property {string}   quality        'supportive'|'caution'|'neutral'|'mixed'
 * @property {number}   stars          1–5
 * @property {string}   [reasoning]    why
 * @property {string}   expiresAt      ISO date
 * @property {string}   feedbackStatus 'pending'|'helpful'|'not_helpful'|'skipped'
 */

/**
 * TimelineEntry
 * @typedef {object} TimelineEntry
 * @property {string} startTime   'HH:MM'
 * @property {string} [endTime]   'HH:MM'
 * @property {string} quality     'Excellent'|'Good'|'Moderate'|'Low energy'
 * @property {string} label       category/activity name
 * @property {string} description recommendation text
 * @property {string} confidence  'High'|'Medium'|'Low'
 */

/**
 * DailyBrief
 * @typedef {object} DailyBrief
 * @property {string}   theme
 * @property {string}   outlook         'Positive'|'Neutral'|'Challenging'
 * @property {string}   bestWindow
 * @property {string}   [avoidWindow]
 * @property {string}   confidence      'High'|'Medium'|'Low'
 * @property {number}   stars           1–5
 * @property {string}   [summary]       one-sentence day description
 * @property {string}   [decisionOfDay]
 * @property {string}   [watchFor]
 * @property {BriefOpportunity[]} opportunities
 * @property {BriefCaution[]}     cautions
 * @property {FamilyBrief|null}   familyBrief
 * @property {TomorrowPreview|null} tomorrowPreview
 */

/**
 * BriefOpportunity
 * @typedef {object} BriefOpportunity
 * @property {string} category
 * @property {string} icon
 * @property {string} label
 * @property {string} advice
 * @property {string} confidence
 * @property {string} [bestTime]
 */

/**
 * FamilyBrief
 * @typedef {object} FamilyBrief
 * @property {string}   energy     'High'|'Moderate'|'Low'
 * @property {string}   [bestWindow]
 * @property {string[]} activities
 * @property {string[]} [avoid]
 * @property {string}   confidence
 */

/**
 * TomorrowPreview
 * @typedef {object} TomorrowPreview
 * @property {string} label
 * @property {number} stars
 * @property {string} summary
 * @property {string} confidence
 * @property {string} [bestWindow]
 * @property {string} [theme]
 * @property {number} daysAhead
 */

/**
 * WeeklyPlan
 * @typedef {object} WeeklyPlan
 * @property {WeeklyCategory[]} categories
 * @property {WeekDay[]}        days
 * @property {WeekDay|null}     topDay
 * @property {WeekDay|null}     challenging
 */

/**
 * WeeklyCategory
 * @typedef {object} WeeklyCategory
 * @property {string} category
 * @property {string} icon
 * @property {string} label
 * @property {string} bestDay
 * @property {string} bestDate
 * @property {number} daysAhead
 * @property {string} confidence
 * @property {string} summary
 * @property {number} stars
 */

/**
 * WeekDay
 * @typedef {object} WeekDay
 * @property {string} label
 * @property {string} date
 * @property {number} daysAhead
 * @property {number} stars
 * @property {number} confidence    0–100
 * @property {string} confidenceLabel 'High'|'Medium'|'Low'
 * @property {string} summary
 */

/**
 * UpcomingOpportunity
 * @typedef {object} UpcomingOpportunity
 * @property {string} label
 * @property {string} title
 * @property {string} summary
 * @property {string} confidence
 * @property {number} daysAhead
 * @property {number} stars
 */
