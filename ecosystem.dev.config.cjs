'use strict'

module.exports = {
  apps: [
    {
      name         : 'frontend',
      script       : 'node_modules/vite/bin/vite.js',
      args         : '--host',
      cwd          : __dirname,
      autorestart  : true,
      watch        : false,
      max_restarts : 5,
      restart_delay: 3000,
      env          : { NODE_ENV: 'development' },
      out_file     : './logs/frontend-out.log',
      error_file   : './logs/frontend-err.log',
      merge_logs   : true,
    },
    {
      name         : 'backend',
      script       : 'node_modules/@nestjs/cli/bin/nest.js',
      args         : 'start --watch',
      cwd          : __dirname + '\\backend',
      autorestart  : true,
      watch        : false,
      max_restarts : 5,
      restart_delay: 3000,
      env          : { NODE_ENV: 'development' },
      out_file     : __dirname + '\\logs\\backend-out.log',
      error_file   : __dirname + '\\logs\\backend-err.log',
      merge_logs   : true,
    },
  ],
}
