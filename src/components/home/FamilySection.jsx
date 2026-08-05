import { useState } from 'react'
const TRUST = { High:{icon:'🟢',color:'var(--green-txt)'}, Medium:{icon:'🟡',color:'var(--amber-txt)'}, Low:{icon:'🔴',color:'var(--red-txt)'} }

function MemberCard({ member, isFirst }) {
  const [open, setOpen] = useState(false)
  const emoji = isFirst ? '🙂' : ['👩','👦','👧','👴','👵'][Math.abs((member.name?.charCodeAt(0)||0)%5)]
  const t = TRUST[member.confidence || 'Medium'] || TRUST.Medium
  return (
    <div onClick={() => setOpen(o=>!o)} style={{ background:'var(--gray-2)', borderRadius:12, padding:'12px 14px', cursor:'pointer', marginBottom:6 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{emoji}</span>
          <div>
            <p style={{ fontSize:13, fontWeight:600 }}>{member.name}</p>
            <p style={{ fontSize:11, color:'var(--yellow)' }}>{member.golden_window}</p>
          </div>
        </div>
        <span style={{ fontSize:10, color:t.color }}>{t.icon}</span>
      </div>
      {open && (
        <div className="fade-in" style={{ marginTop:8 }}>
          <p style={{ fontSize:12, color:'var(--gray-4)', lineHeight:1.5 }}>{member.summary || member.do_advice}</p>
          {member.focus && <p style={{ fontSize:11, color:'var(--yellow)', marginTop:4 }}>Focus: {member.focus}</p>}
        </div>
      )}
    </div>
  )
}

export default function FamilySection({ members, alignment, onFamilyPlan }) {
  if (!members || members.length < 2) return null
  const t = TRUST[alignment?.confidence || 'Medium'] || TRUST.Medium
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
        <p style={{ fontSize:12, color:'var(--gray-4)', textTransform:'uppercase', letterSpacing:'0.06em' }}>Family Today</p>
        <button onClick={onFamilyPlan} style={{ background:'none', border:'1px solid var(--gray-3)', borderRadius:20,
          color:'var(--yellow)', fontSize:11, padding:'4px 10px', cursor:'pointer', fontFamily:'inherit', fontWeight:600, minHeight:30 }}>
          Plan Together
        </button>
      </div>
      {members.map((m, i) => <MemberCard key={i} member={m} isFirst={i===0} />)}
      {alignment && (
        <div style={{ background:'var(--gray-2)', borderRadius:12, padding:'11px 14px', marginTop:4 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
            <p style={{ fontSize:13, fontWeight:600 }}>Family Alignment</p>
            <span style={{ fontSize:10, color:t.color }}>{t.icon} {alignment.confidence||'Medium'}</span>
          </div>
          {alignment.best_shared_window && <p style={{ fontSize:12, color:'var(--yellow)', fontWeight:600, marginBottom:3 }}>Best together: {alignment.best_shared_window}</p>}
          {alignment.recommended?.length > 0 && <p style={{ fontSize:11, color:'var(--gray-4)' }}>✓ {alignment.recommended.slice(0,3).join(' · ')}</p>}
        </div>
      )}
    </div>
  )
}
