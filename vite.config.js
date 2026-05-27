import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo-vuphong-sun.png', 'logo-vuphong-wide.svg', 'icons.svg'],
      manifest: {
        name: 'VPEG PXD Dashboard',
        short_name: 'VPEG',
        description: 'Quản lý dự án solar EPC — Vũ Phong Energy Group',
        theme_color: '#060a13',
        background_color: '#060a13',
        display: 'standalone',
        orientation: 'any',
        scope: '/',
        start_url: '/',
        lang: 'vi',
        icons: [
          {
            src: '/logo-vuphong-sun.png',
            sizes: '142x142',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/logo-vuphong-sun.png',
            sizes: '142x142',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/share\//, /^\/huong-dan/, /^\/HUONG_DAN_SU_DUNG\.html/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
