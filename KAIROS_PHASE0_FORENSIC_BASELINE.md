# Kairos --- Phase 0 Forensic Baseline

Date: 2026-08-11 Source inspected: uploaded `kairos(1).zip` Repository
size: \~290 KB compressed Source files: 107 JS/JSX files Approximate
JS/JSX LOC: 12,351 Git history: not included in ZIP node_modules: not
included Build execution: NOT RUN because dependencies are not installed
in the uploaded workspace Automated engine tests: PASS --- 35/35
Automated adapter/DTO tests: PASS --- 70/70

## 1. Executive conclusion

The repository is materially more advanced than the previous Phase 0
brief suggested. It is a Vite + React 18 PWA with a 10-layer documented
architecture and a deterministic calculation/reasoning pipeline.

However, the current implementation contains several **verified
architectural and data-flow defects** that explain a large portion of
the screenshot anomalies.

The most important finding is:

> The displayed overall day rating is derived from confidence, while
> category recommendations are independently derived from
> evidence/category ratios. This allows a 2-star / Challenging day to
> coexist with multiple 5-star / Exceptional categories.

A second major finding is:

> The weekly planner is not using the user's birth chart for future-day
> calculations and its "Most Challenging" selection is currently based
> on confidence values that are effectively hardcoded to 50 in
> `api/daily.js`, causing the final array element to become the
> challenging day when values tie.

A third major finding is:

> Planner "Plan Something" currently ignores the selected activity's
> dimension mapping and simply ranks dates by the overall primary-member
> stars.

A fourth major finding is:

> Birth location and timezone are collected in the identity model but
> are stripped before `/api/daily`, and `getBirthChart()` itself accepts
> only latitude with a default of 20°N and assumes longitude 0. This
> means the profile's displayed birthplace is not currently driving the
> natal calculation.

These are P0/P1 issues and should be fixed before the minimalist UI
redesign.

------------------------------------------------------------------------

# 2. Actual architecture

Documented/current stack:

-   Vite 5
-   React 18
-   Supabase client
-   Vercel serverless API functions
-   PWA via `vite-plugin-pwa` / Workbox
-   JavaScript, not TypeScript

Layered structure:

1.  Astronomy --- `lib/astronomy`
2.  Astrology --- `lib/astrology`
3.  Reasoning --- `lib/reasoning`
4.  Decision --- `lib/decision`
5.  Recommendations --- `lib/recommendations`
6.  Daily Brief --- `lib/dailyBrief`
7.  Adapters --- `lib/adapters`
8.  Bootstrap --- `src/app/bootstrap`
9.  React state --- `src/hooks`
10. Presentation --- `src/components`

The principal production path is:

`/api/daily` → `getDailyAstronomy` → `getBirthChart` →
`buildAstroContext` → `buildDecisionObject` → `runFullReasoning` →
recommendation output → Bootstrap DTO/adapters → React screens.

------------------------------------------------------------------------

# 3. Verified calculation/data issues

## P0-01 --- Overall stars are confidence, not day suitability

Source: `lib/decision/engine.js`

`buildDecisionObject()` returns:

-   `stars: scoreToStars(reasoning.confidenceScore || confResult.score)`

Therefore the displayed 1--5 day stars represent **confidence**, not an
overall suitability score.

`lib/dailyBrief/index.js` then derives:

-   `Challenging` when confidence is `Low`
-   `Positive` only when decision is DO + High confidence

This creates the observed semantic mismatch:

-   day can have strong raw timing slots
-   multiple categories can be supportive
-   yet the header says `★★☆☆☆ Challenging Day`

Recommendation: Create separate canonical values:

-   `overallSuitabilityScore`
-   `overallSuitabilityTier`
-   `confidenceScore`
-   `confidenceTier`

Never use confidence as the day suitability rating.

------------------------------------------------------------------------

## P0-02 --- Category stars can become 5 stars on a 2-star day

Source: `lib/reasoning/recommendationBuilder.js`

Category stars are independently calculated from evidence ratios.

`lib/adapters/RecommendationAdapter.js` contains a protection:

`stars = Math.min(rawStars, overallStars + 1)`

However:

`adaptRecommendations(pkgs)` accepts only one argument.

`BootstrapManager.js` calls:

`adaptRecommendations(ranked, primary?.stars || daily?.stars)`

The second argument is ignored.

Therefore the intended cap is not applied.

This directly explains the screenshot pattern where the overall day is 2
stars while many categories display "Exceptional"/5 stars.

