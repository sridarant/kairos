import { useState, useEffect } from 'react'
import HomeScreen from './components/HomeScreen'
import AskModal from './components/AskModal'
import BottomNav from './components/BottomNav'

const MOCK_DAILY = {
  golden_window: '11:10 AM – 12:20 PM',
  do: 'Have important conversations',
  avoid: 'Avoid financial decisions after 4 PM',
  watch: 'Energy dip in afternoon',
  confidence_summary: 78
}

export default function App() {
  const [daily, setDaily] = useState(null)
  const [loading, setLoading] = useState(true)
  const [askOpen, setAskOpen] = useState(false)

  useEffect(() => { fetchDaily() }, [])

  async function fetchDaily() {
    setLoading(true)
    try {
      const res = await fetch('/api/daily')
      if (!res.ok) throw new Error()
      setDaily(await res.json())
    } catch {
      setDaily(MOCK_DAILY)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 448, margin: '0 auto', minHeight: '100dvh', position: 'relative', paddingBottom: 72 }}>
      <HomeScreen daily={daily} loading={loading} />
      <BottomNav onAsk={() => setAskOpen(true)} />
      {askOpen && <AskModal onClose={() => setAskOpen(false)} />}
    </div>
  )
}
