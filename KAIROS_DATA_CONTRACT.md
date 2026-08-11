# KAIROS --- DATA CONTRACT BASELINE

## Current profile identity

Stored profile contains:

-   name
-   dob
-   birth_time
-   place_of_birth
-   timezone
-   gender

Family additionally contains: - relationship - notes

## Current API user shape

`IdentityManager.primaryUser/allUsers` currently emit only:

-   name
-   dob
-   birth_time
-   type

This strips: - place_of_birth - timezone - gender

This must be corrected before claiming location-aware personalisation.

## Recommended canonical calculation context

``` text
CalculationContext {
  profileId
  targetDate
  calculationTimezone
  currentLocation
  birthData {
    date
    time
    timeAccuracy
    latitude
    longitude
    timezone
  }
  calculationVersion
}
```

## Recommended canonical daily result

``` text
DailyInsight {
  profileId
  targetDate
  calculationVersion
  generatedAt
  overall {
    suitabilityScore
    suitabilityTier
    confidenceScore
    confidenceTier
  }
  theme
  windows[]
  domains[]
  recommendations[]
  cautions[]
  reasons[]
  exceptions[]
}
```

## Window

``` text
Window {
  start
  end
  suitabilityScore
  tier
  confidence
  reasons[]
}
```

## Domain result

``` text
DomainInsight {
  domain
  suitabilityScore
  tier
  confidence
  bestWindow
  cautionWindow
  reasons[]
}
```

## Family

Do not model "best shared window" as a majority vote.

Prefer:

``` text
FamilyTiming {
  allMembersOverlap
  pairwiseOverlap[]
  partialOverlap[]
  harmonyScore
  confidence
  reasons[]
}
```

## Critical invariants

1.  Overall suitability and confidence are separate.
2.  Planner day ranking uses suitability.
3.  "Most challenging" = minimum suitability.
4.  Domain best windows derive from canonical windows.
5.  Planner activity type changes scoring criteria.
6.  Family group window represents actual overlap.
7.  Same calculation input/version produces same result.
8.  UI does not invent scores.
