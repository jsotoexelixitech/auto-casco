---
name: frontend-mundial
description: Agente especializado en el frontend de Auto Casco — La Mundial de Seguros. Úsalo siempre que trabajes en archivos `src/**/*.{jsx,js,css}`, `tailwind.config.js`, o cuando se mencione UI, marca, responsividad, inspección de vehículo, roles cliente/perito, identidad visual La Mundial. Aplica las reglas DE MARCA y de ROL antes de cualquier cambio visual.
---

# Frontend Agent · Auto Casco · La Mundial de Seguros

Este agente mantiene el contexto del proyecto frontend, sus convenciones y sus reglas críticas. Cárgalo SIEMPRE que toques UI, estilos, o flujos visuales.

## 1) Stack & convenciones

- **React 18** + **Vite 5** + **Tailwind CSS v3** + **React Router DOM 6**
- Estado: Context API (`AuthContext`, `DataContext`, `ToastContext`)
- Iconos: Material Symbols Outlined (componente `<Icon name="..." filled? />`)
- Mock data en `src/data/mockData.js` con fallback API
- Build: `npm run build` · Dev: `npm run dev` (puerto 5173)

## 2) Identidad Visual · Manual La Mundial de Seguros

### Paleta oficial (NO usar otros tonos para chrome/marca)

| Token              | HEX        | Uso                                       |
|--------------------|-----------|-------------------------------------------|
| Azul Pennsylvania  | `#0F1A5A` | Color principal — sidebar, primary, headers |
| Navy Deep          | `#091133` | Backgrounds profundos, gradientes navy    |
| Navy Soft          | `#162A7F` | Hover/accent del primary                  |
| Rojo Imperial      | `#E84F51` | CTAs principales, indicadores activos     |
| Rojo Imperial Dark | `#B23F44` | Hover de CTA accent                       |
| Plata              | `#ACACAC` | Bordes neutros, texto secundario          |
| Azul Logo Mid      | `#2E6DBF` | Gradientes del isotipo "M"                |
| Azul Logo Light    | `#4A8DD5` | Gradientes del isotipo "M"                |

### Gradientes brand oficiales

```css
/* Hero / promo navy */
background: linear-gradient(135deg, #091133 0%, #0F1A5A 60%, #162A7F 100%);

/* Hero con acento rojo Imperial (energético) */
background: linear-gradient(135deg, #091133 0%, #0F1A5A 60%, #E84F51 100%);

/* Línea decorativa brand (rib superior de cards) */
background: linear-gradient(90deg, #0F1A5A 0%, #162A7F 50%, #E84F51 100%);
```

### Tipografía

- **Sans**: Poppins (300–800) → `font-sans` (default)
- **Wordmark/Serif oficial**: Constantia (sustituto Source Serif 4) → `font-wordmark` / `.wordmark`
- Escala fluida vía `clamp()`: `display-2xl`, `display-lg`, `headline-lg`, `headline-md`, `body-lg`, `body-md`, `label-md`, `caption`

### Sombras de marca (Tailwind)

- `shadow-elev-1`: sombra suave con tinte navy
- `shadow-elev-2`: sombra media navy
- `shadow-elev-primary`: glow azul Pennsylvania
- `shadow-elev-accent`: glow rojo Imperial

## 3) Componentes base — NO romper

### Cards

- **`.card`** — fondo blanco con gradiente sutil + borde navy 10% + sombra navy
- **`.card-elev2`** — versión elevada
- **`.card-brand`** — fondo navy gradient + texto blanco (HERO/promo)
- **`.card-glass`** — para overlays
- **`.card-accent`** (modificador) — agrega cinta superior brand gradient

### Botones

- **`.btn-primary`** — `#0F1A5A` sólido (Azul Pennsylvania)
- **`.btn-accent`** — `#E84F51` sólido (Rojo Imperial)
- **`.btn-ghost`** — borde navy + transparente
- **`.btn-soft`** — surface-container neutro
- **`.btn-icon`** — botón circular 44×44

⚠️ TODOS los botones tienen `min-h-[44px]` para touch targets.

### Inputs

- **`.input`** — `bg-white` + borde outline + focus ring primary
- En móvil, font-size: 16px para evitar zoom iOS

## 4) Responsividad — CRÍTICO

Mobile-first. Breakpoints (Tailwind config):

- `xs`: 380px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

Reglas obligatorias al crear/editar UI:

1. **NO scrolls laterales** — siempre `overflow-x-hidden` en contenedores
2. **Touch targets** ≥ 44px (`min-h-[44px]` o `btn-icon`)
3. Textos largos: `truncate` + `min-w-0` en flex children, o `break-words`/`line-clamp-N`
4. Grids deben colapsar: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
5. Modales NO — usar páginas dedicadas o secciones inline expandibles
6. Bottom nav móvil: padding bottom `calc(env(safe-area-inset-bottom, 0px) + 88px)`
7. Sticky bars: usar variable CSS `--bottom-nav-h: 72px` para no chocar con BottomNav
8. Z-index map: BottomNav 50 · Sticky bars 50 · SideNav móvil 60 · Toasts 120

## 5) Roles · ESTRICTO

```js
const isPerito = user?.role === 'perito' || user?.role === 'admin'
```

### Lo que ve el CLIENTE (asegurado/intermediario)

✅ Captura de fotos del wizard de inspección  
✅ Plano del vehículo con recorrido guiado (verde activo, navy completado)  
✅ Toast "¡Foto guardada correctamente!" (sin mención IA)  
✅ Step 5: confirmación simple "Inspección completada · En revisión"  

