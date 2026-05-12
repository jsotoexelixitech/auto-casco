import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// HMR a través de Cloudflare Tunnel solo si así lo pides explícitamente.
// En desarrollo local normal usamos HMR estándar (websocket localhost).
//   USE_TUNNEL=1 npm run dev    o    npm run dev:cloud
const useTunnel = process.env.USE_TUNNEL === '1'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    // Evita que el watcher escanee carpetas pesadas y dispare loops de rebuild
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
