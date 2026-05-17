import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },
      workbox: {
        // The app bundles are currently large; raise Workbox precache limit for production builds.
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024
      },
      manifest: {
        name: 'Anti Gravity Workspace',
        short_name: 'Anti Gravity',
        description: 'Intelligent Collaborative Workspace',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'https://ui-avatars.com/api/?name=AG&background=6366f1&color=fff&size=192',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://ui-avatars.com/api/?name=AG&background=6366f1&color=fff&size=512',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  optimizeDeps: {
    include: ['monaco-editor', 'y-monaco', 'y-webrtc', 'yjs']
  },
  resolve: {
    alias: {
      'monaco-editor': 'monaco-editor'
    }
  }
})
