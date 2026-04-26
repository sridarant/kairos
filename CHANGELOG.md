# Kairos Changelog

## v10.0.0 — Habit Engine (2026-04-25)

### Features
- Today's Focus indicator: derives dominant dimension (communication/decision/focus/risk) from daily member reasoning and displays "Conversations / Decisions / Deep Work / Caution"
- Window Trigger: "Your next best window starts in Xh Ym" — computed from current time vs golden_window; updates every 60 seconds; disappears once window starts
- Decision Timeline: last 5 Ask interactions shown as a timeline with question, decision type, and outcome icon (✅/❌)
- Insight Card: pattern-derived insight shown after 3+ rated entries:
  - Early vs late performance analysis
  - Do vs wait success patterns
  - Overall accuracy signal
- Follow-up prompt in AskModal: "Check back after taking this action" shown after every result
- Tithi and Nakshatra badges added to HomeScreen astro pills
- `computeInsight(history)` — pattern analysis of rated history entries
- `minsUntilWindow(windowStr)` — parses "HH:MM–HH:MM" and returns minutes until start

### Improvements
- HomeScreen now reads history from localStorage on mount (no prop threading)
- Dominant dimension sourced from `_reasoning.dominant` in daily response
- Insight and timeline are invisible until there is enough history — no empty states shown
- WindowTrigger interval clears on unmount — no memory leaks

## v8.0.0 — Panchang Integration (2026-04-25)
- 27 Nakshatra, Tithi, Vara — 10-layer scoring engine

## v7.1.0 — Adaptive Intelligence (2026-04-25)
- localStorage feedback loop

## v7.0.0 — Transit Engine (2026-04-25)
## v6.1.0 — Cultural Astro Layer Expansion (2026-04-25)
## v5.1.0 — Action Intelligence Upgrade (2026-04-25)
## v5.0.0 — Birth Astro Layer (2026-04-25)
## v4.1.0 — Cultural Language Layer (2026-04-25)
## v3.1.0 — Personal Realism Upgrade (2026-04-25)
## v3.0.0 — Astro Core Upgrade (2026-04-25)
## v2.1.0 — Trust Layer Upgrade (2026-04-25)
## v2.0.0 — Major Intelligence Upgrade (2026-04-25)
## v1.0.0 — Initial Release
