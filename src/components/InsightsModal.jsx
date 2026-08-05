import { computeAnalytics, computeInsight } from '../lib/dataClient'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
      <p style={{ fontSize:11, color:'var(--gray-4)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
      <p style={{ fontSize:20, fontWeight:700, color: accent || 'var(--white)', marginBottom:2 }}>{value}</p>
      {sub && <p style={{ fontSize:12, color:'var(--gray-4)' }}>{sub}</p>}
    </div>
  )
}

function JournalEntry({ entry }) {
  const date = entry.timestamp ? new Date(entry.timestamp).toLocaleDateString('en-GB', { day:'numeric', month:'short' }) : ''
  const confColor = { do:'var(--green-txt)', avoid:'var(--red-txt)', wait:'var(--amber-txt)' }[entry.decision] || 'var(--gray-4)'
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:10, padding:'10px 12px', marginBottom:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontSize:11, color:confColor, fontWeight:700, textTransform:'uppercase' }}>{entry.decision}</span>
        <span style={{ fontSize:11, color:'var(--gray-4)' }}>{date}</span>
      </div>
      <p style={{ fontSize:13, color:'var(--white)', lineHeight:1.4, marginBottom: entry.outcome ? 4 : 0 }}>
        {entry.question || 'Daily guidance'}
      </p>
      {entry.outcome && (
        <p style={{ fontSize:11, color: entry.outcome === 'success' ? 'var(--green-txt)' : 'var(--red-txt)' }}>
          {entry.outcome === 'success' ? '✓ Helpful' : '✗ Not helpful'}
        </p>
      )}
    </div>
  )
}

export default function InsightsModal({ onClose, userData }) {
  const history   = userData?.history || []
  const analytics = computeAnalytics(history)
  const insight   = computeInsight(history)
  const rated     = history.filter(e => e.outcome !== null)
  const recentJournal = history.slice(0, 7)

  // Pattern: best day
  const dayCounts = {}
  rated.filter(e => e.outcome === 'success' && e.timestamp).forEach(e => {
    const d = DAY_NAMES[new Date(e.timestamp).getDay()]
    dayCounts[d] = (dayCounts[d] || 0) + 1
  })
  const bestDay = Object.entries(dayCounts).sort((a,b) => b[1]-a[1])[0]?.[0]
  const doCount   = history.filter(e => e.decision === 'do').length
  const waitCount = history.filter(e => e.decision === 'wait').length
  const successRate = rated.length > 0
    ? Math.round((rated.filter(e => e.outcome === 'success').length / rated.length) * 100)
    : null

  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)', zIndex:40 }} />
      <div className="slide-up" style={{
        position:'fixed', left:0, right:0, bottom:0, maxWidth:448, margin:'0 auto',
        maxHeight:'90vh', overflowY:'auto', background:'var(--gray-1)',
        borderRadius:'20px 20px 0 0', zIndex:50
      }}>
        <div style={{ padding:'24px 16px 100px' }}>
          <div style={{ width:36, height:4, background:'var(--gray-3)', borderRadius:2, margin:'0 auto 20px' }} />
          <h2 style={{ fontSize:18, fontWeight:700, marginBottom:4 }}>Your Insights</h2>
          <p style={{ fontSize:13, color:'var(--gray-4)', marginBottom:20 }}>
            Based on {history.length} session{history.length !== 1 ? 's' : ''}
          </p>

          {history.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:32 }}>
              <p style={{ fontSize:32, marginBottom:12 }}>📊</p>
              <p style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>No data yet</p>
              <p style={{ fontSize:13, color:'var(--gray-4)', lineHeight:1.6 }}>
                Use Kairos daily and rate guidance to see your personalised insights.
              </p>
            </div>
          ) : (
            <>
              {insight && (
                <div style={{ background:'rgba(250,204,21,0.1)', borderRadius:12, padding:14, marginBottom:16, border:'1px solid rgba(250,204,21,0.2)' }}>
                  <p style={{ fontSize:14, color:'var(--yellow)', lineHeight:1.5 }}>💡 {insight}</p>
                </div>
              )}

              {/* Stats */}
              {analytics.actionRateDisplay && (
                <StatCard label="Action Rate" value={analytics.actionRateDisplay}
                  sub="How often you act on guidance" accent="var(--yellow)" />
              )}
              {successRate !== null && (
                <StatCard label="Helpful Rate" value={`${successRate}%`}
                  sub={`From ${rated.length} rated decisions`}
                  accent={successRate >= 70 ? 'var(--green-txt)' : successRate >= 45 ? 'var(--amber-txt)' : 'var(--red-txt)'} />
              )}
              {bestDay && (
                <StatCard label="Your Best Day" value={bestDay} sub="Highest success rate" />
              )}
              <StatCard label="DO vs WAIT" value={`${doCount} vs ${waitCount}`} sub="Times guided to act vs wait" />

              {/* Decision journal */}
              {recentJournal.length > 0 && (
                <>
                  <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10, marginTop:20 }}>
                    Recent Decisions
                  </p>
                  {recentJournal.map((e, i) => <JournalEntry key={i} entry={e} />)}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
