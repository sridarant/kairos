# Recommendation Pipeline

## Overview

Recommendations flow through 7 independent stages. No stage knows about the stages above it.

```
Layer 1: Astronomy (getDailyAstronomy)
  → panchang: tithi, nakshatra, vara, yoga, karana
  → planet positions for the day

Layer 2: Astrology (buildAstroContext)
  → tithiEffect, nakshatraEffect, varaEffect, yogaEffect
  → lagna (ascendant), certaintyFactor
  → birth chart integration (getBirthChart)

Layer 3: Reasoning (runFullReasoning)
  → evidenceNodes: per-factor evidence with quality + weight
  → categories: per-life-area quality score (supportive/neutral/caution)
  → signals: human-readable positive/caution signals
  → conflict resolution: when evidence contradicts

Layer 4: Decision Engine (buildDecisionObject)
  → scoreSlots: 6 time slots scored on 4 dimensions (d/c/f/r)
  → golden/worst slot selection
  → DO / WAIT / AVOID decision
  → confidence score (0–100%)
  → stars (1–5) for the overall day

Layer 5: Recommendations (buildAllRecommendations in reasoning path)
  → 15 categories scored per-reasoning evidence
  → bestWindowForCategory: each category independently scores its dimension
     career/travel/legal → 'd' dimension max slot
     relationships/family/communication → 'c' dimension max slot
     health/learning/spiritual → 'f' dimension max slot
     finance/shopping/property → 'r' dimension min slot (lowest risk)
  → category stars from ratio formula (gradual, not binary)

Layer 6: Daily Brief (buildMorningBrief)
  → synthesises top opportunity, caution, family brief, tomorrow preview
  → reads from recommendations.top[0..1], not independent

Layer 7: Adapters (adaptRecommendations)
  → camelCase normalisation
  → stars capped at min(rawStars, overallStars + 1)
     prevents "Exceptional" labels on 2-star days
```

## Category → Dimension Mapping

| Category | Dimension | Direction |
|---|---|---|
| career, business, travel, legal | d (decision) | highest |
| relationships, family, communication | c (communication) | highest |
| health, learning, spiritual, medical | f (focus) | highest |
| finance, shopping, property | r (risk) | lowest |

## Signal Labels (RecommendationCard)

| Stars | Quality | Label |
|---|---|---|
| any | caution or ≤1★ | Be mindful |
| 5★ | any | Exceptional |
| 4★ | supportive | Strong opportunity |
| 4★ | other | Favourable |
| 3★ | any | Worth considering |
| any | mixed | Mixed signals |
| other | — | Consider |

## Per-Category Best Window

`categoryBestWindow(cat, scoredSlots, goldenWindow)` in `lib/reasoning/recommendationBuilder.js`:

1. Scores each of the 6 time slots on the category's primary dimension
2. Returns the slot time with the best score for that dimension
3. Falls back to `goldenWindow` when all slots are uniform (genuine finding)
4. Finance/property/shopping pick the MINIMUM risk slot, not maximum

## Key Production Bugs Fixed

- **v27:** All categories shared global `goldenWindow` — fixed by per-category scoring
- **v30:** `best_time` snake_case lost in adapter — fixed in `RecommendationAdapter`
- **v30.3:** `daily.why` didn't exist — fixed to use `member.summary`
- **v30.6:** All categories showing stars=5 on 2-star days — cap was applied; then R2.2 removed the cap intentionally
- **R2.2:** Star cap removed — domain stars now reflect domain-specific evidence (P0-6); domain exceptions exposed via `isException`/`exceptionReason` in DailyInsight.domains
