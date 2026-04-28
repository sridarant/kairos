// /api/panchang.js
// Attempts to fetch real Panchang data (Tithi, Nakshatra, Moon sign) from a
// free public API. Falls back to deterministic engine values if anything fails.
// Results are cached in-memory for the calendar day to avoid repeated calls.

import { getTithi, getNakshatra, computeMoonSign } from './engine.js'

// ─── In-memory day cache ──────────────────────────────────────────────────────
let _cache = null   // { date: 'YYYY-MM-DD', data: {...} }

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function fallback() {
  const tth = getTithi()
  const nk  = getNakshatra()
  return {
    tithi:      tth.tithi,
    nakshatra:  nk.name,
    moon_sign:  null,
    source:     'deterministic'
  }
}

// ─── Real data fetch ──────────────────────────────────────────────────────────
// Uses the free Vedic Panchang API at vedic-panchang.com (no key required).
// Endpoint: https://www.vedic-panchang.com/api/panchang?date=YYYY-MM-DD
//
// Response shape (simplified):
// {
//   "tithi": { "number": 14, "name": "Chaturdashi" },
//   "nakshatra": { "name": "Pushya" },
//   "moon_sign": "Cancer"
// }
//
// If the API changes, returns incorrect data, or is unreachable, the fallback
// deterministic values are used — the engine stays fully functional.

async function fetchReal() {
  const date = todayKey()
  const url  = `https://www.vedic-panchang.com/api/panchang?date=${date}`

  const res  = await fetch(url, { signal: AbortSignal.timeout(4000) })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  const raw = await res.json()

  const tithiNum  = raw?.tithi?.number   || null
  const nakName   = raw?.nakshatra?.name || null
  const moonSign  = raw?.moon_sign       || null

  if (!tithiNum && !nakName) throw new Error('empty_response')

  return {
    tithi:     tithiNum  ? parseInt(tithiNum, 10) : fallback().tithi,
    nakshatra: nakName   || fallback().nakshatra,
    moon_sign: moonSign  || null,
    source:    'live'
  }
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const today = todayKey()

  // Return cache if valid for today
  if (_cache && _cache.date === today) {
    return res.status(200).json({ ..._cache.data, cached: true })
  }

  let data
  try {
    data = await fetchReal()
  } catch {
    data = fallback()
  }

  // Cache for the rest of the day
  _cache = { date: today, data }

  return res.status(200).json({ ...data, cached: false })
}

// ─── Exported helper for daily.js + ask.js ───────────────────────────────────
// Call this within the same process to reuse the in-memory cache without an
// additional HTTP round-trip.
export async function getPanchangData() {
  const today = todayKey()
  if (_cache && _cache.date === today) return _cache.data
  try {
    const data = await fetchReal()
    _cache = { date: today, data }
    return data
  } catch {
    const data = fallback()
    _cache = { date: today, data }
    return data
  }
}
