# Component Library Reference

All components exported from `src/design-system/components/index.jsx`.
Import via `src/components/common/index.jsx` in screens.

## Star Rating
```jsx
<StarRating value={4} max={5} size={16} ariaLabel="4 out of 5 stars" />
```

## Confidence
```jsx
<ConfidenceBadge level="High" />              // "High" in green
<ConfidenceBadge level="Medium" showDots />   // dots + label
<ConfidenceDots level="Low" size={8} />       // ●○○○○
```

## Badges
```jsx
<CategoryBadge category="career" icon="💼" label="Career" />
<StatusBadge label="Positive" color={Status.Success} />
<TimeBadge time="09:00–11:00" />
<PriorityBadge stars={4} />
```

## Buttons
```jsx
<PrimaryButton onClick={fn}>Save</PrimaryButton>
<SecondaryButton onClick={fn}>Cancel</SecondaryButton>
<GhostButton onClick={fn} small>Share</GhostButton>
<IconButton icon="✕" onClick={fn} ariaLabel="Close" />
<DangerButton onClick={fn}>Delete</DangerButton>
<OutlineButton onClick={fn}>Learn More</OutlineButton>
<TabButton label="Week" active={true} onClick={fn} />
```

## Cards
```jsx
<StandardCard ariaLabel="Career recommendation">…</StandardCard>
<HeroCard>…</HeroCard>           // Elevated, larger radius
<CompactCard onClick={fn}>…</CompactCard>
<AlertCard level="danger">…</AlertCard>
<SuccessCard>…</SuccessCard>
<TimelineCard time="09:00" endTime="11:00" quality="Excellent" label="Planning" description="…" confidence="High" />
<FamilyCard energy="High" bestWindow="18:00–20:00" activity="Dinner" caution="Avoid arguments" />
```

## Typography
```jsx
<SectionTitle>Today's Timeline</SectionTitle>
<SectionHeader title="Family Today" actionLabel="Plan Together" onAction={fn} />
<FieldLabel text="Best Window" />
<BodyText muted>Secondary content</BodyText>
<Caption>Small metadata text</Caption>
```

## States
```jsx
<LoadingState label="Preparing your brief…" />
<EmptyState icon="📋" title="No data" body="…" action="Retry" onAction={fn} />
<ErrorState onRetry={fn} />
<SkeletonCard lines={3} />
<SkeletonHero />
```

## Layout
```jsx
<Divider />
<TwoColGrid gap={8}>…</TwoColGrid>
<ThreeColGrid>…</ThreeColGrid>
```
