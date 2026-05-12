# Context · Frontend Mundial (snapshot)

Última actualización: **2026-05-12**

## Estado actual

### ✅ Implementado
- 12 secuencias fotográficas con piezas exactas según minuta 05-05-2026
- Algoritmo de asegurabilidad (R+M ≥ 15 → no asegurable)
- Wizard de inspección con 5 pasos (Documentos · Ubicación · Fotos · Daños · Revisión)
- Plano digital del vehículo con zonas verde/azul/naranja
- Control estricto de rol cliente vs perito (el cliente NO ve IA, piezas, diagnóstico)
- OCR simulado para cédula, RIF y carnet de circulación
- Sistema de toasts con z-index 120 (sobre todo)
- BottomNav móvil con FAB central rojo Imperial
- SideNav navy oficial (`#091133 → #0F1A5A`) con item activo blanco + barra lateral roja
- Wizard de emisión de póliza con stepper visual
- Pages: Dashboard, Pólizas, Inspecciones, Cobertura, Emisión, Siniestros, Pagos, Perfil, Ajustes, Ayuda
- Búsqueda global Cmd+K
- Páginas dedicadas para Siniestro nuevo y detalle (sin modales)
- Sección inline de "Agregar método de pago" (sin modales)
- Diagnóstico IA simulado en Step 4 para perito
- Banner de asegurabilidad en Step 5 para perito
- API integration con NestJS backend + fallback a mock data

### 🎨 Identidad visual aplicada
- Tipografía Poppins + Source Serif 4 (sustituto Constantia)
- Paleta oficial: Azul Pennsylvania, Rojo Imperial, Plata, Azules logo
- Body con gradiente sutil de marca
- Cards con bordes y sombras navy (no gris neutro)
- Sidebar navy con acentos rojo Imperial en items activos

### 🔌 Backend
- NestJS + Prisma + PostgreSQL en `backend/`
- Módulos: auth, users, vehicles, inspections, policies, siniestros, payments, plans
- JWT auth con bcrypt 12 rondas
- Swagger en `/api/docs`
- Hybrid frontend: si API falla, mock data automático

## Convenciones que NO debo violar

1. **Rol cliente** = solo captura, sin información técnica
2. **Sin modales** — preferir páginas dedicadas o secciones inline
3. **Touch targets ≥ 44px**
4. **Colores solo de la paleta oficial** (no tailwind `blue-500` random)
5. **Responsive desde 320px** sin scrolls laterales
6. **`min-w-0` y `truncate`** en flex items con texto largo

## Bug-watch / áreas sensibles

- `AppLayout.jsx` NO debe tener `bg-background` opaco (esconde el gradient body)
- Cards usan `.card` (gradient + border navy 10%), NO `bg-white` plano
- `Stepper` debe permitir click solo a pasos completados (`onStepClick` con validación)
- Step3Photos: el cliente NO debe ver `photoState.issues` ni `placa` overlay
- Step4Damages: campos "Descripción" y "Observaciones" SOLO renderizan si `isPerito`
- Step5Review: el banner de asegurabilidad SOLO en vista perito (early return para cliente)

## Mock users disponibles (login con cualquier password)

| Email                       | Rol             | Nombre              |
|-----------------------------|-----------------|---------------------|
| miguel.azualde@…            | perito          | Miguel Azualde      |
| carolina.rivas@gmail.com    | asegurado       | Carolina Rivas      |
| (otros en mockData.js)      | …               | …                   |

## Comandos rápidos

```powershell
# Servidor de desarrollo
npm run dev

# Build
npm run build

# Liberar puerto 5173
$conn = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($conn) { $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }
```

## Cuando el usuario reporta "se ve en blanco"

Pasos de diagnóstico:
1. Revisar logs en terminal del dev server (errores JS, fallos de HMR)
2. Verificar que `AppLayout` no esté ocultando contenido (sin `bg-background` opaco innecesario)
3. Verificar que el body bg-gradient no esté siendo cubierto por un wrapper
4. Verificar que las cards usen `.card` (no `bg-white` directo)
5. Verificar role correcto del usuario logueado
6. Revisar el `policies[0]` para asegurados — debe haber al menos una póliza en mockData
