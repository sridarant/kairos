/**
 * InsightsModal v30.4 — Journal & Feedback Loop.
 *
 * WS9: Meaningful empty state — no fabricated data.
 * WS10: Outcome capture — Worked well / Neutral / Didn't work.
 * WS11: Journal entries stored in identity.appState.feedbackHistory.
 *
 * Journal answers: "What happened?"
 */
import { useState, useCallback } from 'react'
import { computeInsight } from '../lib/utils.js'
import {
  SectionTitle, StandardCard, Caption, FieldLabel, EmptyState,
  PrimaryButton, SecondaryButton, GhostButton
} from './common/index.jsx'
import {
  Surface, Text, Status, Accent, Radius, Space, Pad, Gap,
  FontSize, FontWeight, Z
} from '../styles/tokens/index.js'

// ─── Outcome capture ──────────────────────────────────────────────────────────

const OUTCOMES = [
  { id:'helpful',     label:'✓ Worked well',    color: Status.Success },
  { id:'neutral',     label:'― Neutral',         color: Text.Secondary },
  { id:'not_helpful', label:'✗ Didn\'t work',   color: Status.Danger },
  { id:'skipped',     label:'— Not applicable', color: Text.Secondary }
]

function OutcomeCapture({ onRecord }) {
  const [step,     setStep]     = useState('pick')   // 'pick' | 'note' | 'done'
  const [outcome,  setOutcome]  = useState(null)
  const [category, setCategory] = useState('')
  const [note,     setNote]     = useState('')

  const CATS = ['Career','Finance','Relationships','Health','Learning','Family','Spiritual','Travel','Other']

  function pickOutcome(id) { setOutcome(id); setStep('note') }

  function submit() {
    if (!outcome) return
    onRecord({ category, outcome, note, timestamp: new Date().toISOString() })
    setStep('done')
  }

  if (step === 'done') return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card,
      textAlign:'center', marginBottom: Space.xl }}>
      <p style={{ fontSize: FontSize.Heading3, marginBottom: Space.xs }}>✓</p>
      <p style={{ fontSize: FontSize.Body, color: Status.Success, fontWeight: FontWeight.Bold }}>
        Outcome recorded
      </p>
    </div>
  )

  if (step === 'note') return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Space.xl }}>
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary, marginBottom: Space.md }}>
        Add details (optional)
      </p>
      <div style={{ marginBottom: Space.md }}>
        <FieldLabel text="Category" />
        <select value={category} onChange={e=>setCategory(e.target.value)} style={{
          width:'100%', background: Surface.Card, border:`1px solid ${Surface.Line}`,
          borderRadius: Radius.input, padding: Pad.input, fontSize: FontSize.Body,
          color: Text.Primary, fontFamily:'inherit', outline:'none' }}>
          <option value="">— optional —</option>
          {CATS.map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: Space.xl }}>
        <FieldLabel text="Note (optional)" />
        <input value={note} onChange={e=>setNote(e.target.value)}
          placeholder="What happened?" style={{
            width:'100%', background: Surface.Card, border:`1px solid ${Surface.Line}`,
            borderRadius: Radius.input, padding: Pad.input, fontSize: FontSize.Body,
            color: Text.Primary, fontFamily:'inherit', outline:'none', boxSizing:'border-box'
          }} />
      </div>
      <div style={{ display:'flex', gap: Space.sm }}>
        <SecondaryButton onClick={() => setStep('pick')}>Back</SecondaryButton>
        <PrimaryButton onClick={submit}>Save</PrimaryButton>
      </div>
    </div>
  )

  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Space.xl }}>
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold, color: Text.Primary, marginBottom: Space.md }}>
        How did today's guidance go?
      </p>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap: Space.sm }}>
        {OUTCOMES.map(o => (
          <button key={o.id} onClick={() => pickOutcome(o.id)} style={{
            background: Surface.Base, border:`1px solid ${Surface.Line}`,
            borderRadius: Radius.md, padding:`${Space.sm}px ${Space.md}px`,
            color: o.color, fontSize: FontSize.Body, fontWeight: FontWeight.Bold,
            cursor:'pointer', fontFamily:'inherit', minHeight:44, textAlign:'center' }}>
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Journal entry ────────────────────────────────────────────────────────────

function JournalEntry({ entry }) {
  const date = entry.timestamp
    ? new Date(entry.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
    : 'Unknown date'
  const outcome = OUTCOMES.find(o => o.id === entry.outcome)

  return (
    <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card, marginBottom: Gap.card }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom: Space.xs }}>
        <div style={{ display:'flex', gap: Space.sm, alignItems:'center' }}>
          {outcome && (
            <span style={{ fontSize: FontSize.Caption, color: outcome.color, fontWeight: FontWeight.Bold }}>
              {outcome.label}
            </span>
          )}
          {entry.category && (
            <span style={{ fontSize: FontSize.Badge, color: Text.Secondary,
              background: Surface.Line, borderRadius: Radius.pill, padding:'2px 8px' }}>
              {entry.category}
            </span>
          )}
        </div>
        <Caption style={{ flexShrink:0, marginLeft: Space.sm }}>{date}</Caption>
      </div>
      {entry.note && (
        <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.5, marginTop: Space.xs }}>
          {entry.note}
        </p>
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function JournalEmpty() {
  return (
    <div style={{ textAlign:'center', padding:`${Space['3xl']}px ${Space.xl}px`,
      background: Surface.Card, borderRadius: Radius.card, marginBottom: Space.md }}>
      <p style={{ fontSize:32, marginBottom: Space.md }}>📖</p>
      <p style={{ fontSize: FontSize.CardTitle, fontWeight: FontWeight.Bold,
        color: Text.Primary, marginBottom: Space.sm }}>
        Your journal is empty
      </p>
      <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.6, marginBottom: Space.sm }}>
        As you use Kairos, your decisions and outcomes will appear here.
      </p>
      <p style={{ fontSize: FontSize.Caption, color: Text.Secondary }}>
        Record today's outcome to get started.
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function InsightsModal({ onClose, identity, onAddEntry }) {
  const [showRecord, setShowRecord] = useState(false)
  const history = identity?.appState?.feedbackHistory || []
  const insight = computeInsight(history)
  const recent  = [...history].reverse().slice(0, 20)
  const hasEntries = recent.length > 0

  function handleRecord(entry) {
    onAddEntry?.(entry)
    setShowRecord(false)
  }

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background: Surface.Overlay,
        backdropFilter:'blur(4px)', zIndex: Z.overlay }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'92vh', overflowY:'auto', background: Surface.Base,
        borderRadius: Radius.modal, zIndex: Z.modal }}>
        <div style={{ padding: Pad.modal }}>
          <div style={{ width:36, height:4, background: Surface.Line, borderRadius:2,
            margin:`0 auto ${Space.xl}px` }} />
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: Space.xl }}>
            <p style={{ fontSize: FontSize.Heading3, fontWeight: FontWeight.Bold, color: Text.Primary }}>
              Journal
            </p>
            {!showRecord && (
              <GhostButton onClick={() => setShowRecord(true)} small>Record outcome</GhostButton>
            )}
          </div>

          {showRecord && <OutcomeCapture onRecord={handleRecord} />}

          {insight && hasEntries && (
            <div style={{ background: Surface.Card, borderRadius: Radius.card, padding: Pad.card,
              marginBottom: Space.xl, display:'flex', gap: Space.md }}>
              <span style={{ fontSize: FontSize.Heading3 }}>💡</span>
              <p style={{ fontSize: FontSize.BodySmall, color: Text.Secondary, lineHeight:1.5 }}>{insight}</p>
            </div>
          )}

          {hasEntries ? (<>
            <SectionTitle>Recent Entries</SectionTitle>
            {recent.map((e, i) => <JournalEntry key={i} entry={e} />)}
          </>) : <JournalEmpty />}
        </div>
      </div>
    </>
  )
}
