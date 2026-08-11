# Kairos --- Claude Implementation Prompt Pack (Repo-Specific)

## How to use

Run one prompt at a time.

For every sprint: 1. Read `KAIROS_CONSTITUTION.md` first. 2. Inspect
actual source before editing. 3. Stay within sprint scope. 4. Run
required tests. 5. Deploy only after the release gate. 6. Stop after the
sprint report.

Never ask Claude to invent architecture. These prompts are based on the
uploaded repository baseline.

------------------------------------------------------------------------

# PROMPT 0 --- INSTALL THE CONSTITUTION + VERIFY BASELINE

``` text
You are working on the existing Kairos repository.

Before doing anything:
1. Read KAIROS_CONSTITUTION.md.
2. Read KAIROS_PHASE0_FORENSIC_BASELINE.md.
3. Read KAIROS_ARCHITECTURE.md.
4. Read KAIROS_DATA_CONTRACT.md.
5. Read KAIROS_TECH_DEBT.md.
6. Read the existing docs/ architecture, testing and deployment documents.

The Constitution is binding.

Do NOT redesign the UI.
Do NOT change calculations.
Do NOT invent missing architecture.

Your task is to establish the Phase 0 baseline in the actual repository.

Verify the following against source code:

- production /api/daily path
- identity → API data flow
- astronomy → astrology → reasoning → decision flow
- recommendation flow
- adapter flow
- bootstrap flow
- Planner flow
- Family flow
- legacy api/ask and api/astro paths
- Supabase persistence path
- versioning
- current design-system architecture

Confirm the known P0 findings in KAIROS_PHASE0_FORENSIC_BASELINE.md.

For each:
- VERIFIED
- NOT VERIFIED
- NEW FINDING

Do not modify production code except documentation if needed.

Run:
node lib/tests/engine.test.js
node lib/tests/adapters.test.js

Do not claim build status because dependencies may not be installed.

Produce a forensic report with:
- files inspected
- confirmed defects
- new defects
- contradictions between documentation and code
- exact files that Sprint 1 should modify

STOP.
```

------------------------------------------------------------------------

# PROMPT 1 --- CALCULATION AND DATA INTEGRITY

``` text
You are continuing Kairos.

Read:
KAIROS_CONSTITUTION.md
KAIROS_PHASE0_FORENSIC_BASELINE.md
KAIROS_ARCHITECTURE.md
KAIROS_DATA_CONTRACT.md
KAIROS_TECH_DEBT.md

Sprint objective:

FIX CALCULATION AND DATA INTEGRITY.

Do NOT redesign the UI in this sprint.

Do not make values look nicer. Make them correct.

## P0-01 — Separate suitability from confidence

Current defect:
lib/decision/engine.js derives stars from reasoning confidence.

Create separate canonical concepts:

overallSuitabilityScore
overallSuitabilityTier
confidenceScore
confidenceTier

Do not break existing API fields until all consumers are migrated.

Stars must represent suitability if stars remain in the product.

Confidence must never be presented as suitability.

Update DailyBrief accordingly.

## P0-02 — Fix recommendation star propagation

Current path:
BootstrapManager → adaptRecommendations(ranked, overallStars)

But adaptRecommendations currently accepts only one argument.

Fix the contract.

Add a real integration test covering:
DecisionObject → buildDailyPackages → rank → adaptRecommendations.

Do not rely only on unit-testing the adapter.

Do not use a blind "overall + 1" cap as the final scoring solution. First make the underlying metric model coherent.

## P0-03 — Fix weekly calculation

api/daily.js buildWeekPlan currently:
- passes primarySeed as daysAhead
- supplies null birth chart
- expects confidenceScore which is not returned

Fix all three.

Future-day calculations must use the same profile-specific calculation context as today.

The weekly result must contain canonical:
- suitability
- confidence
- best window
- theme

"Most Challenging" must be the minimum suitability day.

"Best Day" must be the maximum suitability day.

Add regression tests.

## P0-04 — Fix profile propagation

IdentityManager currently stores:
place_of_birth
timezone

but primaryUser/allUsers strip them.

Fix the canonical user payload.

Do not invent coordinates from city names.

Introduce an explicit location-resolution boundary if required.

Until location is actually resolved, the calculation must say that location precision is limited.

## P0-05 — Fix birth chart geographic model

Current getBirthChart():
- latitude only
- default 20°N
- no longitude
- no timezone

Do not fake precision.

Create a canonical resolved birth-location structure.

If a real geocoding service is not already available, do not invent one.

The code must clearly distinguish:
- user-entered birthplace text
- resolved coordinates
- unresolved location

## P0-06 — Fix current-date/timezone handling

Do not let server timezone determine user-facing daily calculations.

Introduce explicit calculation timezone/date handling.

Verify date boundaries around:
- 23:00 IST
- 00:00 IST
- 05:30 UTC
- DST zones where relevant

## P0-07 — Family overlap

Do not use majority window as "shared window".

Compute:
- all-member overlap
- pairwise overlap
- partial overlap
- no overlap

Do not fabricate harmony.

## P0-08 — Planner data source

Do not allow PlannerScreen to reconstruct users with empty DOB/time.

Planner must consume the canonical identity/profile data.

Do not move business logic into PlannerScreen.

## Tests required

Add tests for:
- suitability vs confidence
- category stars vs overall suitability
- weekly best/challenging
- future profile personalisation
- profile location propagation
- timezone/date boundary
- family overlap
- planner profile preservation

Run existing tests.

Then run all new tests.

Do not modify UI except where required to display corrected semantics.

Deploy only if tests pass.

Report exact files changed and evidence for every P0 fix.

STOP.
```

