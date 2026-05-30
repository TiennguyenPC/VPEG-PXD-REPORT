import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('recharts') || id.includes('d3-') || id.includes('victory-vendor')) {
            return 'vendor-charts';
          }
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('react-dom') || id.includes('react-router') || id.includes('/react/')) {
            return 'vendor-react';
          }
        },
      },
    },
  },
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
        maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
        globIgnores: ['**/vendor-charts-*.js', '**/TaskListCharts-*.js'],
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
