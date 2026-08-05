export default function TimelineSection({ timeline }) {
  if (!timeline?.length) return null
  const QC = { Excellent:'var(--green-txt)', Good:'var(--yellow)', Moderate:'var(--amber-txt)', 'Low energy':'var(--red-txt)' }
  return (
    <div style={{ marginBottom:16 }}>
      <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Today's Timeline</p>
      <div style={{ position:'relative', paddingLeft:22 }}>
        <div style={{ position:'absolute', left:7, top:6, bottom:6, width:2, background:'var(--gray-3)', borderRadius:2 }} />
        {timeline.map((t, i) => (
          <div key={i} style={{ position:'relative', marginBottom:12 }}>
            <div style={{ position:'absolute', left:-17, top:3, width:9, height:9, borderRadius:'50%',
              background: QC[t.quality] || 'var(--gray-3)', border:'2px solid var(--gray-1)' }} />
            <p style={{ fontSize:12, fontWeight:700, color: QC[t.quality] || '#ccc', marginBottom:1 }}>
              {t.time}{t.end ? `–${t.end}` : ''}
            </p>
            <p style={{ fontSize:11, color:'var(--gray-4)', lineHeight:1.4 }}>{t.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
