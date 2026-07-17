/**
 * Libera el puerto del backend antes de arrancar (evita EADDRINUSE).
 * Se ejecuta vía npm prestart:dev. Lee PORT del entorno (default 3001).
 */
const { execSync } = require('child_process');

const port = process.env.PORT || '3001';

function killPids(pids) {
  const unique = [...new Set(pids.filter((p) => p && p !== '0'))];
  if (unique.length === 0) return;

  for (const pid of unique) {
    try {
      console.log(`[free-port] Liberando puerto ${port}: matando PID ${pid}`);
      if (process.platform === 'win32') {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } else {
        execSync(`kill -9 ${pid}`, { stdio: 'ignore' });
      }
    } catch {
      // El proceso pudo terminar entre el listado y el kill
    }
  }

  // Breve pausa para que el SO libere el socket
  if (process.platform === 'win32') {
    execSync('timeout /t 1 /nobreak >nul', { stdio: 'ignore', shell: true });
  } else {
    execSync('sleep 1', { stdio: 'ignore' });
  }
}

function freePortWindows() {
  try {
    const out = execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
      encoding: 'utf8',
    });
    const pids = out
      .split('\n')
      .map((line) => line.trim().split(/\s+/).pop())
      .filter(Boolean);
    killPids(pids);
  } catch {
    // Puerto libre
  }
}

function freePortUnix() {
  try {
    const out = execSync(`lsof -ti :${port}`, { encoding: 'utf8' });
    killPids(out.trim().split('\n'));
  } catch {
    // Puerto libre
  }
}

if (process.platform === 'win32') {
  freePortWindows();
} else {
  freePortUnix();
}
