export default function SignalCards({ daily }) {
  const cards = [
    daily?.signal     || { icon:'🟡', label:'Signal', text:'Loading…' },
    daily?.avoid_card || { icon:'🔴', label:'Avoid',  text:'Loading…' },
    daily?.watch_card || { icon:'🟡', label:'Watch',  text:'Loading…' }
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:6, marginBottom:12 }}>
      {cards.map((c, i) => (
        <div key={i} style={{ background:'var(--gray-2)', borderRadius:12, padding:'10px 10px' }}>
          <p style={{ fontSize:15, marginBottom:3 }}>{c.icon}</p>
          <p style={{ fontSize:11, fontWeight:700, marginBottom:3, color:'#ddd' }}>{c.label}</p>
          <p style={{ fontSize:10, color:'var(--gray-4)', lineHeight:1.4 }}>{c.text}</p>
        </div>
      ))}
    </div>
  )
}
