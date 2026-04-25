# Kairos Changelog

## v4.1.0 — Cultural Language Layer (2026-04-25)

### Features
- Sanskrit and Tamil names for all 7 planets:
  Sun → Surya / சூரியன், Moon → Chandra / சந்திரன்,
  Mars → Kuja / செவ்வாய், Mercury → Budha / புதன்,
  Jupiter → Guru / குரு, Venus → Shukra / சுக்கிரன், Saturn → Shani / சனி
- Nakshatra cycle (9 nakshatras, date % 9):
  Ashwini, Bharani, Krittika, Rohini, Mrigashira, Ardra, Punarvasu, Pushya, Ashlesha
  Each with Tamil/Sanskrit dual name and a short archetype label
- `getNakshatra()` — deterministic daily nakshatra
- `planetLabel()` — returns "Planet (Sanskrit / Tamil)" format
- `buildReasoning()` now includes `planetLabel`, `nakshatraName`, `nakshatraCultural`, `nakshatraLabel`
- Daily summary includes cultural planet label + nakshatra in one readable line
- Ask prompt instructs Claude to use the cultural planet label and optionally the nakshatra name

### Improvements
- More authentic astrological feel without overloading the message
- Nakshatra and planet names appear once, naturally, in explanation text only
- No logic changes — pure language enhancement layer

## v3.1.0 — Personal Realism Upgrade (2026-04-25)
- User trait model: decision_bias, risk_tolerance, communication_style, focus_strength
- 6-layer scoring engine

## v3.0.0 — Astro Core Upgrade (2026-04-25)
- Lunar phase layer, nakshatra-style day archetypes, 5-layer scoring

## v2.1.0 — Trust Layer Upgrade (2026-04-25)
- Explainable messages, spread-based confidence, shared reasoning builder

## v2.0.0 — Major Intelligence Upgrade (2026-04-25)
- Planetary layer, user personalization, family support, shared engine

## v1.0.0 — Initial Release
