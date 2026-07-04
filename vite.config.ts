import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      manifest: {
        name: 'BS Planner PSI',
        short_name: 'PlannerPSI',
        description: 'Planejamento de estudos, tarefas e foco para residência em psiquiatria',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        scope: '/plannerpsi/',
        start_url: '/plannerpsi/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  base: '/plannerpsi/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
