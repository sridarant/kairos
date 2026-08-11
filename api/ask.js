/**
 * /api/ask.js — DEPRECATED (Sprint 3)
 *
 * This endpoint is deprecated and disabled.
 *
 * REASON FOR DEPRECATION:
 *   This endpoint violated the Kairos Architecture (Constitution §13):
 *   - It used a parallel decision engine (api/astro.js / lib/astro/*) separate
 *     from the canonical lib/decision/engine.js path.
 *   - It sent decision/timing/confidence to Claude and accepted back
 *     JSON fields including `decision`, `best_time`, and `avoid_time`.
 *     This allowed Claude output to override deterministic engine results.
 *   - `best_time` was hardcoded as a day-of-week lookup (TIMES[]), not calculated.
 *   - `avoid_time` was hardcoded to '17:00–19:00' regardless of astrological context.
 *
 * REPLACEMENT:
 *   Use POST /api/daily for all decision/timing calculations.
 *   Use POST /api/explain for Claude-powered natural-language summaries.
 *   Claude must never determine DO/WAIT/AVOID, suitability, confidence or timing.
 *
 * CLASSIFICATION: LEGACY — no production React caller found.
 */
export default function handler(req, res) {
  return res.status(410).json({
    error:   'This endpoint is deprecated and has been disabled.',
    code:    'DEPRECATED',
    message: 'Use POST /api/daily for decisions and POST /api/explain for explanations.',
    since:   '30.7.2'
  })
}
