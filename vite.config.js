import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use the hand-written public/sw.js — do not auto-generate one
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      // Do not let the plugin generate manifest.json — we have our own
      manifest: false,
      injectManifest: {
        // Precache the app shell assets produced by the build
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest}'],
        // Inject the precache manifest into the sw.js __WB_MANIFEST placeholder.
        // If the placeholder is absent the plugin skips injection gracefully.
        injectionPoint: '__WB_MANIFEST'
      }
    })
  ]
})
