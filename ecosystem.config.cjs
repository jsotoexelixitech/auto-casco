// PM2 — Configuración de producción para auto-casa-inspeccion
// Uso: pm2 start ecosystem.config.cjs
//      pm2 reload ecosystem.config.cjs   (zero-downtime restart)
//      pm2 stop auto-casa-inspeccion
'use strict'

const PORT = process.env.PORT || 3000

module.exports = {
  apps: [
    {
      name     : 'auto-casa-inspeccion',
      script   : 'node_modules/.bin/serve',
      args     : `dist --single --listen ${PORT}`,
      cwd      : __dirname,

      // Reinicio automático si el proceso muere
      autorestart : true,
      watch       : false,
      max_restarts: 10,
      restart_delay: 3000,

      // Variables de entorno de producción
      env: {
        NODE_ENV: 'production',
        PORT,
      },

      // Logs
      out_file : './logs/out.log',
      error_file: './logs/error.log',
      merge_logs : true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',

      // Límite de memoria (reinicia si supera)
      max_memory_restart: '200M',
    },
  ],
}
