import { useLayout, LAYOUT } from './useLayout.js'
import MobileShell  from './MobileShell.jsx'
import TabletShell  from './TabletShell.jsx'
import DesktopShell from './DesktopShell.jsx'

export default function AppShell({ bs }) {
  const lv = useLayout()
  if (lv.isDesktop) return <DesktopShell bs={bs} />
  if (lv.isTablet)  return <TabletShell  bs={bs} />
  return                    <MobileShell  bs={bs} />
}
