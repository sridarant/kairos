/**
 * motion.js — Animation tokens (subtle, purposeful)
 * Rule: no animation that doesn't serve decision-making.
 */
export const Duration = Object.freeze({
  instant: '0ms',
  fast:    '100ms',
  normal:  '200ms',
  slow:    '300ms',
  xslow:   '500ms',
})
export const Easing = Object.freeze({
  ease:      'ease',
  easeIn:    'cubic-bezier(0.4,0,1,1)',
  easeOut:   'cubic-bezier(0,0,0.2,1)',
  easeInOut: 'cubic-bezier(0.4,0,0.2,1)',
  spring:    'cubic-bezier(0.34,1.56,0.64,1)',
})
export const Transition = Object.freeze({
  button: `transform ${Duration.fast} ${Easing.easeOut}`,
  card:   `opacity ${Duration.normal} ${Easing.ease}`,
  expand: `all ${Duration.slow} ${Easing.easeOut}`,
})
// CSS class names (defined in index.css)
export const CSS = Object.freeze({
  fadeIn:   'fade-in',
  slideUp:  'slide-up',
  scaleTap: 'scale-tap',
})