❌ NUNCA muestra: clasificación de piezas B/R/M/N/E, análisis IA, diagnóstico,
   asegurabilidad, descripciones de daño técnicas, opinión del riesgo,
   placa detectada, badges "Validada/Revisar", botones de re-analizar IA,
   informe de daños, banners de asegurabilidad.

### Lo que ve el PERITO

✅ Todo lo del cliente +  
✅ Banner navy "Modo Perito · Acceso técnico completo"  
✅ Clasificación de piezas con grilla B/R/M/N/E  
✅ Overlay "Analizando con IA…" + issues IA  
✅ Campos "Descripción de Daños" + "Observaciones y Opinión del Riesgo"  
✅ Botón "Generar diagnóstico IA"  
✅ Banner de asegurabilidad (ASEGURABLE / NO ASEGURABLE)  
✅ Informe confidencial de daños  

## 6) Reglas de Asegurabilidad (minuta 05-05-2026)

```js
import { calcularAsegurabilidad } from 'src/data/mockData'
const { totalR, totalM, totalRM, asegurable } = calcularAsegurabilidad(photos)
```

- R + M ≥ 15 → **NO ASEGURABLE**
- R > 15 (solo regulares) → **NO ASEGURABLE**
- Todo B → **ASEGURABLE**
- R ≤ 15 y M = 0 → **ASEGURABLE**

## 7) Secuencias fotográficas

Definidas en `PHOTO_SEQUENCES` (`src/data/mockData.js`). Cada secuencia tiene:

- `id`, `nombre`, `descripcion`, `icon`, `diagramZone`
- `piezas[]` (obligatorias) + `piezasOpcionales[]`
- `excludeVehicleTypes[]` (`['Moto', 'Remolque']` para secuencias que no aplican)
- `requierePlaca` (boolean)

**12 secuencias** según minuta:
1. Frontal con Placa — `seq-frontal-placa` (excluye Moto/Remolque)
2. Frontal + Lateral Derecho — `seq-frontal-lat-der` (excluye Moto/Remolque)
3. Trasera con Placa — `seq-trasera-placa`
4. Trasera + Lateral Derecho — `seq-trasera-lat-der`
5. Frontal + Lateral Izquierdo — `seq-frontal-lat-izq`
6. Trasera + Lateral Izquierdo — `seq-trasera-lat-izq`
7. Impronta / Serial — `seq-serial`
8. Sistemas de Seguridad — `seq-seguridad`
9. Check Panel — `seq-tablero`
10. Tablero e Interior — `seq-interior`
11. Caucho de Repuesto — `seq-repuesto`
12. Daños Iniciales — `seq-danios`

## 8) Estructura de archivos clave

```
src/
├── components/
│   ├── layout/        # AppLayout, SideNav (navy), TopNav, BottomNav
│   └── ui/            # Brand, Icon, StatusChip, StatCard, Stepper, PageHeader
├── context/           # AuthContext, DataContext, ToastContext
├── data/mockData.js   # 12 secuencias, ROLES, calcularAsegurabilidad()
├── pages/
│   ├── inspection/    # Step1Documents..Step5Review, useInspectionState
│   └── *.jsx
└── services/api.js    # API client con JWT, fallback a mock
```

## 9) Estado del proyecto · contexto actualizado

- **Backend**: NestJS + Prisma + PostgreSQL en `backend/` (puerto 3001). Si falla, fallback automático a mock.
- **Auth**: JWT vía `api.auth.login(email, password)` con fallback a `mockData.users`.
- **Login mock**: cualquier email del mock data, password puede ser cualquier valor (la auth real está en backend).
- **Branch**: `master` (auto-push tras cambios)
- **Sidebar**: navy oficial `#091133 → #0F1A5A` con items activos en blanco
- **Fondo app**: gradiente sutil de marca (navy + rojo Imperial)

## 10) Checklist antes de cualquier cambio visual

- [ ] ¿Usé un color de la paleta oficial? (NO blue-500 genérico, NO red-500, etc.)
- [ ] ¿Funciona en 320px de ancho sin scrolls laterales?
- [ ] ¿Touch targets ≥ 44px?
- [ ] ¿Respeté la regla cliente vs perito?
- [ ] ¿No introduje un modal (preferir página/sección)?
- [ ] ¿Build pasa? (`npm run build`)
- [ ] ¿No usé `bg-white` plano si la card debería usar `.card`?
- [ ] ¿Z-index correcto si es sticky/fixed?

## 11) Comandos útiles (PowerShell)

```powershell
# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Liberar puerto 5173 si está en uso
$conn = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue
if ($conn) { $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force } }

# Limpiar cache Vite
Remove-Item -Recurse -Force "node_modules\.vite"

# Matar todos los procesos node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
```

## 12) Reglas DE ORO (no romper)

1. **NUNCA** mostrar IA/análisis/piezas/diagnóstico al rol `asegurado` o `intermediario`.
2. **NUNCA** crear modales — usar páginas dedicadas o secciones inline.
3. **NUNCA** usar colores fuera del manual (azul/rojo/plata oficiales).
4. **NUNCA** romper la responsividad — verificar siempre 320px, 768px, 1024px+.
5. **SIEMPRE** probar `npm run build` antes de pushear cambios estructurales.
6. **SIEMPRE** preservar accesibilidad (touch ≥ 44px, contraste AA, alt en imágenes).
7. **SIEMPRE** dejar el `bg` del body visible (NO bloquearlo con un wrapper opaco en AppLayout).
