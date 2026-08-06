/**
 * /src/layout/useLayout.js
 *
 * Single source of viewport truth. All adaptive layout decisions flow from here.
 * Components never contain viewport-specific logic — they receive layout props.
 *
 * Layout tiers:
 *   mobile  < 768px   — current experience, unchanged
 *   tablet  768–1199  — two-column with sidebar
 *   desktop ≥ 1200px  — full dashboard with three zones
 */
import { useState, useEffect, useMemo } from 'react'
import { Breakpoint } from '../styles/tokens/index.js'

export const LAYOUT = Object.freeze({
  MOBILE:  'mobile',
  TABLET:  'tablet',
  DESKTOP: 'desktop'
})

function getLayout(w) {
  if (w >= Breakpoint.desktop) return LAYOUT.DESKTOP
  if (w >= Breakpoint.tablet)  return LAYOUT.TABLET
  return LAYOUT.MOBILE
}

export function useLayout() {
  const [width, setWidth]   = useState(() => typeof window !== 'undefined' ? window.innerWidth : 390)
  const [layout, setLayout] = useState(() => getLayout(typeof window !== 'undefined' ? window.innerWidth : 390))

  useEffect(() => {
    let raf = null
    function onResize() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const w = window.innerWidth
        setWidth(w)
        setLayout(getLayout(w))
      })
    }
    window.addEventListener('resize', onResize, { passive: true })
    return () => { window.removeEventListener('resize', onResize); cancelAnimationFrame(raf) }
  }, [])

  return useMemo(() => ({
    layout,
    width,
    isMobile:  layout === LAYOUT.MOBILE,
    isTablet:  layout === LAYOUT.TABLET,
    isDesktop: layout === LAYOUT.DESKTOP,
    isWide:    layout !== LAYOUT.MOBILE,     // tablet or desktop
  }), [layout, width])
}
