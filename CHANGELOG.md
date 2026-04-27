# Kairos Changelog

## v11.5.0 — Growth + Monetisation Ready (2026-04-25)

### Features
- Invite system: "Invite" button in header opens a bottom sheet with a pre-written shareable message
  Uses Web Share API on mobile (falls back to clipboard copy on desktop)
  Message: "I'm using Kairos for daily decision timing. Join me — let's align our timing."
- Family comparison: MemberCard now shows alignment status vs the primary user's golden window
  - Same window → "✓ Your decision timing aligns today" (green)
  - Different → "Different peak window from yours" (amber)
- Premium placeholders section ("Coming Soon / Pro"):
  - Weekly Analysis, Life Phase Deep Dive, Advanced Insights
  - Shown at half-opacity with "Unlock →" affordance — no real paywall
- WhyItMatters component: dimension-specific insight line below the golden window card
  e.g. "Decisions made in peak windows carry more clarity and follow-through."
- Social proof line in InviteModal and PremiumSection footer
- `InviteModal` — new component (src/components/InviteModal.jsx)
- `inviteOpen` state added to App.jsx; InviteModal wired and rendered

### Improvements
- Header now shows "Invite" button (yellow) alongside profile button
- HomeScreen accepts `onInvite` prop
- Family window comparison makes multi-member households meaningfully differentiated
- Premium section visible to all users — creates aspiration without blocking value

## v10.0.0 — Habit Engine (2026-04-25)
- Daily focus, window trigger, decision timeline, insight card, follow-up prompt

## v8.0.0 — Panchang Integration (2026-04-25)
- 27 Nakshatra, Tithi, Vara — 10-layer scoring engine

## v7.1.0 — Adaptive Intelligence (2026-04-25)
## v7.0.0 — Transit Engine (2026-04-25)
## v6.1.0 — Cultural Astro Layer Expansion (2026-04-25)
## v5.0.0 — Birth Astro Layer (2026-04-25)
## v2.0.0 — Major Intelligence Upgrade (2026-04-25)
## v1.0.0 — Initial Release

## v12.2.0 — UX Clarity + Signal Fix (2026-04-26)

### Fixes
- Mobile modals (Profile, Invite): max-height 90vh, overflow-y auto, inner padding-bottom 80px — buttons never cut off
- ProfileModal DOB field: numeric-only auto-formatting inserts "-" after day and month digits (12031990 → 12-03-1990)
- ProfileModal Birth Time: uses native `<input type="time">` with colorScheme dark — enforces 24h, no AM/PM

### Improvements
- Top section now shows exactly 4 tags: Planet, Phase (Waxing→Light, Waning→Fading, Dark→Dark), Nakshatra, Tithi
- Tags use higher-contrast text (#ccc) with subtle border — readable on dark bg, visually secondary
- Dynamic tag explanation line below tags (e.g. "Mercury sharpens communication, Ashlesha adds its character, Tithi 14 marks a peak phase.")
- Confidence % removed from all views
- Signal Strength replaces it: 🟢 Strong / 🟡 Moderate / 🔴 Weak — shown below DO card, no percentages
- LUNAR_LABEL map: Full→Full, Waxing→Light, Waning→Fading, Dark→Dark (removes "Dark" ambiguity as a chip label)
