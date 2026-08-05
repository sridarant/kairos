/**
 * /lib/dailyBrief/index.js — Daily Summary Engine
 *
 * Consumes the Decision Engine output and produces a concise Morning Brief.
 * Does NOT perform astrology calculations — all inputs come from DecisionObject.
 *
 * Output shape (MorningBrief):
 * {
 *   theme:          string        — today's primary focus area
 *   outlook:        'Positive'|'Neutral'|'Challenging'
 *   bestWindow:     string        — golden time window
 *   decisionOfDay:  string        — single highest-priority action
 *   opportunities:  Opportunity[] — top 3 supportive areas
 *   cautions:       Caution[]     — top 3 areas requiring care
 *   familyBrief:    FamilyBrief|null
 *   confidence:     'High'|'Medium'|'Low'
 *   watchFor:       string        — one-line caution note
 * }
 */

// ─── Outlook from confidence + decision ───────────────────────────────────────
function deriveOutlook(decision, confidence) {
  if (decision === 'DO' && (confidence === 'High' || confidence === 'Very High')) return 'Positive'
  if (decision === 'AVOID') return 'Challenging'
  if (confidence === 'Low') return 'Challenging'
  return 'Neutral'
}

// ─── Decision of the Day from top evidence ────────────────────────────────────
const DOD_TEMPLATES = {
  career:        { supportive:'An excellent day to advance important professional goals.',     caution:'Focus on maintaining existing commitments rather than new initiatives.' },
  communication: { supportive:'Today is ideal for key conversations and important messages.',  caution:'Choose words carefully — miscommunication is more likely today.' },
  finance:       { supportive:'Good clarity for financial decisions and reviews.',             caution:'Delay major financial commitments until conditions improve.' },
  relationships: { supportive:'An excellent day for meaningful personal connections.',         caution:'Avoid confrontational conversations — wait for a clearer window.' },
  health:        { supportive:'Positive conditions for health decisions and self-care.',       caution:'Prioritise rest and recovery today.' },
  learning:      { supportive:'Peak conditions for study, planning and skill-building.',      caution:'Short, practical sessions work better than intensive study.' },
  spiritual:     { supportive:'Excellent day for reflection, meditation and inner work.',     caution:'Preserve energy through rest rather than demanding activities.' },
  family:        { supportive:'Strong family harmony — an excellent day for shared activities.', caution:'Keep family interactions light and low-pressure today.' }
}

function buildDecisionOfDay(reasoningResult, decisionObj) {
  if (!reasoningResult) return null
  const top      = reasoningResult.topEvidence?.[0]
  const catEntry = top?.areas?.[0]
  const quality  = top?.quality || 'neutral'
  const templates = DOD_TEMPLATES[catEntry] || DOD_TEMPLATES.career
  return quality === 'supportive' ? templates.supportive : templates.caution
}

// ─── Opportunities (top 3 supportive categories) ─────────────────────────────
function buildOpportunities(recommendations) {
  const top = recommendations?.top || []
  return top
    .filter(r => r.quality === 'supportive' || r.stars >= 4)
    .slice(0, 3)
    .map(r => ({
      category:   r.category,
      icon:       r.icon,
      label:      r.label,
      advice:     r.action,
      confidence: r.confidence,
      bestTime:   r.best_time
    }))
}

// ─── Cautions (top 3 challenging or low-confidence areas) ────────────────────
function buildCautions(recommendations) {
  const all = [...(recommendations?.top || []), ...(recommendations?.rest || [])]
  return all
    .filter(r => r.quality === 'caution' || r.stars <= 2)
    .slice(0, 3)
    .map(r => ({
      category:   r.category,
      icon:       r.icon,
      label:      r.label,
      advice:     r.action,
      confidence: r.confidence
    }))
}

// ─── Watch-for note from conflict or caution signals ─────────────────────────
function buildWatchFor(reasoningResult, avoidWindow) {
  const note = reasoningResult?.conflictSummary?.balancingNote
  if (note) return note
  if (avoidWindow) return `Avoid impulsive decisions or commitments after ${avoidWindow}.`
  return 'Pace yourself — energy shifts in the afternoon.'
}

