#Requires -Version 5.1
# ============================================================
#  deploy.ps1 — Despliegue de produccion para auto-casa-inspeccion
#  Uso: .\deploy.ps1
#       .\deploy.ps1 -WithTunnel    (levanta Cloudflare Tunnel al final)
#       .\deploy.ps1 -Port 8080     (puerto personalizado)
# ============================================================

param(
    [switch]$WithTunnel,
    [int]$Port = 3000
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$ROOT  = $PSScriptRoot
$APP   = 'auto-casa-inspeccion'
$DIST  = Join-Path $ROOT 'dist'

function Write-Step([string]$msg) {
    Write-Host ""
    Write-Host "  >> $msg" -ForegroundColor Cyan
}
function Write-OK([string]$msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}
function Write-Fail([string]$msg) {
    Write-Host "  [!!] $msg" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor DarkCyan
Write-Host "  La Mundial - Auto Casco | Deploy $APP"    -ForegroundColor White
Write-Host "==========================================" -ForegroundColor DarkCyan

# ----------------------------------------------------------
# 1. Dependencias
# ----------------------------------------------------------
Write-Step "Instalando dependencias..."
Set-Location $ROOT
npm install --silent
if ($LASTEXITCODE -ne 0) { Write-Fail "npm install fallo" }
Write-OK "Dependencias OK"

# ----------------------------------------------------------
# 2. Build
# ----------------------------------------------------------
Write-Step "Compilando frontend (vite build)..."
npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "vite build fallo" }
if (-not (Test-Path $DIST)) { Write-Fail "Carpeta dist no fue generada" }
Write-OK "Build listo -> $DIST"

# ----------------------------------------------------------
# 3. Crear carpeta de logs
# ----------------------------------------------------------
$LOGS = Join-Path $ROOT 'logs'
if (-not (Test-Path $LOGS)) { New-Item -ItemType Directory -Path $LOGS | Out-Null }

# ----------------------------------------------------------
# 4. PM2 — start / reload
# ----------------------------------------------------------
Write-Step "Desplegando con PM2..."

$pm2 = Get-Command pm2 -ErrorAction SilentlyContinue
if (-not $pm2) { Write-Fail "PM2 no esta instalado. Ejecuta: npm install -g pm2" }

$ECO = Join-Path $ROOT 'ecosystem.config.cjs'
$env:PORT = $Port

# Intentar reload (zero-downtime); si el proceso no existe, hacer start
$running = pm2 list --no-color 2>&1 | Select-String $APP
if ($running) {
    pm2 reload $ECO --update-env
    if ($LASTEXITCODE -ne 0) { Write-Fail "pm2 reload fallo" }
    Write-OK "App recargada sin downtime (reload)"
} else {
    pm2 start $ECO
    if ($LASTEXITCODE -ne 0) { Write-Fail "pm2 start fallo" }
    Write-OK "App iniciada por primera vez"
}

pm2 save
Write-OK "Estado PM2 guardado (pm2 save)"

# ----------------------------------------------------------
# 5. Cloudflare Tunnel (opcional)
# ----------------------------------------------------------
if ($WithTunnel) {
    Write-Step "Iniciando Cloudflare Tunnel en puerto $Port..."
    $cf = Get-Command cloudflared -ErrorAction SilentlyContinue
    if (-not $cf) { Write-Fail "cloudflared no encontrado en PATH" }

    # Matar tunel anterior si existe
    Get-Process cloudflared -ErrorAction SilentlyContinue | Stop-Process -Force

    Start-Sleep -Seconds 1
    Start-Process -FilePath 'cloudflared' `
        -ArgumentList "tunnel --url http://localhost:$Port" `
        -NoNewWindow

    Write-Host ""
    Write-Host "  Cloudflare Tunnel arriba. La URL publica aparece en la" -ForegroundColor Yellow
    Write-Host "  consola de cloudflared (busca 'trycloudflare.com')."    -ForegroundColor Yellow
}

# ----------------------------------------------------------
# Resumen final
# ----------------------------------------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor DarkGreen
Write-Host "  DEPLOY EXITOSO" -ForegroundColor Green
Write-Host "  App local  : http://localhost:$Port"     -ForegroundColor White
Write-Host "  PM2 status : pm2 status"                 -ForegroundColor White
Write-Host "  PM2 logs   : pm2 logs $APP"              -ForegroundColor White
Write-Host "==========================================" -ForegroundColor DarkGreen
Write-Host ""
