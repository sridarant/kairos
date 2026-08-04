# Kairos Architecture v21.5

## Four-Layer Design

```
User Input / Date
       ↓
┌──────────────────────────────────────────────────────┐
│  Layer 1: Astronomical Engine                        │
│  lib/astronomy/                                      │
│  - ephemeris.js  — Lahiri sidereal positions         │
│  - houses.js     — Equal house system                │
│  - index.js      — getDailyAstronomy(), getBirthChart()│
│                                                      │
│  PURE FUNCTIONS. No interpretations.                 │
│  Output: GrahaPositions, Panchang, Lagna, Houses     │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│  Layer 2: Astrological Analysis Engine               │
│  lib/astrology/                                      │
│  - strength.js   — Dignity, combustion, retrograde   │
│  - yogas.js      — 20+ classical yoga detection      │
│  - dasha.js      — Vimshottari Dasha calculation     │
│  - scoring.js    — Tithi/Nakshatra/Planet deltas     │
│  - index.js      — buildAstroContext()               │
│                                                      │
│  INTERPRETATION ONLY. Receives Layer 1 output.       │
│  Output: AstroContext (strengths, yogas, dasha, fx)  │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│  Layer 3: Decision Engine                            │
│  lib/decision/                                       │
│  - engine.js     — buildDecisionObject()             │
│  - confidence.js — 3-tier model (High/Medium/Low)    │
│  - timing.js     — Non-uniform timeline              │
│  - recommendations.js — Ranked category scores       │
│  - explanation.js — Structured signal prose          │
│                                                      │
│  DECISIONS ONLY. No LLM. No natural language.        │
│  Output: DecisionObject (DO/WAIT/AVOID, scores, etc) │
└───────────────────────┬──────────────────────────────┘
                        ↓
┌──────────────────────────────────────────────────────┐
│  Layer 4: Language Layer                             │
│  api/explain.js                                      │
│  - Receives: user question + DecisionObject          │
│  - Claude ONLY converts structured data to prose     │
│  - Claude NEVER determines timing, decision, scores  │
│  - Falls back gracefully if Claude unavailable       │
│                                                      │
│  LANGUAGE ONLY. Decision comes pre-made.             │
└──────────────────────────────────────────────────────┘
```

## Data Flow

```
User opens app
  → /api/daily (POST)
    → getDailyAstronomy(date)      [Layer 1]
    → getBirthChart(dob, time)     [Layer 1]
    → buildAstroContext(...)       [Layer 2]
    → buildDecisionObject(...)     [Layer 3]
    → JSON response to UI

User asks a question
  → UI calls /api/explain (POST)
    → Receives { question, decisionObject }
    → Validates decisionObject schema
    → Calls Claude with structured prompt
    → Claude writes prose (Layer 4)
    → Returns { explanation }
    → Falls back to deterministic text if Claude unavailable
```

## Key Principles

1. **Astronomical facts are immutable** — positions don't change based on interpretation
2. **Interpretations are isolated** — yoga detection never touches house math
3. **Decisions are deterministic** — same inputs always produce same DO/WAIT/AVOID
4. **Language is the only LLM responsibility** — Claude never decides
5. **Fallbacks at every layer** — the app works without Claude, Supabase, or birth data

## Extension Points

- **Navamsa**: add `computeNavamsa()` to `lib/astronomy/ephemeris.js`
- **Shadbala**: add to `lib/astrology/strength.js` (new export, same interface)
- **Ashtakavarga**: new module `lib/astrology/ashtakavarga.js`
- **Push notifications**: consume DecisionObject from a background worker
- **Adaptive learning**: Layer 3 can accept feedback weights without touching Layer 1 or 2