// ─── Family brief ─────────────────────────────────────────────────────────────
function buildFamilyBrief(familyAlignment, members) {
  if (!familyAlignment || !members || members.length < 2) return null
  const conf = familyAlignment.confidence || familyAlignment.stars >= 4 ? 'High' : 'Medium'
  return {
    energy:         conf === 'High' ? 'High' : conf === 'Medium' ? 'Moderate' : 'Low',
    bestWindow:     familyAlignment.best_shared_window || familyAlignment.bestSharedWindow,
    activities:     (familyAlignment.recommended || []).slice(0, 3),
    memberCount:    members.length,
    confidence:     conf
  }
}

// ─── Tomorrow preview ─────────────────────────────────────────────────────────
function buildTomorrowPreview(weekPlan) {
  const tomorrow = weekPlan?.find(d => d.days_ahead === 1)
  if (!tomorrow) return null
  const CONF = { 5:'High', 4:'High', 3:'Medium', 2:'Low', 1:'Low' }
  return {
    label:      'Tomorrow',
    stars:      tomorrow.stars,
    summary:    tomorrow.summary,
    confidence: CONF[tomorrow.stars] || 'Medium',
    days_ahead: 1
  }
}

// ─── Notification payload builder (foundation only) ───────────────────────────
/**
 * buildNotificationPayloads(brief)
 *
 * Creates structured payloads for future push notification support.
 * Not sent anywhere yet — consumed by a future notification scheduler.
 */
export function buildNotificationPayloads(brief) {
  const payloads = []

  // Morning brief notification (send at 07:00)
  payloads.push({
    type:    'morning_brief',
    time:    '07:00',
    title:   `Today: ${brief.theme}`,
    body:    `${brief.outlook} outlook. Best window: ${brief.bestWindow}.`,
    data:    { screen: 'home' }
  })

  // Opportunity alert (send 30 min before best window)
  if (brief.bestWindow) {
    const [h, m] = brief.bestWindow.split('–')[0].split(':').map(Number)
    const alertH = h === 0 ? 23 : h - 1
    payloads.push({
      type:    'opportunity',
      time:    `${String(alertH).padStart(2,'0')}:${String(m||0).padStart(2,'0')}`,
      title:   'Best window approaching',
      body:    brief.decisionOfDay || 'Your strongest window starts soon.',
      data:    { screen: 'home' }
    })
  }

  // Caution alert (send at avoid window start if present)
  if (brief.cautions.length > 0) {
    payloads.push({
      type:    'caution',
      time:    '17:00',
      title:   '⚠️ Watch out',
      body:    brief.watchFor,
      data:    { screen: 'home' }
    })
  }

  return payloads
}

// ─── Master function ──────────────────────────────────────────────────────────
/**
 * buildMorningBrief(dailyApiResponse, primaryMember)
 *
 * Consumes the /api/daily response and produces a MorningBrief.
 * Pure function — no side effects.
 */
export function buildMorningBrief(daily, primaryMember) {
  if (!daily || !primaryMember) return null

  const decisionObj    = primaryMember._decision || primaryMember
  const reasoningResult = primaryMember._reasoningResult || decisionObj._reasoningResult || null
  const recommendations = primaryMember.recommendations || { top:[], rest:[] }

  const decision   = decisionObj.decision   || 'WAIT'
  const confidence = primaryMember.confidence || decisionObj.confidence || 'Medium'
  const outlook    = deriveOutlook(decision, confidence)

  const brief = {
    theme:          primaryMember.focus || daily.focus || 'Decision Making',
    outlook,
    bestWindow:     primaryMember.golden_window || daily.golden_window,
    avoidWindow:    primaryMember.avoid_window  || daily.avoid_window,
    decisionOfDay:  buildDecisionOfDay(reasoningResult, decisionObj) || daily.why,
    opportunities:  buildOpportunities(recommendations),
    cautions:       buildCautions(recommendations),
    familyBrief:    buildFamilyBrief(daily.family_alignment, daily.members),
    tomorrowPreview: buildTomorrowPreview(daily.week_plan),
    confidence,
    watchFor:       buildWatchFor(reasoningResult, primaryMember.avoid_window || daily.avoid_window),
    nakshatra:      daily.nakshatra,
    dasha:          primaryMember.dasha || daily.dasha
  }

  brief.notifications = buildNotificationPayloads(brief)
  return brief
}
