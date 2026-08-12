# DTO Reference — v30.10.2

All DTOs are camelCase. Adapters in `lib/adapters/` are the sole snake_case→camelCase boundary.

## DailyInsight (lib/models/DailyInsight.js)

The canonical product output. api/daily.js builds this and serializes it to the API DTO.

```js
DailyInsight {
  profileId:        string          // user name or 'anonymous'
  name:             string | null
  date:             'YYYY-MM-DD'
  timezone:         string          // IANA timezone
  calcVersion:      string          // from lib/utils/version.js CALC_VERSION
  generatedAt:      ISO string
  locationStatus:   'approximate' | 'unresolved' | 'resolved'
  locationSource:   string

  overall: {
    suitabilityScore:  0–100         // from slot composite (P0-1)
    suitabilityTier:   'Excellent'|'Good'|'Neutral'|'Moderate'|'Challenging'
    confidenceScore:   0–100         // from evidence agreement (P0-8 — always separate)
    confidenceTier:    'High'|'Medium'|'Low'
    decision:          'DO'|'WAIT'|'AVOID'
    stars:             1–5           // from suitabilityScore, not confidenceScore
    goldenWindow:      'HH:MM–HH:MM' | null
    avoidWindow:       'HH:MM–HH:MM' | null
  }

  theme:    string                   // primary activity focus

  windows: {                         // per-domain canonical windows (P0-9)
    _overall:      'HH:MM–HH:MM'    // general best window
    career:        'HH:MM–HH:MM'    // d-dimension best slot
    finance:       'HH:MM–HH:MM'    // r-dimension lowest risk slot (may differ from _overall)
    ...                              // all 15 domains
  }

  domains: {                         // per-domain scores (P0-6: uncapped)
    finance: {
      suitabilityScore: number       // independent domain score
      suitabilityTier:  string
      stars:            number       // NOT capped by overall.stars
      quality:          'supportive'|'caution'|'mixed'|'neutral'
      bestWindow:       string
      windowLabel:      string       // 'Best finance window' if domain-specific
      isExceptionWindow:boolean      // true when domain window ≠ _overall
      isException:      boolean      // true when domain score differs ≥20 from overall
      exceptionReason:  string|null
      keyFactors:       EvidenceFactor[]
      trace:            string|null
    }
    ...  // career, relationships, health, learning, travel, spiritual,
         // home, family, shopping, medical, communication, business, property, legal
  }

  recommendations: { top: RawRec[], rest: RawRec[] }
  signals:         { positive: string[], caution: string[], neutral: string[] }
  reasons:         string[]
  timeline:        TimelineEvent[]
  familyAlignment: object | null
  weekPlan:        WeekPlanDay[]

  calculationTrace: {                // internal — never in standard DTOs (P0-10)
    scoredSlots:    ScoredSlot[]
    panchang:       object|null
    dasha:          object|null
    yogas:          object[]
    lagna:          object|null
    nakshatraFx:    object|null
    tithiFx:        object|null
  }
}
```

## API DTO (/api/daily response)

Serialization of DailyInsight plus backward-compat fields:

```js
{
  // Core from DailyInsight.overall
  overall: { suitabilityScore, suitabilityTier, confidenceScore, confidenceTier, ... }
  theme, windows, domains, recommendations, signals, timeline

  // Legacy backward-compat
  golden_window, avoid_window, confidence_summary, focus, stars

  // Explicit suitability (P0-8)
  suitabilityScore, suitabilityTier

  // Family
  members: MemberDTO[]
  family_alignment: object | null
  family_overlap: FamilyOverlapDTO  // P0-4: pre-computed server-side

  week_plan: WeekPlanDay[]

  // Panchang display
  planet, nakshatra, tithi

  _meta: { calculationVersion, generatedAt, targetDate, locationStatus, profileId }
}
```

## FamilyOverlapDTO (P0-4)

```js
{
  harmonyScore:    number
  stars:           1–5
  confidence:      'High'|'Medium'|'Low'
  bestSharedWindow:'HH:MM–HH:MM' | null
  overlapType:     'all-members'|'partial'|'majority'|'none'
  overlapMembers:  string[]       // names of members sharing the window
  hasSharedWindow: boolean
  explanation:     string         // grounded text from lib/planning/familyOverlap.js
  pairwiseOverlap: PairOverlap[]
  recommended:     string[]
  avoid:           string[]
}
```

## RecommendationPackage (lib/adapters/RecommendationAdapter.js)

```js
{
  id:             string           // 'rec_finance_YYYY-MM-DD'
  category:       string
  icon:           string
  title:          string
  summary:        string
  recommendation: string
  reasoning:      string | null
  bestWindow:     'HH:MM–HH:MM' | null
  confidence:     'High'|'Medium'|'Low'
  stars:          1–5              // domain-specific; NOT capped by overall (P0-6)
  quality:        'supportive'|'caution'|'mixed'|'neutral'
  priority:       number
  feedbackStatus: 'pending'|'helpful'|'not_helpful'|'skipped'
}
```

## MemberDTO (lib/adapters/MemberAdapter.js)

```js
{
  name, decision, confidence, confidenceScore,
  stars, suitabilityScore, suitabilityTier,
  goldenWindow, avoidWindow, focus, summary,
  windows,         // per-domain windows from buildWindowMap
  scoredSlots,     // preserved for planning/overlap calculations
  _reasoningResult,// preserved for explainability
  locationStatus, locationSource,
  recommendations: { top, rest },
  timeline,
  dasha, yoga
}
```
