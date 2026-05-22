import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Register service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      // Notify app of waiting SW for update prompt
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            window.dispatchEvent(new CustomEvent('swUpdateReady'))
          }
        })
      })
    }).catch(() => {})
  })
}

// Expose install prompt globally for use in UI
window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault()
  window.__installPrompt = e
  window.dispatchEvent(new CustomEvent('installable'))
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
)
