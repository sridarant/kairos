# KAIROS --- VERIFIED TECH DEBT / BACKLOG

## P0 --- Must resolve before UI redesign

1.  Overall stars currently represent confidence rather than
    suitability.
2.  RecommendationAdapter overallStars cap is not wired through
    Bootstrap.
3.  Weekly confidence falls back to 50 because `confidenceScore` is
    absent.
4.  Weekly challenging-day ranking therefore does not represent minimum
    suitability.
5.  Future weekly calculations do not use the user's birth chart.
6.  Planner reconstructs users with blank DOB/time.
7.  Planner Plan Something ignores activity dimensions.
8.  Birthplace/timezone are stripped before API calculation.
9.  Birth chart uses latitude default 20° and longitude 0; no timezone.
10. Current date/time calculation is server-local rather than explicit
    profile/current timezone.
11. Legacy `api/ask.js` can allow Claude-generated decision/timing
    output to diverge from deterministic engine.
12. Duplicate legacy calculation stacks remain.

## P1 --- Architecture

13. Planner bypasses DTO/adapters.
14. Lower-level recommendation module imports utility from `src`.
15. Family "shared" timing uses majority, not intersection.
16. Family harmony model is explicitly simplified.
17. Supabase table/schema documentation is inconsistent.
18. Supabase RLS example is overly permissive.
19. Version numbers disagree across package/version/export/changelog.
20. Multiple colour/token sources exist.

## P1 --- UX

21. Today page has too many sections.
22. Desktop duplicates Tomorrow.
23. Desktop has multiple scroll surfaces.
24. Timeline is visually dense.
25. Too many domain recommendations are presented with equal weight.
26. Star ratings compete with textual tiers.
27. Dark theme increases visual density.
28. Emoji icon system is inconsistent with a minimalist premium
    direction.

## P2 --- Later

29. TypeScript migration.
30. Swiss Ephemeris integration.
31. Week-plan caching.
32. Offline calculation state.
33. Feedback/outcome learning.
34. Pairwise family insights.
