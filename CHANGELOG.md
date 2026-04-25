# Kairos Changelog

## v6.1.0 — Cultural Astro Layer Expansion (2026-04-25)

### Features
- Full zodiac cultural name map (Sanskrit / Tamil) for all 12 signs
- `lagnaLabel()` — formats as "Aries Lagna (Mesha / மேஷம்)"
- `rasiLabel()` — formats as "Gemini Rasi (Mithuna / மிதுனம்)"
- `dashaLabel()` — formats as "Jupiter Dasha (Guru / குரு)" using PLANET_CULTURAL
- `ZODIAC_CULTURAL` map exported from engine for external use
- `buildReasoning()` now returns `lagnaLabel`, `rasiLabel`, `dashaLabel` fields
- Daily summary uses `dashaLabel` as primary cultural anchor (always included)
- Daily summary includes Lagna label when personal reasoning is relevant
- Daily summary includes Rasi label only when dominant dimension is communication or focus
- Ask prompt enforces max 2 cultural terms: Dasha always, Lagna or Rasi based on context type
- Priority rules: Dasha → always; Lagna → decision/career/general; Rasi → communication/relationships

### Improvements
- Cultural terms are never stacked — max 1–2 per message, kept natural
- No logic changes — pure language enhancement on top of v5.1 engine

## v5.1.0 — Action Intelligence Upgrade (2026-04-25)
- Actionable responses, next_best slot, 5-category context, structured prompt

## v5.0.0 — Birth Astro Layer (2026-04-25)
- Lagna and moon sign, 7-layer scoring

## v4.1.0 — Cultural Language Layer (2026-04-25)
- Sanskrit/Tamil planet and nakshatra names

## v3.1.0 — Personal Realism Upgrade (2026-04-25)
- User trait model, 6-layer scoring

## v3.0.0 — Astro Core Upgrade (2026-04-25)
- Lunar phase, nakshatra day archetypes

## v2.1.0 — Trust Layer Upgrade (2026-04-25)
- Explainable messages, spread-based confidence

## v2.0.0 — Major Intelligence Upgrade (2026-04-25)
- Planetary layer, family support, shared engine

## v1.0.0 — Initial Release
