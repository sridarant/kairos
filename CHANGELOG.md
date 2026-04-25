# Kairos Changelog

## v5.1.0 — Action Intelligence Upgrade (2026-04-25)

### Features
- Actionable decision responses: every Ask reply now starts with a clear instruction
  (e.g. "Proceed with this now", "Hold — act during 09:00–11:00", "Do not proceed today")
- WAIT responses include `next_best` — the next highest-scoring window outside the current slot
- `next_best` field returned in Ask API response
- Improved context classification with 5 categories: career, money, learning, health, relationships
- Each context now carries a `verb` used to generate the action instruction deterministically

### Improvements
- `buildPrompt()` restructured: action and timing are fixed values, not suggestions to Claude
- Claude only writes the message sentence — logic, timing, action are all engine-computed
- Daily `buildSummary()` is now actionable: "Use your X window… Avoid starting new commitments after Y"
- Prompt version updated to Kairos v5.1

## v5.0.0 — Birth Astro Layer (2026-04-25)
- Lagna (ascendant) and personal moon sign, 7-layer scoring engine

## v4.1.0 — Cultural Language Layer (2026-04-25)
- Sanskrit and Tamil names for planets and nakshatras

## v3.1.0 — Personal Realism Upgrade (2026-04-25)
- User trait model, 6-layer scoring

## v3.0.0 — Astro Core Upgrade (2026-04-25)
- Lunar phase, nakshatra day archetypes, 5-layer scoring

## v2.1.0 — Trust Layer Upgrade (2026-04-25)
- Explainable messages, spread-based confidence

## v2.0.0 — Major Intelligence Upgrade (2026-04-25)
- Planetary layer, family support, shared engine

## v1.0.0 — Initial Release
