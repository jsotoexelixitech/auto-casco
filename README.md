# La Mundial · Auto Casco — Inspección Digital

Aplicación web (React + Vite + Tailwind CSS v3) que digitaliza el módulo de **Inspección de Vehículos** de La Mundial de Seguros, integrándolo con flujos de **Emisión de Pólizas** y **Activación de Cobertura**.

Construida sobre el **Manual de Identidad oficial de La Mundial de Seguros** ("52 años contigo"):
- **Color Principal** · Azul Pennsylvania `#0F1A5A`
- **Color Secundario** · Rojo Imperial `#E84F51`
- **Color Terciario** · Plata `#ACACAC`
- **Tipografía Primaria** · Poppins
- **Wordmark** · Playfair Display Italic (sustituto web de Constantia Bold Italic)

Siguiendo la minuta funcional del 29-04-2026 de Miguel Azualde (Gerente de Automóvil) y Joelmis Materano (Coordinador de Procesos ExelixiTech).

> **Demo con datos de prueba** — ningún cambio se persiste contra una API real.

---

## Características principales

### Roles
- **Perito** (Arys auto, Gerentes, Ejecutivos, Perito) — gestión completa, validación de inspecciones, informes de daño confidenciales.
- **Asegurado / Intermediario** — auto-registro, compra de días, captura guiada.
- **Administrador** — alta de usuarios y peritos.

### Inspección de Vehículo (módulo principal)
Wizard de **5 pasos** que cubre la minuta:

1. **Documentos & OCR**
   - Cédula (V/E → Persona Natural) o RIF (J/G/C → Persona Jurídica).
   - Carnet de circulación con extracción automática de placa, marca, modelo, color, tipo, año, serial.
2. **Ubicación** — geolocalización automática para trazabilidad.
3. **Captura de fotos** — 12 secuencias panorámicas requeridas:
   - Frontal con placa · Frontal + lateral derecho · Trasera con placa · Trasera + lateral derecho · Frontal + lateral izquierdo · Trasera + lateral izquierdo · Seriales (body + troquelado) · Sistemas de seguridad · Check panel (kilometraje) · Tablero/asientos · Caucho de repuesto/gato/triángulo · Daños iniciales.
   - **Validación IA**: cada foto se analiza para detectar piezas y comparar la placa capturada vs. la del carnet.
   - **Clasificación** por pieza: **B** (Bueno), **R** (Regular), **M** (Malo) o **N/E** (No existe).
4. **Daños y Video 360°** — registro de daños con tipo/severidad/ubicación + carga del video 360° obligatorio.
5. **Revisión y envío** — resumen, informe de daños (visible solo al perito) e integración con Cotización/Emisión.

Tres flujos disponibles: **In-situ (Perito)**, **Asistida por Videollamada** y **Auto-Gestionable (Cliente)**.

### Otros módulos
- **Panel de Control** — KPIs, vehículo principal, uso mensual, actividad reciente.
- **Pólizas** — listado con filtros, detalle con coberturas e inspecciones.
- **Activación de Cobertura** — modalidad por días o por saldo, planes Básico/Estándar/Premium.
- **Emisión de Póliza** — wizard de 4 pasos (Datos · Coberturas · Cotización · Emisión).
- **Siniestros**, **Pagos** (recargas + historial), **Ayuda** con FAQ.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Build | **Vite 5** + ES Modules |
| UI | **React 18** |
| Estilos | **Tailwind CSS v3** + Design System tokens |
| Routing | **React Router DOM 6** |
| Estado | React Context (Auth · Data · Toast) |
| Iconografía | Material Symbols Outlined (CDN) |
| Tipografía | Poppins · Playfair Display (Google Fonts) |
| Mobile-first | BottomNav nativo · safe-area-inset · tipografía fluida con `clamp()` |
| Utilidades | `clsx` para clases condicionales |

---

## Estructura del proyecto

```
src/
├── components/
│   ├── layout/        SideNav, TopNav, AppLayout
│   └── ui/            Icon, Brand, StatusChip, StatCard, Stepper, PageHeader, EmptyState
├── context/
│   ├── AuthContext.jsx       Sesión + roles (persistido en localStorage)
│   ├── DataContext.jsx       Mock store (pólizas, vehículos, inspecciones, pagos)
│   └── ToastContext.jsx      Notificaciones globales
├── data/
│   └── mockData.js    Seed completo con OCR templates, secuencias, planes, etc.
├── pages/
│   ├── inspection/    Step1Documents · Step2Location · Step3Photos · Step4Damages · Step5Review
│   ├── DashboardPage.jsx
│   ├── PoliciesPage.jsx · PolicyDetailPage.jsx
│   ├── InspectionsListPage.jsx · InspectionWizardPage.jsx
│   ├── CoveragePage.jsx · EmissionPage.jsx
│   ├── SiniestrosPage.jsx · PaymentsPage.jsx
│   ├── HelpPage.jsx · LoginPage.jsx · NotFoundPage.jsx
├── App.jsx            Router + rutas protegidas
├── main.jsx           Bootstrap (StrictMode + Providers)
└── index.css          Tailwind + componentes custom + tipografías
```

---

## Cómo correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

### Inicio de sesión (demo)

En `/login` selecciona uno de los perfiles:

| Rol | Nombre |
|-----|--------|
| Perito | Miguel Azualde, Joelmis Materano |
| Asegurado | Carolina Rivas, Rodrigo Pérez |
| Administrador | Admin Sistema |

Cualquier contraseña es válida (es una demo).

---

## Próximos pasos (roadmap)

- Reemplazar mock data por API real (módulo de Cotización / Emisión / Suscripción).
- Persistencia con Zustand + IndexedDB para offline-first en captura.
- Integración real con cámara nativa y geolocalización del navegador.
- Pipeline de IA real (detección de piezas/daños) sobre las imágenes capturadas.
- Exportación PDF del informe de inspección y póliza.
- Tests E2E con Playwright sobre el wizard de inspección.

---

© 2026 La Mundial de Seguros · Desarrollado por ExelixiTech.
