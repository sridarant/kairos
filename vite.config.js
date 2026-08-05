import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Use our hand-written sw.js — plugin injects __WB_MANIFEST into it at build time
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw.js',
      // We manage manifest.json ourselves — do not generate one
      manifest: false,
      injectManifest: {
        // Source for the manifest injection
        swSrc: 'public/sw.js',
        swDest: 'dist/sw.js',
        // Match the build output files to precache
        globDirectory: 'dist',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}'],
        // Injection point — replaced with the precache manifest array
        injectionPoint: 'self.__WB_MANIFEST'
      }
    })
  ]
})
