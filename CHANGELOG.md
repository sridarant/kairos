# Kairos Changelog

## v3.0.0 — Astro Core Upgrade (2026-04-25)

### Features
- Lunar phase influence: Waxing / Full / Waning / Dark — each shifts decision, focus, and risk scores
- Nakshatra-style day archetypes: Initiate / Build / Communicate / Reflect / Restrict
- Full 5-layer scoring engine: base → planet → lunar → day type → user personalisation
- `lunar_phase` and `day_type` returned in both API responses
- Daily summary references all three astro layers in a single generated sentence

### Improvements
- `dominantDimension()` now combines planet + lunar influence for accuracy
- Claude prompt selects the single most relevant astro layer per question — avoids information overload
- Scoring deterministic: same user + same day + same question = same output

## v2.1.0 — Trust Layer Upgrade (2026-04-25)

### Improvements
- Explainable decision reasoning: messages state *why* a decision was made
- Confidence rebuilt on best-vs-worst slot spread (strong ≥80, moderate 60–75, weak <60)
- `buildReasoning()` shared helper ensures daily and ask outputs are consistent
- Daily summary is a generated sentence, not a static string

## v2.0.0 — Major Intelligence Upgrade (2026-04-25)

### Features
- Planetary influence layer (7 planets mapped to weekday)
- User personalization via DOB seed and profile type
- Family support with per-member daily results
- Unified scoring engine shared across both API routes

## v1.0.0 — Initial Release

- Daily guidance with golden window
- Ask Kairos decision support
- PWA, profiles, family member management
