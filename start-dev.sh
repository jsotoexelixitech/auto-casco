#!/usr/bin/env bash
# =============================================================
#  start-dev.sh — Entorno de desarrollo en Linux/macOS
#  Auto Casa Inspeccion (La Mundial de Seguros)
#
#  Uso:
#    chmod +x start-dev.sh
#    ./start-dev.sh              # solo Vite dev server
#    ./start-dev.sh --tunnel     # Vite dev + Cloudflare HTTPS público
# =============================================================
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WITH_TUNNEL=false

# --- Argumentos -----------------------------------------------
for arg in "$@"; do
  case $arg in
    --tunnel|-t) WITH_TUNNEL=true ;;
  esac
done

# --- Colores --------------------------------------------------
B='\033[1m'; C='\033[36m'; G='\033[32m'; Y='\033[33m'; R='\033[31m'; N='\033[0m'

banner() { echo -e "\n${C}==============================${N}"; echo -e "${B}  $1${N}"; echo -e "${C}==============================${N}"; }
ok()     { echo -e "${G}[OK]${N} $1"; }
info()   { echo -e "${C}[>>]${N} $1"; }
warn()   { echo -e "${Y}[!!]${N} $1"; }
die()    { echo -e "${R}[ERROR]${N} $1"; exit 1; }

banner "Auto Casa Inspeccion — Modo Desarrollo"

# --- Verificaciones -------------------------------------------
command -v node >/dev/null 2>&1 || die "Node.js no instalado. Instala con: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt install -y nodejs"
command -v npm  >/dev/null 2>&1 || die "npm no encontrado"

WEB_PORT=5173

# --- Dependencias ---------------------------------------------
if [[ ! -d "$ROOT/node_modules" ]]; then
  info "Instalando dependencias..."
  cd "$ROOT" && npm install --silent
  ok "node_modules listos"
fi

mkdir -p "$ROOT/logs"

# --- Limpiar procesos anteriores ------------------------------
info "Limpiando procesos previos en puerto $WEB_PORT..."
pkill -f "vite"       2>/dev/null || true
pkill -f cloudflared  2>/dev/null || true
sleep 1
fuser -k "${WEB_PORT}/tcp" 2>/dev/null || true
sleep 1
ok "Puerto $WEB_PORT libre"

# --- Levantar servicios ---------------------------------------
banner "Iniciando servicios"

cd "$ROOT"

if $WITH_TUNNEL; then
  command -v cloudflared >/dev/null 2>&1 || die "cloudflared no instalado. Instala con:
  curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o /tmp/cloudflared.deb
  sudo dpkg -i /tmp/cloudflared.deb"

  info "Modo: Vite dev + Cloudflare Tunnel"

  CF_LOG="$ROOT/logs/cloudflare.log"
  cloudflared tunnel --url "http://localhost:$WEB_PORT" > "$CF_LOG" 2>&1 &
  CF_PID=$!

  info "Esperando URL de Cloudflare..."
  for i in $(seq 1 20); do
    CF_URL=$(grep -oP 'https://[a-z0-9\-]+\.trycloudflare\.com' "$CF_LOG" 2>/dev/null | head -1 || true)
    [[ -n "$CF_URL" ]] && break
    sleep 1
  done

  echo ""
  if [[ -n "${CF_URL:-}" ]]; then
    echo -e "${B}${G}  URL pública HTTPS: $CF_URL${N}"
    echo -e "${G}  Accesible desde cualquier dispositivo con internet${N}"
  else
    warn "La URL de Cloudflare aún no aparece. Revisa: tail -f $ROOT/logs/cloudflare.log"
  fi
  echo ""

  trap "kill $CF_PID 2>/dev/null; exit" INT TERM
  npm run dev

else
  info "Modo: Vite dev (local)"
  echo ""
  echo -e "  Frontend: ${C}http://localhost:$WEB_PORT${N}"
  echo ""
  info "Para acceso externo HTTPS: ./start-dev.sh --tunnel"
  echo ""
  npm run dev
fi
