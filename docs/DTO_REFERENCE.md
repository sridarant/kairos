# DTO Reference

All DTOs are camelCase. Adapters in `lib/adapters/` perform the sole snake_case → camelCase conversion.

---

## RecommendationPackage

```typescript
{
  id:             string             // "rec_career_2026-08-08"
  category:       string             // "career", "finance", "relationships", ...
  icon:           string             // emoji
  title:          string             // display name
  recommendation: string             // the actual advice sentence
  summary:        string             // shorter version of recommendation
  reasoning:      string | null      // why now (from evidence graph)
  bestWindow:     string | null      // "HH:MM–HH:MM"
  avoidWindow:    string | null      // "HH:MM–HH:MM"
  confidence:     "High"|"Medium"|"Low"
  stars:          1–5                // capped by overall day stars + 1
  quality:        "supportive"|"neutral"|"caution"|"mixed"
  priority:       number
  feedbackStatus: "pending"|"helpful"|"not_helpful"|"skipped"
}
```

---

## DailyBriefDTO

```typescript
{
  theme:          string
  outlook:        "Positive"|"Balanced"|"Challenging"
  bestWindow:     string | null
  avoidWindow:    string | null
  confidence:     "High"|"Medium"|"Low"
  stars:          1–5
  summary:        string
  opportunities:  OpportunityDTO[]
  cautions:       CautionDTO[]
  familyBrief:    FamilyBriefDTO | null
  tomorrowPreview:TomorrowPreviewDTO | null
}
```

---

## TimelineEntryDTO

```typescript
{
  startTime:   "HH:MM"
  endTime:     "HH:MM" | null
  quality:     "Excellent"|"Good"|"Moderate"|"Low energy"
  label:       string
  description: string
  confidence:  "High"|"Medium"|"Low"
  score:       number
}
```

---

## WeeklyPlanDTO

```typescript
{
  categories:  WeeklyCategoryDTO[]   // best day per life area
  days:        WeekDayDTO[]          // all 7 days with stars
  topDay:      WeekDayDTO | null
  challenging: WeekDayDTO | null
}
```

---

## MemberDTO

```typescript
{
  name:          string
  decision:      "DO"|"WAIT"|"AVOID"
  confidence:    "High"|"Medium"|"Low"
  stars:         1–5
  focus:         string | null
  goldenWindow:  string | null        // camelCase (normalised from API snake_case)
  avoidWindow:   string | null        // camelCase (normalised from API snake_case)
  summary:       string | null
  recommendations: { top: RawRec[], rest: RawRec[] }
  timeline:      RawTimelineEntry[]
  dasha:         object | null
  yoga:          object | null
}
```

---

## KairosIdentity (localStorage schema v1)

```typescript
{
  _schemaVersion: 1
  _createdAt:     ISO string
  _updatedAt:     ISO string
  uid:            string              // "k_..." stable anonymous ID
  profile: {
    name:           string
    dob:            "DD-MM-YYYY"
    birth_time:     "HH:MM"
    place_of_birth: string
    timezone:       string            // IANA
    gender:         string | null
  }
  family:   FamilyMember[]
  prefs:    { theme, notifications, language }
  appState: {
    onboardingComplete: boolean
    feedbackHistory:    FeedbackEntry[]
    usageStats:         { sessions, lastOpen }
  }
}
```
