/**
 * src/design-system/components/index.jsx
 *
 * ALL reusable UI primitives for Kairos.
 * No screen may introduce a visual pattern not defined here.
 * Future workstreams extend this file; they do not create new pattern files.
 *
 * Every export here is considered "frozen" after v29.0.
 */

import { useState } from 'react'
import {
  Surface, Text, Status, Confidence, Quality, Radius, Space, Pad, Gap,
  Shadow, FontSize, FontWeight, LetterSpacing, TextStyle, Opacity, IconSize,
  Duration, Easing, MotionCSS, Z, Accent
} from '../tokens/index.js'
// Note: colors re-exported individually for ergonomics below

// ─── WORKSTREAM 10: Star Rating ───────────────────────────────────────────────

/**
 * StarRating — canonical star display. ONE implementation across the whole app.
 */
export function StarRating({ value = 3, max = 5, size = IconSize.sm, ariaLabel }) {
  const count = Math.max(1, Math.min(max, Math.round(value)))
  return (
    <span aria-label={ariaLabel || `${count} out of ${max} stars`}
      style={{ fontSize: size, letterSpacing: 2, lineHeight: 1 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ opacity: i < count ? Opacity.full : Opacity.muted }}>★</span>
      ))}
    </span>
  )
}

// ─── WORKSTREAM 9: Confidence System ─────────────────────────────────────────

/**
 * ConfidenceDots — dot-based confidence indicator (●●●●○)
 */
export function ConfidenceDots({ level, size = 8 }) {
  const map = { High: 5, Medium: 3, Low: 1 }
  const filled = map[level] ?? 3
  const color  = Confidence[level] || Accent
  return (
    <span aria-label={`Confidence: ${level}`} style={{ display:'inline-flex', gap:2, alignItems:'center' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{
          width: size, height: size, borderRadius: '50%', display: 'inline-block',
          background: i < filled ? color : Surface.Line
        }} />
      ))}
    </span>
  )
}

/**
 * ConfidenceBadge — text confidence label in semantic colour
 */
export function ConfidenceBadge({ level, size = FontSize.Confidence, showDots = false }) {
  const color = Confidence[level] || Accent
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap: Space.xs }}>
      {showDots && <ConfidenceDots level={level} size={7} />}
      <span style={{ fontSize: size, color, fontWeight: FontWeight.Bold }}>{level || 'Medium'}</span>
    </span>
  )
}

// ─── WORKSTREAM 7: Badges ─────────────────────────────────────────────────────

export function CategoryBadge({ category, icon, label }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap: Space.xs,
      background: Surface.Line, borderRadius: Radius.pill,
      padding: `3px 9px`, fontSize: FontSize.Badge, color: Text.Secondary }}>
      {icon && <span style={{ fontSize: IconSize.xs }}>{icon}</span>}
      {label || category}
    </span>
  )
}

export function StatusBadge({ label, color, bg }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      background: bg || Surface.Line, borderRadius: Radius.pill,
      padding: '3px 10px', fontSize: FontSize.Badge,
      color: color || Text.Primary, fontWeight: FontWeight.Medium
    }}>{label}</span>
  )
}

export function TimeBadge({ time }) {
  if (!time) return null
  return (
    <span style={{ fontSize: FontSize.Badge, color: Accent, fontWeight: FontWeight.Bold }}>
      ⏰ {time}
    </span>
  )
}

export function PriorityBadge({ stars }) {
  return <StarRating value={stars} size={IconSize.xs} />
}

// ─── WORKSTREAM 6: Button System ──────────────────────────────────────────────

const btnBase = {
  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  gap: Space.xs, transition: `transform ${Duration.fast} ${Easing.easeOut}`,
  minHeight: 44,
}

