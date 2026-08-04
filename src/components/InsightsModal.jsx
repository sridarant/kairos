import { computeAnalytics, computeInsight } from '../lib/dataClient'

const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', marginBottom:8 }}>
      <p style={{ fontSize:11, color:'var(--gray-4)', marginBottom:4, textTransform:'uppercase', letterSpacing:'0.05em' }}>{label}</p>
      <p style={{ fontSize:20, fontWeight:700, color:'var(--white)', marginBottom:2 }}>{value}</p>
      {sub && <p style={{ fontSize:12, color:'var(--gray-4)' }}>{sub}</p>}
    </div>
  )
}

export default function InsightsModal({ onClose, userData }) {
  const history  = userData?.history || []
  const analytics = computeAnalytics(history)
  const insight   = computeInsight(history)

  const rated    = history.filter(e => e.outcome !== null)
  const acted    = history.filter(e => e.acted === true)
  const doCount  = history.filter(e => e.decision === 'do').length
  const waitCount = history.filter(e => e.decision === 'wait').length

  // Best window: count golden hour mentions in history
  const hourCounts = {}
  history.filter(e => e.timestamp).forEach(e => {
    const h = new Date(e.timestamp).getHours()
    const slot = h < 9 ? '07–09' : h < 11 ? '09–11' : h < 13 ? '11–13' : h < 15 ? '13–15' : h < 17 ? '15–17' : '17–19'
    hourCounts[slot] = (hourCounts[slot] || 0) + 1
  })
  const bestWindow = Object.entries(hourCounts).sort((a,b) => b[1]-a[1])[0]?.[0]

  // Best day
  const dayCounts = {}
  history.filter(e => e.outcome === 'success' && e.timestamp).forEach(e => {
    const d = DAY_NAMES[new Date(e.timestamp).getDay()]
    dayCounts[d] = (dayCounts[d] || 0) + 1
  })
  const bestDay = Object.entries(dayCounts).sort((a,b) => b[1]-a[1])[0]?.[0]

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
          <p style={{ fontSize:13, color:'var(--gray-4)', marginBottom:20 }}>Based on {history.length} {history.length === 1 ? 'session' : 'sessions'}</p>

          {history.length === 0 ? (
            <div style={{ textAlign:'center', paddingTop:40 }}>
              <p style={{ fontSize:32, marginBottom:12 }}>📊</p>
              <p style={{ fontSize:15, fontWeight:600, marginBottom:8 }}>No data yet</p>
              <p style={{ fontSize:13, color:'var(--gray-4)', lineHeight:1.6 }}>
                Start asking Kairos questions and rating guidance to see your insights.
              </p>
            </div>
          ) : (
            <>
              {insight && (
                <div style={{ background:'rgba(250,204,21,0.1)', borderRadius:12, padding:14, marginBottom:16, border:'1px solid rgba(250,204,21,0.2)' }}>
                  <p style={{ fontSize:14, color:'var(--yellow)', lineHeight:1.5 }}>💡 {insight}</p>
                </div>
              )}
              <StatCard label="Action Rate"
                value={analytics.actionRateDisplay || 'N/A'}
                sub="How often you act on guidance" />
              <StatCard label="Success Rate"
                value={rated.length > 0 ? `${Math.round((rated.filter(e=>e.outcome==='success').length/rated.length)*100)}%` : 'N/A'}
                sub={`From ${rated.length} rated decisions`} />
              {bestWindow && <StatCard label="Most Active Window" value={bestWindow} sub="When you ask most questions" />}
              {bestDay && <StatCard label="Best Decision Day" value={bestDay} sub="Highest success rate" />}
              <StatCard label="DO vs WAIT"
                value={`${doCount} / ${waitCount}`}
                sub="Times guided to act vs wait" />
              <StatCard label="Total Sessions"
                value={userData?.usage_stats?.sessions || history.length}
                sub="App opens recorded" />
            </>
          )}
        </div>
      </div>
    </>
  )
}