Recommendation: - Change adapter contract explicitly. - Pass canonical
overall suitability. - Add regression test for the real bootstrap path,
not only isolated adapter calls. - Prefer eliminating the need for a
blunt cap by establishing a coherent scoring model.

------------------------------------------------------------------------

## P0-03 --- Weekly plan confidence is broken

Source: `api/daily.js`

`buildWeekPlan()` calls:

`buildAstroContext(dayAstro, null, null, primarySeed)`

The fourth parameter is `daysAhead`, so `primarySeed` is incorrectly
being passed as the future-date offset.

Then:

`buildDecisionObject(dayCtx, primarySeed, 0)`

uses 0 as the actual `daysAhead`.

More importantly:

`dayDec.confidenceScore || 50`

is stored as the weekly confidence, but `buildDecisionObject()` does not
return `confidenceScore`.

Therefore every day falls back to `50`.

Result: - weekly confidence values are effectively identical -
`buildWeeklyPlan()` sorts by confidence - `worstDay` becomes the last
element rather than the actual lowest suitability day

This explains the screenshot's "MOST CHALLENGING Mon, Aug 17" despite
visually identical 2-star days.

Recommendation: - Return canonical confidence and suitability metrics
explicitly. - Calculate future days with the correct profile/chart. -
Rank challenging/best days using suitability, not confidence. - Add test
asserting `challenging = minimum suitability score`.

------------------------------------------------------------------------

## P0-04 --- Weekly calculation is not personalised

Source: `api/daily.js`

Future-day calculation calls:

`buildAstroContext(dayAstro, null, null, ...)`

No birth chart is supplied.

Therefore future weekly scores do not use the user's natal chart, dasha,
natal houses, etc.

Recommendation: Future-day calculation must reuse the same
profile-specific calculation context required by the canonical daily
calculation.

------------------------------------------------------------------------

## P0-05 --- Planner horizon destroys profile data

Source: `src/components/PlannerScreen.jsx`

The Planner derives users as:

`{ name: m.name, dob:'', birth_time:'' }`

It then sends those users to `/api/daily`.

`api/daily.js` defaults missing DOB/time to:

-   01-01-1990
-   06:00

Therefore Planner future-day requests are not using the actual profile.

This is a verified defect.

Recommendation: Planner must never reconstruct user profiles from
display DTOs.

Use the canonical identity/profile source.

------------------------------------------------------------------------

## P0-06 --- Planner "Plan Something" ignores the selected activity

Source: `src/components/PlannerScreen.jsx`

`PLAN_TYPES` correctly defines dimensions:

-   finance → risk
-   property → risk
-   health → focus
-   communication → communication

But `pickType()` ignores `type.dims` and `type.invert`.

It simply sorts all horizon days by:

`primary.stars`

Therefore:

"Financial decision --- Best Dates"

does not actually rank dates by financial/risk suitability.

Recommendation: Move event/decision scoring to the canonical
decision/planning layer.

React must not perform business scoring.

------------------------------------------------------------------------

## P0-07 --- Birthplace is collected but does not currently drive the natal chart

Identity schema stores:

-   `place_of_birth`
-   `timezone`

But `IdentityManager.primaryUser` and `allUsers` only return:

-   name
-   dob
-   birth_time
-   type

So birthplace and timezone are stripped before `/api/daily`.

`api/daily.js` can parse `place_of_birth` and `timezone`, but they never
arrive.

`getBirthChart()` accepts:

`dobString, birthTimeString, lat = 20`

and uses: - latitude only - default latitude 20°N - no longitude - no
timezone

`computeLagna()` also defaults to a simplified longitude of 0°.

This means the Profile UI currently suggests more geographic precision
than the calculation actually uses.

Recommendation: Establish a canonical resolved birth location:

-   latitude
-   longitude
-   IANA timezone
-   source/resolution status

Do not claim location-personalised calculation until these values
actually drive the engine.

------------------------------------------------------------------------

## P0-08 --- Current-date/timezone source is inconsistent

Client date context uses browser-local time.

`api/daily.js` uses:

`new Date()`

and `getDailyAstronomy()` uses the server's Date fields.

The calculation timezone is therefore server-dependent rather than
explicitly profile/current-location dependent.

This can produce date/panchang boundary errors.

Recommendation: Pass an explicit calculation date/timezone context from
the client or canonical profile/current location layer.

------------------------------------------------------------------------

## P0-09 --- Family "shared window" is majority, not intersection

Source: `lib/decision/engine.js`

Family calculation counts each member's `goldenWindow` and chooses the
most common window.