export function PrimaryButton({ children, onClick, disabled, loading, fullWidth, ariaLabel }) {
  return (
    <button onClick={onClick} disabled={disabled || loading} aria-label={ariaLabel}
      className={MotionCSS.scaleTap}
      style={{ ...btnBase, background: Accent, color: '#000',
        fontSize: FontSize.Body, fontWeight: FontWeight.Bold,
        borderRadius: Radius.button, padding: `10px ${Space['2xl']}px`,
        opacity: disabled ? Opacity.dim : Opacity.full,
        width: fullWidth ? '100%' : undefined }}>
      {loading ? <span className="spinner" style={{ width:16, height:16 }} /> : children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, disabled, ariaLabel }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel}
      className={MotionCSS.scaleTap}
      style={{ ...btnBase, background: Surface.Card, color: Text.Primary,
        fontSize: FontSize.Body, fontWeight: FontWeight.Medium,
        borderRadius: Radius.button, padding: `10px ${Space.xl}px`,
        opacity: disabled ? Opacity.dim : Opacity.full }}>
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, small, ariaLabel, disabled }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={ariaLabel || (typeof children === 'string' ? children : undefined)}
      className={MotionCSS.scaleTap}
      style={{ ...btnBase,
        background: 'none', border: `1px solid ${Surface.Line}`,
        borderRadius: Radius.pill, color: Accent,
        fontSize: small ? FontSize.Caption : FontSize.BodySmall,
        fontWeight: FontWeight.Medium,
        padding: small ? `3px 10px` : `5px 12px`,
        minHeight: small ? 28 : 32,
        opacity: disabled ? Opacity.dim : Opacity.full }}>
      {children}
    </button>
  )
}

export function IconButton({ icon, onClick, ariaLabel, size = IconSize.md }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel}
      className={MotionCSS.scaleTap}
      style={{ ...btnBase, background: 'none', border: 'none',
        padding: Space.xs, fontSize: size, minHeight: 32, minWidth: 32 }}>
      {icon}
    </button>
  )
}

export function DangerButton({ children, onClick, ariaLabel }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel}
      className={MotionCSS.scaleTap}
      style={{ ...btnBase, background: Status.DangerBg, color: Status.Danger,
        border: `1px solid ${Status.Danger}`,
        fontSize: FontSize.Body, fontWeight: FontWeight.Medium,
        borderRadius: Radius.button, padding: `10px ${Space.xl}px` }}>
      {children}
    </button>
  )
}

export function OutlineButton({ children, onClick, ariaLabel, color }) {
  return (
    <button onClick={onClick} aria-label={ariaLabel}
      className={MotionCSS.scaleTap}
      style={{ ...btnBase,
        background: 'none', border: `1px solid ${color || Surface.Line}`,
        borderRadius: Radius.button, color: color || Text.Primary,
        fontSize: FontSize.Body, fontWeight: FontWeight.Medium,
        padding: `10px ${Space.xl}px` }}>
      {children}
    </button>
  )
}

export function TabButton({ label, active, onClick }) {
  return (
    <button onClick={onClick}
      style={{ ...btnBase,
        background: active ? Accent : Surface.Card,
        color: active ? '#000' : Text.Secondary,
        border: 'none', borderRadius: Radius.md,
        padding: `9px 4px`, fontSize: FontSize.Caption,
        fontWeight: FontWeight.Medium, minHeight: 36,
        flex: 1 }}>
      {label}
    </button>
  )
}

// ─── WORKSTREAM 5: Card System ────────────────────────────────────────────────

function CardShell({ children, style, onClick, ariaLabel, elevated }) {
  return (
    <div onClick={onClick} aria-label={ariaLabel}
      style={{ background: elevated ? Surface.CardElevated : Surface.Card,
        borderRadius: Radius.card, padding: Pad.card, marginBottom: Gap.card,
        cursor: onClick ? 'pointer' : undefined,
        boxShadow: elevated ? Shadow.raised : Shadow.card,
        ...style }}>
      {children}
    </div>
  )
}

export function StandardCard({ children, style, onClick, ariaLabel }) {
  return <CardShell style={style} onClick={onClick} ariaLabel={ariaLabel}>{children}</CardShell>
}

export function HeroCard({ children, style }) {
  return (
    <CardShell elevated style={{ borderRadius: Radius['2xl'], padding: Pad.cardLg, ...style }}>
      {children}
    </CardShell>
  )
}

