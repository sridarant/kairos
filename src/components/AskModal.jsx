import { useState } from 'react'
import { saveEntry, updateOutcome } from '../lib/history'
import { trackAskClick, addActionEntry, trackActionTaken } from '../lib/analytics'

const COLORS = {
  do:    { bg: 'var(--green-bg)', txt: 'var(--green-txt)', label: '✅ DO IT' },
  avoid: { bg: 'var(--red-bg)',   txt: 'var(--red-txt)',   label: '🚫 AVOID' },
  wait:  { bg: 'var(--amber-bg)', txt: 'var(--amber-txt)', label: '⏳ WAIT'  }
}

export default function AskModal({ onClose, profile, feedbackAdj }) {
  const [question, setQuestion]   = useState('')
  const [context, setContext]     = useState('')
  const [result, setResult]       = useState(null)
  const [entryId, setEntryId]     = useState(null)
  const [feedback, setFeedback]   = useState(null)
  const [actionTaken, setActionTaken] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  async function handleSubmit() {
    if (!question.trim()) return
    trackAskClick()
    setLoading(true)
    setError(null)
    setFeedback(null)
    setActionTaken(null)
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, context, profile, feedbackAdj })
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setResult(data)
      const entry = saveEntry({ question, decision: data.decision, confidence: data.confidence })
      if (entry) {
        setEntryId(entry.id)
        addActionEntry(entry)
      }
    } catch {
      setError('Could not get a response. Try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleFeedback(outcome) {
    setFeedback(outcome)
    if (entryId) updateOutcome(entryId, outcome)
  }

  function handleActionTaken(acted) {
    setActionTaken(acted)
    if (entryId) trackActionTaken(entryId, acted)
  }

  function handleAskAnother() {
    setResult(null)
    setFeedback(null)
    setActionTaken(null)
    setEntryId(null)
    setQuestion('')
    setContext('')
  }

  const colors = result ? (COLORS[result.decision] || COLORS.wait) : null

  const btnStyle = () => ({
    flex: 1, padding: '10px 0', border: 'none', borderRadius: 10,
    fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
    background: 'var(--gray-2)', color: 'var(--gray-4)'
  })

  return (
    <>
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)', zIndex: 40
      }} />
      <div className="slide-up" style={{
        position: 'fixed', bottom: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 448,
        background: 'var(--gray-1)',
        borderRadius: '20px 20px 0 0',
        padding: '24px 16px 40px',
        zIndex: 50,
        maxHeight: '90dvh', overflowY: 'auto'
      }}>
        <div style={{ width: 36, height: 4, background: 'var(--gray-3)', borderRadius: 2, margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>Ask Kairos</h2>
        {profile?.name && <p style={{ fontSize: 13, color: 'var(--gray-4)', marginBottom: 16 }}>for {profile.name}</p>}
        {!profile?.name && <div style={{ marginBottom: 16 }} />}

        {!result ? (
          <>
            <textarea
              value={question}
              onChange={e => setQuestion(e.target.value)}
              placeholder="What decision are you facing?"
              rows={3}
              style={{
                width: '100%', background: 'var(--gray-2)', border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 15, padding: 14, resize: 'none', outline: 'none',
                marginBottom: 10, fontFamily: 'inherit'
              }}
            />
            <textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Any context? (optional)"
              rows={2}
              style={{
                width: '100%', background: 'var(--gray-2)', border: 'none', borderRadius: 12,
                color: '#fff', fontSize: 15, padding: 14, resize: 'none', outline: 'none',
                marginBottom: 16, fontFamily: 'inherit'
              }}
            />
            {error && <p style={{ color: 'var(--red-txt)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <button
              onClick={handleSubmit}
              disabled={loading || !question.trim()}
              className="scale-tap"
              style={{
                width: '100%', padding: '14px',
                background: question.trim() ? 'var(--yellow)' : 'var(--gray-3)',
                color: question.trim() ? '#000' : 'var(--gray-4)',
                border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 600,
                cursor: question.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontFamily: 'inherit'
              }}
            >
              {loading ? <><span className="spinner" /> Thinking…</> : 'Get Guidance'}
            </button>
          </>
        ) : (
          <div className="fade-in">
            <div style={{ background: colors.bg, borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: colors.txt, fontWeight: 700, marginBottom: 4 }}>{colors.label}</p>
              <p style={{ fontSize: 15 }}>{result.message}</p>
            </div>

            {(result.best_time || result.avoid_time) && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                {result.best_time && (
                  <div style={{ flex: 1, background: 'var(--green-bg)', borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 11, color: 'var(--green-txt)', marginBottom: 2 }}>BEST TIME</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{result.best_time}</p>
                  </div>
                )}
                {result.avoid_time && (
                  <div style={{ flex: 1, background: 'var(--red-bg)', borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 11, color: 'var(--red-txt)', marginBottom: 2 }}>AVOID</p>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{result.avoid_time}</p>
                  </div>
                )}
              </div>
            )}

            <p style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 14 }}>
              Confidence: {result.confidence}%
            </p>

            {/* Action taken */}
            {actionTaken === null ? (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 8 }}>Did you take this action?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleActionTaken(true)}  style={btnStyle()}>✓ Yes</button>
                  <button onClick={() => handleActionTaken(false)} style={btnStyle()}>✗ No</button>
                </div>
              </div>
            ) : (
              <p className="fade-in" style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 14, textAlign: 'center' }}>
                {actionTaken ? '✓ Great — check back on how it went.' : '✓ Noted — timing is everything.'}
              </p>
            )}

            {/* Feedback */}
            {!feedback ? (
              <div style={{ marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 8 }}>Was this guidance helpful?</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleFeedback('success')} style={btnStyle()}>👍 Yes</button>
                  <button onClick={() => handleFeedback('fail')}    style={btnStyle()}>👎 No</button>
                </div>
              </div>
            ) : (
              <p className="fade-in" style={{ fontSize: 12, color: 'var(--gray-4)', marginBottom: 14, textAlign: 'center' }}>
                {feedback === 'success' ? '✓ Kairos learns from this.' : '✓ Guidance will adapt.'}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleAskAnother} className="scale-tap" style={{
                flex: 1, padding: 14, background: 'var(--gray-2)', border: 'none',
                borderRadius: 12, color: '#fff', fontSize: 15, cursor: 'pointer', fontFamily: 'inherit'
              }}>Ask Another</button>
              <button onClick={onClose} className="scale-tap" style={{
                flex: 1, padding: 14, background: 'var(--yellow)', border: 'none',
                borderRadius: 12, color: '#000', fontSize: 15, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'inherit'
              }}>Done</button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
