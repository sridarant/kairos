/**
 * /lib/adapters/index.js — Adapter Layer Public API
 *
 * All data flowing from engines → React must pass through here.
 * This is the single transformation point: raw → DTO.
 */

export { adaptRecommendation, adaptRecommendations }        from './RecommendationAdapter.js'
export { adaptDailyBrief, adaptTomorrowPreview }            from './DailyBriefAdapter.js'
export { adaptTimeline, adaptTimelineEntry }                from './TimelineAdapter.js'
export { adaptWeeklyPlan, adaptOpportunities }             from './WeeklyPlanAdapter.js'
export { adaptMember, adaptMembers }                               from './MemberAdapter.js'
export { adaptHorizonDay, adaptHorizonDays }                       from './PlannerHorizonAdapter.js'
export { validateRecommendation, validateDailyBrief,
  validateWeeklyPlan, validateFamilyBrief,
  validateRecommendations, buildDiagnostics }              from './validate.js'