export function CompactCard({ children, style, onClick }) {
  return (
    <CardShell style={{ padding: Pad.cardSm, ...style }} onClick={onClick}>
      {children}
    </CardShell>
  )
}

export function AlertCard({ children, level = 'warning' }) {
  const bg    = level === 'danger' ? 'rgba(248,113,113,0.08)' : 'rgba(251,191,36,0.08)'
  const color = level === 'danger' ? Status.Danger : Status.Warning
  return (
    <div style={{ background: bg, borderRadius: Radius.xl,
      padding: Pad.cardSm, marginBottom: Gap.card,
      borderLeft: `3px solid ${color}` }}>
      {children}
    </div>
  )
}

export function SuccessCard({ children }) {
  return (
    <div style={{ background: 'rgba(74,222,128,0.08)', borderRadius: Radius.xl,
      padding: Pad.cardSm, marginBottom: Gap.card,
      borderLeft: `3px solid ${Status.Success}` }}>
      {children}
    </div>
  )
}

export function TimelineCard({ time, endTime, quality, label, description, confidence }) {
  const dotColor = Quality[quality] || Surface.Line
  return (
    <div style={{ position:'relative', marginBottom: Space.md }}>
      <div style={{ position:'absolute', left:-13, top:4, width:8, height:8,
        borderRadius:'50%', background:dotColor, border:'2px solid #000' }} />
      <div style={{ display:'flex', alignItems:'baseline', gap:Space.sm, marginBottom:2 }}>
        <span style={{ ...TextStyle.Time, color:dotColor }}>
          {time}{endTime ? `–${endTime}` : ''}
        </span>
        {label && <span style={{ fontSize:FontSize.Caption, color:Text.Secondary, fontWeight:FontWeight.Medium }}>{label}</span>}
        {confidence && <ConfidenceBadge level={confidence} size={FontSize.Badge} />}
      </div>
      {description && <p style={{ ...TextStyle.BodySmall, color:Text.Secondary, lineHeight:1.45 }}>{description}</p>}
    </div>
  )
}

export function FamilyCard({ energy, bestWindow, activity, caution }) {
  return (
    <StandardCard>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:Space.sm }}>
        {energy    && <MetaRow label="Family Energy" value={energy} valueColor={energy === 'High' ? Status.Success : Accent} />}
        {bestWindow && <MetaRow label="Best Together" value={bestWindow} valueColor={Accent} />}
        {activity  && <MetaRow label="Suggested" value={activity} />}
        {caution   && <MetaRow label="Be Mindful" value={caution} valueColor={Status.Danger} labelColor={Status.Danger} />}
      </div>
    </StandardCard>
  )
}

// Shared meta row used inside cards
function MetaRow({ label, value, valueColor, labelColor }) {
  return (
    <div>
      <FieldLabel text={label} color={labelColor} />
      <p style={{ fontSize:FontSize.CardTitle, fontWeight:FontWeight.Bold, color:valueColor || Text.Primary }}>{value}</p>
    </div>
  )
}

// ─── WORKSTREAM 11: Section Headers ──────────────────────────────────────────

export function SectionHeader({ title, action, actionLabel, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:Space.sm }}>
      <SectionTitle>{title}</SectionTitle>
      {onAction && <GhostButton onClick={onAction} small>{actionLabel || action}</GhostButton>}
    </div>
  )
}

export function SectionTitle({ children }) {
  return (
    <p style={{ ...TextStyle.SectionTitle, color:Text.Secondary, marginBottom:Space.sm }}>
      {children}
    </p>
  )
}

// ─── WORKSTREAM 3: Typography atoms ──────────────────────────────────────────

export function DisplayText({ children, style }) {
  return <p style={{ ...TextStyle.Display, color:Text.Primary, ...style }}>{children}</p>
}

export function Heading1({ children }) {
  return <h1 style={{ ...TextStyle.Heading1, color:Text.Primary }}>{children}</h1>
}

