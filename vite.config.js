import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import basicSsl from '@vitejs/plugin-basic-ssl'

const useTunnel = process.env.USE_TUNNEL === '1'
/* VITE_HTTPS=1 activa un certificado autofirmado para servir en HTTPS.
   Imprescindible cuando se accede al dev server por IP LAN (ej.
   192.168.x.x) porque la Geolocation API solo funciona en contextos
   seguros (HTTPS o localhost). */
const useHttps = process.env.VITE_HTTPS === '1'

export default defineConfig({
  plugins: [
    react(),
    ...(useHttps ? [basicSsl()] : []),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon.ico', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png'],
      devOptions: {
        enabled: true,          // Activa el service worker en desarrollo también
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: 'index.html',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
      manifest: {
        name: 'La Mundial de Seguros · Auto Casco',
        short_name: 'La Mundial',
        description: 'Inspección digital de vehículos, emisión y activación de pólizas con IA.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0F1A5A',
        theme_color: '#0F1A5A',
        lang: 'es',
        categories: ['finance', 'business'],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',   // Android adaptive icon
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any',
          },
        ],
        screenshots: [
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'La Mundial — Panel de Control',
          },
        ],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/dist/**',
        '**/backend/**',
        '**/qa-evidence/**',
        '**/.git/**',
        '**/coverage/**',
        '**/*.log',
      ],
    },
    hmr: useTunnel
      ? { protocol: 'wss', clientPort: 443 }
      : true,
  },
})
