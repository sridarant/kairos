/**
 * /src/layout/AppShell.jsx
 *
 * Top-level layout router. Selects the correct shell for the current viewport.
 * All children are the same — only composition changes.
 *
 * Pages describe WHAT. Shells determine HOW it's arranged.
 */
import { useLayout, LAYOUT } from './useLayout.js'
import MobileShell  from './MobileShell.jsx'
import TabletShell  from './TabletShell.jsx'
import DesktopShell from './DesktopShell.jsx'

export default function AppShell(props) {
  const lv = useLayout()
  if (lv.isDesktop) return <DesktopShell {...props} layoutView={lv} />
  if (lv.isTablet)  return <TabletShell  {...props} layoutView={lv} />
  return                    <MobileShell  {...props} layoutView={lv} />
}