export function Heading2({ children }) {
  return <h2 style={{ ...TextStyle.Heading2, color:Text.Primary }}>{children}</h2>
}

export function BodyText({ children, muted, style }) {
  return <p style={{ ...TextStyle.Body, color:muted ? Text.Secondary : Text.Primary, lineHeight:1.5, ...style }}>{children}</p>
}

export function Caption({ children, style }) {
  return <p style={{ ...TextStyle.Caption, color:Text.Secondary, ...style }}>{children}</p>
}

export function FieldLabel({ text, color }) {
  return (
    <p style={{ ...TextStyle.Label, color:color || Text.Secondary, marginBottom:Space.xs }}>
      {text}
    </p>
  )
}

// ─── WORKSTREAM 12: Empty / Loading / Error States ────────────────────────────

export function LoadingState({ label = 'Loading…' }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:Space.sm,
      padding:`${Space.md}px ${Space.lg}px`, background:Surface.Card,
      borderRadius:Radius.card, marginBottom:Gap.card }}>
      <span className="spinner" style={{ width:14, height:14, flexShrink:0 }} />
      <Caption>{label}</Caption>
    </div>
  )
}

export function EmptyState({ icon = '—', title, body, action, onAction }) {
  return (
    <div style={{ textAlign:'center', padding:`${Space['3xl']}px ${Space.xl}px`,
      background:Surface.Card, borderRadius:Radius.card, marginBottom:Gap.card }}>
      {icon && <p style={{ fontSize:32, marginBottom:Space.sm }}>{icon}</p>}
      {title && <p style={{ ...TextStyle.CardTitle, marginBottom:Space.xs }}>{title}</p>}
      {body  && <Caption style={{ marginBottom: action ? Space.md : 0 }}>{body}</Caption>}
      {action && onAction && <PrimaryButton onClick={onAction}>{action}</PrimaryButton>}
    </div>
  )
}

export function ErrorState({ onRetry }) {
  return (
    <div style={{ textAlign:'center', padding:`${Space['3xl']}px ${Space.xl}px`,
      background:Surface.Card, borderRadius:Radius.card, marginBottom:Gap.card }}>
      <p style={{ fontSize:32, marginBottom:Space.sm }}>⚠️</p>
      <p style={{ ...TextStyle.CardTitle, marginBottom:Space.xs }}>Something went wrong</p>
      <Caption style={{ marginBottom:Space.md }}>Please try again.</Caption>
      {onRetry && <SecondaryButton onClick={onRetry}>Retry</SecondaryButton>}
    </div>
  )
}

export function SkeletonCard({ lines = 2, height = 80 }) {
  return (
    <div style={{ background:Surface.Card, borderRadius:Radius.card,
      padding:Pad.card, marginBottom:Gap.card }}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} style={{ background:Surface.Line, borderRadius:Radius.sm,
          height: i === 0 ? 14 : 10,
          width: i === 0 ? '60%' : '80%',
          marginBottom: i < lines - 1 ? Space.sm : 0,
          opacity: Opacity.dim }} />
      ))}
    </div>
  )
}

export function SkeletonHero() {
  return (
    <div style={{ background:Surface.Card, borderRadius:Radius['2xl'],
      padding:Pad.cardLg, marginBottom:Gap.card }}>
      {[80,12,10,10].map((h, i) => (
        <div key={i} style={{ background:Surface.Line, borderRadius:Radius.sm,
          height:h, marginBottom:Space.sm, opacity:Opacity.dim,
          width: i === 0 ? '40%' : ['70%','90%','50%'][i-1] }} />
      ))}
    </div>
  )
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

export function Divider() {
  return <div style={{ height:1, background:Surface.Line, margin:`${Space.md}px 0` }} />
}

export function TwoColGrid({ children, gap = Gap.grid }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap }}>{children}</div>
}

export function ThreeColGrid({ children, gap = Gap.grid }) {
  return <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap }}>{children}</div>
}

// Re-export legacy aliases so existing code doesn't break
export const Stars = StarRating
export { GhostButton as GhostBtn }
export const Label = FieldLabel
export const Card  = StandardCard
