# Kairos Architecture — v30.10.2

*Updated to reflect R2.1 (UTC/longitude/Dasha fixes) and R2.2 (DailyInsight canonical model).*

## Runtime

- Vite 5 + React 18
- Vercel serverless API functions
- Supabase optional
- PWA / Workbox
- JavaScript / ES modules

## Layer Stack

```
Layer 1: Astronomy        lib/astronomy/         Pure calculations. JD, planets, Lagna.
Layer 2: Astrology        lib/astrology/         Panchang, Dasha, Yogas, transit context.
Layer 3: Reasoning        lib/reasoning/         Evidence graph, conflict resolution.
Layer 4: Decision         lib/decision/          DO/WAIT/AVOID, suitability, confidence.
Layer 5: Models           lib/models/            DailyInsight — canonical product output.
Layer 6: Recommendations  lib/recommendations/   Ranked recommendation packages.
Layer 7: Daily Brief      lib/dailyBrief/        Morning brief synthesis.
Layer 8: Planning         lib/planning/          Activity planning, family overlap.
Layer 9: Adapters         lib/adapters/          DTO boundary. Snake→camelCase.
Layer 10: Bootstrap       src/app/bootstrap/     API orchestration, DTO pipeline.
Layer 11: React State     src/hooks/             Single state surface.
Layer 12: Presentation    src/components/        Render only. No business logic.
```

## Canonical Calculation Path

```
POST /api/daily
  → getDailyAstronomy(targetDate)             Layer 1
  → getBirthChartFromParts(day,mo,yr,bh,bm,lat,lon,tz)  Layer 1 — P0-1/P0-2 fix
  → buildAstroContext(astro, chart, dob, ahead, targetDate)  Layer 2 — P0-5/P0-6 fix
  → buildDecisionObject(ctx, seed, ahead)     Layer 4
  → buildDailyInsight(decisionObj, ...)       Layer 5 — ONE canonical model
  → buildFamilyDTO(alignment, members)        Layer 8 — P0-4 fix
  → serialize to DTO                          Layer 9
  
Client:
  → fetchDailyAPI(users, daysAhead, calculationDate)  calculationDate from client local TZ
  → buildApplicationDTOs(daily, feedback)    Bootstrap
  → adaptDailyBrief / adaptRecommendations / adaptTimeline / adaptWeeklyPlan / adaptMembers
  → useBootstrap() state
  → AppShell → Shell → Screen (render only)
```

## Key Architectural Fixes Applied

| Sprint | Fix | File |
|---|---|---|
| R2.1 | Birth time converted to UTC before JD | `lib/astronomy/timeUtils.js` |
| R2.1 | Lagna uses actual longitude (not 0°) | `lib/astronomy/ephemeris.js` |
| R2.1 | Dasha uses targetDate not new Date() | `lib/astrology/dasha.js` |
| R2.1 | feedbackAdj no longer passed as userDob | `api/daily.js` |
| R2.2 | DailyInsight is canonical product output | `lib/models/DailyInsight.js` |
| R2.2 | api/daily builds DailyInsight then serializes | `api/daily.js` |
| R2.2 | Family overlap computed server-side | `api/daily.js` → `lib/planning/familyOverlap.js` |
| R2.2 | Domain star cap removed; exceptions explicit | `lib/adapters/RecommendationAdapter.js` |
| R2.2 | suitabilityTier/Score reach DailyBriefAdapter | `lib/adapters/DailyBriefAdapter.js` |

## DTO Boundary (Constitution §17)

All engine output reaches React through adapters. No raw engine object appears in any component.

**Single adapter boundary:**
- `lib/adapters/` — all production adapters
- `lib/adapters/PlannerHorizonAdapter.js` — Planner horizon responses
- `lib/adapters/MemberAdapter.js` — family member DTOs

## Location Resolution

`lib/astronomy/birthLocation.js` — three-state model:
- `UNRESOLVED` — text entered, no coordinates known
- `APPROXIMATE` — city matched in known-city list (35+ cities)
- `RESOLVED` — exact coordinates supplied

`lib/astronomy/timeUtils.js` — canonical local→UTC conversion using IANA timezone.

## Legacy Code Status

| File | Status | Action |
|---|---|---|
| `api/ask.js` | LEGACY — returns HTTP 410 | Retain |
| `api/astro.js` | LEGACY — no callers | Retain with header |
| `api/engine.js` | DEAD — no callers | Retain with header |
| `lib/astro/*` | LEGACY — only imported by `api/astro.js` | Retain with header |
| `lib/decision/index.js` | LEGACY — no callers | Retain with header |
| `lib/decision/recommendations.js` | LEGACY — test migrated to canonical | Retain with header |

## One Source of Truth

| Concept | Location |
|---|---|
| RELEASE_VERSION | `lib/utils/version.js` |
| CALC_VERSION | `lib/utils/version.js` |
| Color tokens | `src/styles/tokens/colors.js` |
| Score→tier mapping | `lib/models/scoreTiers.js` |
| Domain dim mapping | `lib/models/DailyInsight.js` (DOMAIN_DIM) |
| Activity types | `lib/planning/activityPlanner.js` (ACTIVITY_TYPES) |
| Identity schema | `src/identity/IdentityRepository.js` (STORAGE_KEY, SCHEMA_VERSION) |