------------------------------------------------------------------------

# PROMPT 2 --- ONE CANONICAL TRUTH + REMOVE LEGACY DIVERGENCE

``` text
You are continuing Kairos.

Read all KAIROS documents first.

Sprint objective:

ONE CALCULATION
→ ONE CANONICAL MODEL
→ MANY VIEWS

Do not redesign the UI.

## 1. Trace production usage

Determine whether these are production, legacy, test-only or dead:

api/ask.js
api/astro.js
api/engine.js
lib/astro/*
lib/decision/index.js
lib/decision/recommendations.js

Do not delete anything merely because it looks old.

First establish usage.

## 2. Claude boundary

api/explain.js is intended to be language-only.

api/ask.js currently has a different architecture and can allow Claude output to alter decision/timing.

Either:
- migrate it to the canonical DecisionObject/language-only contract, or
- deprecate/remove it if no production caller requires it.

Do not leave two competing decision engines.

## 3. Canonical DailyInsight

Create/refine the canonical model containing:

profileId
date
timezone
calculationVersion
generatedAt

overall suitability
confidence
theme
windows
domains
recommendations
cautions
reasons
exceptions

## 4. Domain exception model

Finance/property/shopping may legitimately use a risk-oriented window while overall suitability uses another.

Represent this explicitly.

Do not force all domains to share the same window.

## 5. Adapter boundary

Remove PlannerScreen's direct API/business normalisation.

Create PlannerHorizonAdapter.

React receives DTOs only.

## 6. Remove reverse dependency

lib/recommendations/recommendationBuilder.js currently imports from src.

Move the generic ID utility into an appropriate lower layer or inject it.

No lib → src imports.

## 7. Invariants

Add automated cross-screen invariants:

- Today suitability = Planner same-day suitability
- Timeline window score = canonical window score
- Domain bestWindow exists in canonical windows
- Weekly challenging = minimum suitability
- Weekly best = maximum suitability
- Family overlap = canonical family result
- confidence never becomes suitability
- recommendation prose cannot contradict structured quality

## 8. Versioning

Create one calculation/release version source.

Remove contradictions between:
package.json
public/version.json
IdentityManager export version
documentation

Do not change versions arbitrarily; define the policy first.

Run tests.

Deploy.

STOP after report.
```

------------------------------------------------------------------------

# PROMPT 3 --- MINIMALIST LIGHT-FIRST UI REDESIGN

