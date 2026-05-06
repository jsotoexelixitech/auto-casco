// PM2 — Modo DESARROLLO con Cloudflare Tunnel persistente
// Persiste aunque cierres SSH / MobaXterm
//
// Uso:
//   pm2 start ecosystem.dev.config.cjs
//   pm2 logs                       (ver todos los logs en tiempo real)
//   pm2 logs aci-tunnel            (ver URL pública de Cloudflare)
//   pm2 status                     (ver estado de todos los procesos)
//   pm2 stop all
//   pm2 delete all

'use strict'

const path = require('path')
const ROOT = __dirname

module.exports = {
  apps: [
    // ── Vite dev server ──────────────────────────────────────
    {
      name      : 'aci-web',
      cwd       : ROOT,
      script    : 'node_modules/.bin/vite',
      args      : '--host',
      watch     : false,
      autorestart: true,
      env: { NODE_ENV: 'development' },
      out_file  : path.join(ROOT, 'logs', 'web.out.log'),
      error_file: path.join(ROOT, 'logs', 'web.err.log'),
      merge_logs: true,
      time      : true,
    },
    // ── Cloudflare Tunnel (apunta a Vite :5173) ──────────────
    {
      name      : 'aci-tunnel',
      script    : 'cloudflared',
      args      : 'tunnel --url http://localhost:5173',
      watch     : false,
      autorestart: true,
      out_file  : path.join(ROOT, 'logs', 'tunnel.out.log'),
      error_file: path.join(ROOT, 'logs', 'tunnel.err.log'),
      merge_logs: true,
      time      : true,
    },
  ],
}
