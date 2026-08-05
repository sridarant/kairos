/**
 * src/components/common/index.jsx
 * Thin re-export bridge: all DS components + any legacy aliases needed.
 * Components import from here; the DS itself lives in design-system/.
 */
export {
  StarRating, Stars,
  ConfidenceDots, ConfidenceBadge,
  CategoryBadge, StatusBadge, TimeBadge, PriorityBadge,
  PrimaryButton, SecondaryButton, GhostButton, GhostBtn, IconButton, DangerButton, OutlineButton, TabButton,
  StandardCard, HeroCard, CompactCard, AlertCard, SuccessCard, TimelineCard, FamilyCard, Card,
  SectionHeader, SectionTitle,
  DisplayText, Heading1, Heading2, BodyText, Caption, FieldLabel, Label,
  LoadingState, EmptyState, ErrorState, SkeletonCard, SkeletonHero,
  Divider, TwoColGrid, ThreeColGrid
} from '../../design-system/components/index.jsx'
