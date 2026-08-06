/**
 * App.jsx v30.2 — Minimal shell.
 * State via useBootstrap(). Layout via AppShell (mobile/tablet/desktop).
 * No viewport logic here.
 */
import { useBootstrap } from './hooks/useBootstrap.js'
import AppShell from './layout/AppShell.jsx'
import { ASYNC_STATE } from './constants/index.js'

export default function App() {
  const bs = useBootstrap()
  const loading = bs.status === ASYNC_STATE.LOADING
  return <AppShell bs={bs} loading={loading} />
}
