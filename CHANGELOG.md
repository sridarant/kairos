# Kairos Changelog

## v5.0.0 — Birth Astro Layer (2026-04-25)

### Features
- Lagna (ascendant) computation from birth_time:
  `lagnaIndex = floor(hour / 2) % 12` → zodiac sign → full scoring impact
- Personal moon sign from DOB: `dob_day % 12` → zodiac sign → moderate scoring impact
- 12-sign zodiac scoring table: each sign maps to decision/communication/risk/focus deltas
- Lagna applied at full weight (1.0×); moon sign at half weight (0.5×, rounded)
- `computeLagna(birth_time)` and `computeMoonSign(dob)` exported from engine
- ProfileModal now includes "Birth Time" input for Lagna computation
- Daily summary includes "Lagna in X, Moon in Y shapes your personal alignment today"
- Ask response includes `lagna` and `moon_sign` fields
- Ask prompt instructs Claude to reference lagna/moon sign nature naturally once
- `dominantDimension()` now incorporates lagna and moon sign into combined signal
- `scoredSlots()` is now a 7-layer function: base → planet → lunar → day type → traits → lagna → moon sign

### Improvements
- Family members with different birth times will have different Lagna and thus different golden windows
- Users without birth_time gracefully skip the lagna layer (no null errors)
- Users without DOB skip the moon sign layer with the same graceful fallback

## v4.1.0 — Cultural Language Layer (2026-04-25)
- Sanskrit and Tamil names for planets and nakshatras

## v3.1.0 — Personal Realism Upgrade (2026-04-25)
- User trait model: 6-layer scoring

## v3.0.0 — Astro Core Upgrade (2026-04-25)
- Lunar phase, nakshatra day archetypes, 5-layer scoring

## v2.1.0 — Trust Layer Upgrade (2026-04-25)
- Explainable messages, spread-based confidence

## v2.0.0 — Major Intelligence Upgrade (2026-04-25)
- Planetary layer, family support, shared engine

## v1.0.0 — Initial Release
