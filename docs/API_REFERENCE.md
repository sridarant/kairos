# API Reference

## POST /api/daily

**Purpose:** Generate personalised daily guidance for one or more users.

**Request:**
```json
{
  "users": [
    {
      "name":       "string (required)",
      "dob":        "DD-MM-YYYY",
      "birth_time": "HH:MM (24-hour)",
      "place_of_birth": "City, Country",
      "timezone":   "IANA timezone string",
      "type":       "primary | family"
    }
  ],
  "daysAhead": 0
}
```

**Response:**
```json
{
  "golden_window":      "HH:MM–HH:MM | null",
  "avoid_window":       "HH:MM–HH:MM | null",
  "confidence_summary": "High | Medium | Low",
  "focus":              "string",
  "stars":              "1–5",
  "planet":             "string | null",
  "nakshatra":          "string | null",
  "tithi":              "number | null",
  "members": [
    {
      "name":           "string",
      "decision":       "DO | WAIT | AVOID",
      "confidence":     "High | Medium | Low",
      "stars":          "1–5",
      "focus":          "string",
      "golden_window":  "HH:MM–HH:MM | null",
      "avoid_window":   "HH:MM–HH:MM | null",
      "summary":        "string",
      "recommendations": { "top": [], "rest": [] },
      "timeline":       [],
      "dasha":          "object | null",
      "yoga":           "object | null"
    }
  ],
  "family_alignment": { ... } | null,
  "week_plan": [
    {
      "label":      "string",
      "date":       "YYYY-MM-DD",
      "days_ahead": "number",
      "stars":      "1–5",
      "confidence": "number (0–100)",
      "summary":    "string"
    }
  ]
}
```

**Errors:**
```json
{ "error": "string", "code": "METHOD_NOT_ALLOWED | INVALID_REQUEST | ENGINE_ERROR" }
```

**Status codes:** 200 success, 400 invalid input, 405 wrong method, 500 engine error.

**Security:** User names capped at 50 chars. `daysAhead` validated 0–365. Raw engine objects never returned.

---

## GET /api/data?userId=\<id\>

Fetches stored user data (feedback history, usage stats).

**Response:** `{ history: [], feedback: [], usage_stats: {}, user_profile: [] }`

---

## POST /api/data

Writes user data. Actions: `save_profile | add_history | track_feedback | track_open`.

**Request:**
```json
{
  "userId": "string",
  "action": "save_profile | add_history | track_feedback | track_open",
  "user_profile": [],
  "entry": {}
}
```

**Note:** User identity is stored locally via `IdentityManager`. The `/api/data` route provides optional server-side persistence when Supabase is configured.