``` text
You are continuing Kairos.

Read:
KAIROS_CONSTITUTION.md
KAIROS_ARCHITECTURE.md
KAIROS_DATA_CONTRACT.md
KAIROS_RELEASE_CHECKLIST.md

This sprint is explicitly authorised to change presentation IA.

Do NOT change calculation semantics.

## PRODUCT DIRECTION

Kairos must become:

minimal
light-first
calm
spacious
easy to scan
decision-oriented

The current dark dashboard is NOT sacred.

Do not simply convert black to white.

Redesign the information architecture.

## TODAY

The screen should answer only:

1. How is today?
2. What matters most?
3. When is the best window?
4. What should I be careful about?

Primary structure:

Today
Overall suitability
Primary theme
Best window
One top recommendation
One caution
More guidance

Do not show ten equal-weight domain cards by default.

Use progressive disclosure.

## REMOVE CLUTTER

Reduce:
- cards
- badges
- stars
- emojis
- colours
- duplicated labels
- repeated time windows
- decorative containers

Prefer typography, whitespace and grouping.

## LIGHT THEME

Make light the default.

Create a semantic theme token system.

Remove duplicate colour definitions from:
- index.css
- constants/index.js
- userProfile.js
- styles/tokens/colors.js

Do not use raw hex values in components.

## DESKTOP

Do not retain the existing three-column dashboard merely because it exists.

Prefer:

compact navigation
+
primary content
+
optional contextual drawer/panel

Avoid multiple independent scrolling surfaces.

## TIMELINE

Make it compact.

Show:
time
activity
quality

Do not make every timeline row visually loud.

## PLANNER

Make Planner answer:
"What should I plan, and when?"

Avoid presenting a list of identical day cards.

## FAMILY

Make Family answer:
"When is the best time for us together?"

Keep pairwise/individual detail progressive.

## PROFILE

Make Profile clean and simple.

Show:
- profile quality
- required data
- family members
- calculation readiness

Do not expose technical implementation details.

## ICONOGRAPHY

Reduce emoji dependence.

Use the existing design-system icon strategy if possible.

Do not add a large icon library unless necessary.

## ACCESSIBILITY

Verify:
- contrast
- keyboard
- focus
- touch targets
- screen-reader labels
- reduced motion

## Acceptance criteria

A new user should be able to identify:
- overall day
- primary theme
- best window
- top action
- caution

within seconds.

If another card is required to explain these, the redesign has failed.

Run responsive tests.

Deploy.

Provide before/after screenshots and list removed UI elements.

STOP.
```

------------------------------------------------------------------------

# PROMPT 4 --- PLANNER / FAMILY / EXPLAINABILITY

``` text
You are continuing Kairos.

Read all KAIROS documents.

Objective:

Make Kairos a useful decision-planning companion.

## EXPLAINABILITY

Every important recommendation must expose:

What
When
Why
Confidence
Alternative where available

Use structured reason codes from the calculation layer.

Never invent explanations in React.

## PLANNER

Implement:

"What are you planning?"

The selected activity/decision must actually affect scoring.

Examples:
- Important conversation → communication
- Career decision → decision
- Financial decision → risk
- Major purchase → risk
- Travel → travel/decision
- Family activity → communication + focus
- Study → focus
- Health activity → focus
- Property decision → risk

Do NOT rank all dates by overall stars.

The planning engine must rank using the canonical domain/activity suitability.

Return:
1. best date/window
2. alternative
3. caution
4. reason
5. confidence

## FAMILY

Calculate:
- group overlap
- pairwise overlap where useful
- partial overlap

Do not call majority timing "shared timing".

Keep the UI minimalist.

## MEDICAL

Never recommend delaying necessary care.

Distinguish:
- wellness
- routine consultation
- major medical decision

## FINANCE

Use reflective/timing language.

Do not imply guaranteed outcomes.

## WHY

Expose concise explanations.

Example:
"Communication indicators are strongest during this window."

Only if supported by structured calculation evidence.

## ACCEPTANCE

- Plan Something changes results based on selected activity
- Same date can rank differently for different decision types
- Family timing is mathematically explainable
- Explanations trace to reason codes
- no business logic in React

Run tests and deploy.

STOP.
```

------------------------------------------------------------------------

# PROMPT 5 --- HARDENING / FINAL RELEASE

``` text
You are continuing Kairos.

This is a hardening sprint, not a feature sprint.

Read all KAIROS documents.

## FULL AUDIT

Inspect:
- calculation
- APIs
- DTOs
- adapters
- bootstrap
- React
- identity
- planner
- family
- persistence
- PWA
- deployment

## DATA

Verify:
- profile isolation
- date isolation
- timezone
- birth location
- no silent defaults
- calculation version
- no stale results

## ARCHITECTURE

Verify:
- one calculation path
- no legacy production path
- no React scoring
- no Planner API bypass
- no lower-layer → src imports
- DTO boundary intact

## UI

Verify:
- light-first
- minimalist
- no duplicated information
- no unnecessary cards
- no unnecessary scrollbars
- responsive
- accessible

## SECURITY

Verify:
- no secrets in client
- API input validation
- Supabase access model
- user data isolation
- no permissive production RLS

## TESTS

Run all existing tests plus every regression test added in Sprints 1–4.

Build the actual production bundle.

Deploy.

Test the deployed URL, not just local.

Do not declare PASS without evidence.

Do not add new features.

STOP after the final report.

The next action after this sprint is an independent external product audit.
```
