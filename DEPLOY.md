# Guía de Despliegue — Auto Casa Inspeccion
## La Mundial de Seguros

> Proyecto: frontend estático (React + Vite + Tailwind)  
> Servidor: Linux (Ubuntu/Debian) con PM2 + Cloudflare Tunnel

---

## Requisitos previos (una sola vez en el servidor)

```bash
# 1. Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. PM2 (gestor de procesos)
sudo npm install -g pm2

# 3. PM2 arranque automático al reiniciar el servidor
pm2 startup          # ejecuta el comando que te indique (con sudo)
# Ejemplo: sudo env PATH=... pm2 startup systemd -u jsoto --hp /home/jsoto

# 4. cloudflared (Cloudflare Tunnel)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
     -o /tmp/cloudflared.deb
sudo dpkg -i /tmp/cloudflared.deb
cloudflared --version   # verifica instalación
```

---

## Primera vez en el servidor

```bash
# 1. Clonar el repositorio
git clone https://github.com/jsotoexelixitech/auto-casa-inspeccion.git
cd auto-casa-inspeccion

# 2. Dar permisos al script de desarrollo
chmod +x start-dev.sh

# 3. Instalar dependencias
npm install
```

---

## Modo A — Desarrollo con Cloudflare (URL pública temporal)

Usa este modo para probar en el servidor sin hacer build de producción.  
La URL de Cloudflare cambia cada vez que reinicias el tunnel.

### Opción 1: En foreground (ves la URL inmediatamente, se cae al cerrar SSH)

```bash
./start-dev.sh --tunnel
# Ctrl+C para detener todo
```

### Opción 2: Con PM2 (persiste aunque cierres SSH / MobaXterm) ← RECOMENDADO

```bash
# Iniciar Vite dev + Cloudflare Tunnel con PM2
pm2 start ecosystem.dev.config.cjs

# Ver estado
pm2 status

# Ver URL pública de Cloudflare (busca la línea con trycloudflare.com)
pm2 logs aci-tunnel --lines 30

# Ver logs del frontend
pm2 logs aci-web

# Detener
pm2 stop all

# Eliminar de PM2
pm2 delete all
```

**Para ver la URL de Cloudflare:**
```bash
pm2 logs aci-tunnel --lines 30
# Busca una línea como:
# INF +----------------------------------------------------------+
# INF |  Your quick Tunnel has been created! Visit it at:       |
# INF |  https://xyz-abc-123.trycloudflare.com                  |
# INF +----------------------------------------------------------+
```

---

## Modo B — Producción con PM2 + Cloudflare

Este modo genera un build optimizado y lo sirve de forma estática.  
**Usar para producción real o demos estables.**

```bash
# 1. Instalar dependencias (si no lo has hecho)
npm install

# 2. Compilar el frontend
npm run build

# 3. Crear carpeta de logs
mkdir -p logs

# 4. Iniciar con PM2
pm2 start ecosystem.config.cjs

# 5. Guardar estado PM2 (sobrevive reinicios del servidor)
pm2 save

# 6. Ver estado
pm2 status
pm2 logs auto-casa-inspeccion
```

**App local disponible en:** `http://localhost:3000`

### Levantar Cloudflare Tunnel de producción

```bash
# Apunta al puerto de producción (3000)
cloudflared tunnel --url http://localhost:3000
```

Para que el tunnel persista también con PM2, agrega esto al `ecosystem.config.cjs`  
o lánzalo en una sesión de `screen`/`tmux`:

```bash
# Opción simple con screen
screen -S tunnel
cloudflared tunnel --url http://localhost:3000
# Ctrl+A, D  para desconectarse sin matar el proceso
# screen -r tunnel  para volver a verlo
```

---

## Actualizaciones del código

Cuando hay cambios nuevos en el repositorio:

```bash
cd ~/auto-casa-inspeccion

# Bajar cambios
git pull

# Si hay dependencias nuevas
npm install

# Si estás en PRODUCCIÓN: rebuild y reload
npm run build
pm2 reload ecosystem.config.cjs --update-env

# Si estás en DESARROLLO: PM2 recarga automático (Vite detecta cambios)
# No hace falta hacer nada extra, solo git pull
```

---

## Comandos útiles de PM2

| Comando | Descripción |
|---|---|
| `pm2 status` | Estado de todos los procesos |
| `pm2 logs` | Logs en tiempo real (todos) |
| `pm2 logs aci-web` | Logs solo del frontend dev |
| `pm2 logs aci-tunnel` | Logs del tunnel (para ver la URL) |
| `pm2 logs auto-casa-inspeccion` | Logs de producción |
| `pm2 stop all` | Detener todos los procesos |
| `pm2 restart all` | Reiniciar todos |
| `pm2 reload ecosystem.config.cjs` | Reload de producción (sin downtime) |
| `pm2 delete all` | Eliminar todos de PM2 |
| `pm2 save` | Guardar estado actual |
| `pm2 resurrect` | Restaurar estado guardado |

---

## Estructura de archivos relevantes

```
auto-casa-inspeccion/
├── dist/                       # Build de producción (generado por vite build)
├── logs/                       # Logs de PM2 y Cloudflare
├── src/                        # Código fuente React
├── public/                     # Archivos estáticos (logo, favicon)
├── ecosystem.config.cjs        # PM2 — PRODUCCIÓN (sirve dist/ con serve)
├── ecosystem.dev.config.cjs    # PM2 — DESARROLLO (Vite + Cloudflare Tunnel)
├── start-dev.sh                # Script bash (foreground) dev + tunnel
├── vite.config.js              # Vite config (acepta hosts de Cloudflare)
└── package.json
```

---

## Solución de problemas

### Error: Puerto 5173 ya en uso
```bash
fuser -k 5173/tcp
```

### Error: cloudflared no encontrado
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb \
     -o /tmp/cloudflared.deb && sudo dpkg -i /tmp/cloudflared.deb
```

### No veo la URL de Cloudflare
```bash
# Si usaste start-dev.sh
tail -f logs/cloudflare.log

# Si usaste PM2
pm2 logs aci-tunnel --lines 50
```

### El sitio carga pero muestra página en blanco
```bash
# Verifica que el build fue generado
ls -la dist/

# Si no existe, regenera
npm run build
```

### Blocked request (Vite rechaza host de Cloudflare)
El `vite.config.js` ya tiene `allowedHosts: true`. Si aparece este error, reinicia:
```bash
pm2 restart aci-web
# o
./start-dev.sh --tunnel
```
