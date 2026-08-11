export default function DiagnosticsPanel({ diagnostics }) {
  if (!diagnostics) return null
  const STATUS = v => v ? '✅' : '❌'
  return (
    <div style={{ background:'#111', border:'1px solid #333', borderRadius:10, padding:'10px 12px', marginBottom:10, fontSize:10, lineHeight:1.8 }}>
      <p style={{ color:'#888', fontWeight:700, marginBottom:4 }}>DEV · Data Diagnostics</p>
      {Object.entries(diagnostics).map(([key, val]) => (
        <p key={key} style={{ color:val?.valid ? Status.Success : Status.Danger }}>
          {STATUS(val?.valid)} {key}
          {val?.issues?.length ? ` — ${val.issues.join(', ')}` : ''}
          {val?.count !== undefined ? ` (${val.count})` : ''}
        </p>
      ))}
    </div>
  )
}
