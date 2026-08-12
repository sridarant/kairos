# Kairos Changelog

## v30.10.5 — R2.5 Production Hardening (2026-08-11)

**No new features. Hardening only.**

- Added `npm test` script (was absent)
- Fixed absolute filesystem path in test file (now portable)
- Added 59 production hardening tests covering: security, API integration, calculation determinism, medical/financial safety boundaries, data contract, accessibility markers, nav label correctness
- Integration tests for /api/daily (7 scenarios), /api/horizon (4 scenarios), /api/explain (Claude boundary)
- Release gate: 35 programmatic PASS checks — runs before every release
- All 465 tests pass (395 engine + 70 adapter)

## v30.10.4 — R2.4 Minimalist UI (2026-08-11)

- Suitability display: "Exceptional/Strong/Moderate/Challenging/Caution" instead of star numbers
- Stars are now secondary; tier label is the primary semantic indicator
- Desktop context panel: collapsible (was always-visible 280px)
- Navigation label: "Settings" → "Profile" across all shells (Mobile, Desktop, Tablet, BottomNav)
- Family window label: "Best family window" (was unqualified "Best Window")
- FamilyBriefSection: window explicitly labelled
- TomorrowSection: removed StarRating card, now compact 2-line text
- ProfileModal: distinguishes profile completeness (4/4) from calculation quality (High/Medium/Low) from location status
- scoreTiers.js: display labels updated to match spec

## v30.10.3 — R2.3 Planner Architecture (2026-08-11)

- NEW: `/api/horizon` endpoint — single request for 7 or 14 day horizon
- NEW: `lib/planning/horizonPlanner.js` — canonical horizon calculation
- Before: 7-day Planner = 56 day-calculations (7 × 8 serial). After: 7 day-calculations
- Activity type passed to horizon: finance/career produce different ranked dates
- Activity grouping: Work/Money/Personal/Health (progressive disclosure)
- "Best date" and "Best window" are now semantically distinct in UI
- Failed days surfaced (not silently skipped)
- 29 new tests

## v30.10.2 — R2.2 Canonical Truth (2026-08-11)

- `buildDailyInsight()` is now the canonical product output
- `api/daily.js` builds DailyInsight then serializes to DTO (no parallel representation)
- Family overlap computed server-side in `buildFamilyDTO()` — React no longer calls engine
- `DailyBriefAdapter`: suitabilityTier and suitabilityScore now pass through correctly
- Domain star cap removed (P0-6): finance on a Moderate day can show 4★
- `lib/models/scoreTiers.js` created: single score→tier→label mapping
- `calculationTrace` separate from main DailyInsight (P0-10)
- 34 new tests

## v30.10.1 — R2.1 Calculation Integrity (2026-08-11)

- `lib/astronomy/timeUtils.js` created: canonical local→UTC→JD conversion
- `computeLagna()`: longitude now used in RAMC (was hardcoded 0°)
- `getBirthChart()` and `getBirthChartFromParts()`: accept timezone and longitude
- Kumbakonam added to location resolver (10.96°N, 79.39°E)
- 14 Tamil Nadu/South India cities added to resolver
- `computeVimshottariDasha()`: uses targetDate not new Date()
- `buildAstroContext()`: feedbackAdj no longer passed as userDob
- `parseUser()`: no silent default DOB (hasDob flag)
- Birth time accuracy field added to identity model
- 40 new R2.1 tests

## v30.10.0 — Sprint 5 Canonical Model (2026-08-11)

- Legacy lib/decision/recommendations.js: test migrated to canonical path
- CALC_VERSION: single source in lib/utils/version.js
- PlannerHorizonAdapter: scoredSlots and _reasoningResult now preserved
- Weekly plan challenging day: suitabilityScore now included in output
- 32 new cross-screen invariant tests (INV-A through INV-I)

## Earlier versions (v30.9.x through v30.8)

See git history for detailed changes covering:
- R2 sprint series (UTC, location, DailyInsight, family overlap, planner)
- Light-first design system
- Adapter DTO boundary
- Family slot-level overlap
- Activity-based planning engine