This is not the same as calculating a genuine shared overlap.

If: - A = 09--11 - B = 09--11 - C = 17--19

the result is 09--11 even though C cannot participate in that window.

The UI says: "Derived from individual members' windows"

but the semantic interpretation is stronger than the calculation
supports.

Recommendation: Calculate: - group intersection - pairwise overlaps -
partial overlap - no common overlap

------------------------------------------------------------------------

## P1-01 --- Family harmony is not a true compatibility model

`runFamilyDecisionEngine()` and `buildFamilyDecisionObject()` rely
heavily on: - raw member scores - average - variance - majority windows

The repository itself documents this as simplified.

Recommendation: Do not label this "Strong Harmony" unless the underlying
metric genuinely measures relational compatibility.

Use: "Shared timing" or "Good overlap" until the relationship model is
stronger.

------------------------------------------------------------------------

# 4. Verified architecture problems

## P0-10 --- Duplicate/legacy calculation stacks exist

There are multiple overlapping systems:

-   `lib/decision/engine.js`
-   `lib/decision/index.js`
-   `lib/decision/recommendations.js`
-   `lib/astro/*`
-   `api/astro.js`
-   `api/ask.js`
-   `api/engine.js`

The main `/api/daily` path uses the newer `lib/decision/engine.js` /
`lib/reasoning/*` path.

The older stack remains reachable through `api/ask.js`, `api/astro.js`,
and `lib/astro/*`.

This creates a high risk of semantic divergence.

Recommendation: Trace every legacy module, classify: - production -
test-only - legacy - dead

Then remove or isolate legacy paths.

------------------------------------------------------------------------

## P0-11 --- `api/ask.js` violates the current "Claude language-only" architecture

`api/explain.js` follows the desired architecture.

`api/ask.js` does not.

It sends a prompt to Claude containing: - decision - best time -
confidence

and accepts Claude-generated JSON containing: - decision - best time -
avoid time - confidence

Only the decision enum is minimally validated.

This can allow Claude output to diverge from deterministic engine
output.

Recommendation: Deprecate/remove `api/ask.js` or route it through the
canonical DecisionObject + language-only architecture.

------------------------------------------------------------------------

## P1-02 --- Lower layer imports from `src`

`lib/recommendations/recommendationBuilder.js` imports:

`../../src/lib/nanoid.js`

This violates the documented downward-only architecture.

Recommendation: Move generic ID utility into a neutral lower-level
utility location, or inject ID generation from the appropriate boundary.

------------------------------------------------------------------------

## P1-03 --- DTO architecture is bypassed by Planner

The repository explicitly says all engine → React data must pass through
adapters.

`PlannerScreen.jsx` directly calls `/api/daily` and performs local
normalisation.

This is a documented exception, but it is still an architecture
violation.

Recommendation: Create a proper `PlannerHorizonAdapter` in
`lib/adapters`.

------------------------------------------------------------------------

# 5. Recommendation semantic issues

## P0-12 --- Finance/Property "best window" can legitimately conflict with timeline quality

The code intentionally calculates finance/property/shopping using the
risk dimension in inverse direction.

Therefore: - overall best slot can be 09--11 - finance best slot can be
17--19

This is not automatically a calculation bug.

The actual product bug is that the UI presents both without explaining
the distinction.

Recommendation: Introduce: - overall window suitability -
domain-specific window suitability

and explicitly label exceptions.

Example:

"Overall conditions are weak at 17--19, but financial risk indicators
are relatively more favourable."

------------------------------------------------------------------------

## P0-13 --- Health and Medical share the same primary dimension but use different semantics

Both are mapped to focus (`f`), but they have different prose:

Health: "Excellent window for health decisions and self-care."

Medical: "Good for consultations, check-ups and health decisions."

The domain taxonomy is too broad.

Recommendation: Separate: - Wellness / self-care - Medical
consultation - Treatment decision - Emergency/necessary care

Medical safety language must be explicit.

------------------------------------------------------------------------

# 6. UI architecture findings

## P1-04 --- Today screen is genuinely over-composed

`HomeScreen` currently renders:

-   header
-   install banner
-   demo/profile banner
-   date header
-   diagnostics in development
-   morning brief
-   recommendations
-   divider
-   upcoming
-   this week
-   divider
-   timeline
-   family brief
-   tomorrow
-   footer

Desktop then adds a third contextual column.

This matches the screenshot clutter.

Recommendation: Move to a minimalist hierarchy:

1.  Today
2.  Primary theme
3.  Best window
4.  One top recommendation
5.  One caution
6.  Optional "More"

Everything else progressively disclosed.

------------------------------------------------------------------------

## P1-05 --- Tomorrow is duplicated on desktop

`HomeScreen` renders `TomorrowSection`.

`DesktopShell.ContextPanel` also renders `TomorrowSection`.

Therefore desktop can display the same information in two places.

Recommendation: One source/placement only.

------------------------------------------------------------------------

## P1-06 --- Desktop has multiple scroll contexts

-   primary content has `overflowY:auto`
-   context panel has `overflowY:auto`
-   side nav has `overflowY:auto`
-   Profile modal has its own scroll

This is functional but increases cognitive/interaction complexity.

Recommendation: Prefer one primary scroll surface and a lightweight
contextual panel/drawer.

------------------------------------------------------------------------

## P1-07 --- Current design system is explicitly frozen around the old visual direction

`docs/design-system/DESIGN_SYSTEM.md` states the design system is frozen
after v30.

Current tokens are dark-first.

The new product direction intentionally requires: - light-first -
minimal - lower visual density

Therefore the design system must be deliberately versioned/reopened in
the redesign sprint.

------------------------------------------------------------------------

## P1-08 --- Design-system claims are already violated

Release checklist says: "No raw hex in component files."

Actual source contains raw hex in multiple component files, including: -
`FamilyScreen.jsx` - `PlannerScreen.jsx` - `TimelineSection.jsx` -
`MorningBriefSection.jsx` - `BirthTimeInput.jsx` - `DemoBanner.jsx` -
`design-system/components/index.jsx`

There are also duplicate colour systems in: - `src/index.css` -
`src/constants/index.js` - `src/styles/tokens/colors.js` -
`src/app/config/userProfile.js`

Recommendation: Create one semantic theme system during UI redesign.

------------------------------------------------------------------------

# 7. Data-contract issues

## P1-09 --- Versioning is inconsistent

`package.json`: `1.0.0`

`public/version.json`: `30.7.1`

`IdentityManager.export()`: `30.3.2`

Documentation references v30/v31 while changelog is largely v11/v12.

Recommendation: Create one release/version source of truth.

------------------------------------------------------------------------

## P1-10 --- Supabase documentation and implementation disagree

`api/data.js` uses table: `user_data`

`api/supabase.js` comments define: - `kairos_users` - `kairos_history` -
`kairos_feedback` - `kairos_profiles`

`SUPABASE_SETUP.md` also references the latter schema.

Deployment documentation says to create `user_data`.

This needs reconciliation.

------------------------------------------------------------------------

## P1-11 --- Supabase security model is not production-safe as documented

`api/supabase.js` contains a suggested permissive RLS policy:

`allow_all ... USING (true)`

Combined with a client-supplied `userId`, this is not an acceptable
production privacy model.

Recommendation: Define a real identity/authentication model before
enabling server-side persistence for private user data.

------------------------------------------------------------------------

# 8. Testing gaps

Current tests: - engine: 35 pass - adapters: 70 pass

These are useful unit tests but do not cover the actual product
invariants that failed visibly.

Missing tests include:

1.  Overall suitability ≠ confidence
2.  Category stars vs overall score
3.  Bootstrap → adapter parameter propagation
4.  Weekly challenging day = minimum suitability
5.  Weekly calculations use profile birth chart
6.  Planner preserves profile data
7.  Planner event type changes scoring
8.  Family overlap is true intersection
9.  Date/timezone consistency
10. Birth location affects calculation
11. `api/ask` cannot override canonical decisions
12. Desktop does not duplicate Tomorrow
13. All React data passes through DTOs
14. No raw hex in components
15. No legacy calculation path is used by production UI

------------------------------------------------------------------------

# 9. Product architecture recommendation

Target:

Profile → Input Normalisation → Canonical Calculation Context →
Astronomy → Astrology → Evidence → Reasoning → Canonical Suitability →
Domain Suitability → Time Windows → Recommendation → Presentation DTO →
UI

The canonical daily object should distinguish:

-   overall suitability
-   domain suitability
-   time-window suitability
-   confidence
-   reasons
-   exceptions
-   calculation version
-   date/timezone

Do not collapse these into one star value.

------------------------------------------------------------------------

# 10. Phase order

### Phase 1

Fix calculation/data integrity.

### Phase 2

Consolidate canonical truth and remove duplicate/legacy paths.

### Phase 3

Minimalist light-first redesign.

### Phase 4

Planner/Family/Explainability.

### Phase 5

Hardening and production release.

Then stop for an independent product audit.
