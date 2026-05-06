# Changelog

Todos los cambios relevantes en este proyecto están documentados en este archivo.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es/1.0.0/)  
y el proyecto adhiere a [Versionado Semántico](https://semver.org/lang/es/).

---

## [1.0.0] — 2026-05-06

Versión inicial de producción. Plataforma completa de inspección digital de vehículos
para **La Mundial de Seguros** bajo la marca **Auto Casco**.

### Añadido

#### Autenticación y acceso por roles
- Login con selector visual de usuario (demo)
- 4 roles definidos: `admin`, `perito`, `asegurado`, `intermediario`
- Rutas protegidas con redirección automática
- Pantalla de bienvenida animada con la identidad de marca

#### Dashboard
- KPIs por rol: pólizas activas, días restantes, inspecciones en curso
- Tarjetas de vehículos del usuario con estado de cobertura
- Feed de actividad reciente (últimos 5 eventos)
- Accesos rápidos contextuales por rol

#### Inspección digital — Wizard 5 pasos
- **Paso 1 · Documentos**: carga de cédula, RIF y carnet de circulación con OCR simulado
- **Paso 2 · Ubicación**: captura automática de GPS, visualización de mapa y dirección
- **Paso 3 · Fotos**: 12 secuencias fotográficas con navegación por pill-carousel horizontal, validación IA simulada de placa y presencia de vehículo
- **Paso 4 · Daños**: clasificación de piezas (B/R/M/NE), comentarios por pieza, carga de video 360°
- **Paso 5 · Revisión**: resumen completo, aprobación de perito simulada y cierre de inspección
- Barra de progreso sticky para navegación entre pasos
- Validación de Perito in-app para inspecciones en estado de revisión

#### Pólizas
- Listado con filtros por estado y búsqueda libre
- Vista de tarjetas en móvil / tabla en desktop
- Detalle completo con coberturas, resumen financiero e inspecciones asociadas
- Descarga de póliza en PDF (generado sin librerías externas)
- Compartir con Web Share API nativo + fallback a clipboard

#### Cobertura
- Selector de planes (Básico, Estándar, Premium) con comparador
- Calculadora de precio por número de días
- Activación instantánea con confirmación de compra
- Resumen de cobertura y próximos vencimientos

#### Emisión de póliza
- Wizard de 4 pasos: tipo de persona, datos del vehículo, plan y confirmación
- Validación por paso antes de avanzar

#### Siniestros
- Listado de siniestros en tarjetas con barra de progreso
- **Reportar siniestro**: modal con tipo, severidad (leve/moderado/grave), fecha, hora, lugar, descripción, heridos y notificación a autoridades
- **Detalle de siniestro**: timeline de 4 fases, resumen financiero (monto, deducible, a pagar), perito asignado, datos del vehículo
- Descarga de reporte de siniestro en PDF

#### Pagos
- Recarga de saldo con quick-picks ($20/$50/$100/$200)
- Historial de movimientos en tabla (desktop) y tarjetas (móvil)
- **Métodos de pago**: lista, marcar como principal, eliminar
- **Agregar método**: tarjeta con vista previa animada y detección de marca, transferencia bancaria, Pago Móvil
- Estadísticas: total de movimientos, ingresos y egresos

#### Perfil (`/perfil`)
- Tarjeta de usuario con estadísticas (pólizas, vehículos, inspecciones)
- Formulario editable: nombre, documento, email, teléfono, fecha de nacimiento, dirección
- Sección de seguridad: cambio de contraseña, 2FA, sesiones activas

#### Configuración (`/configuracion`)
- 5 secciones: Preferencias, Notificaciones, Privacidad, Idioma/región, Datos y cuenta
- Toggles para push, email, SMS, marketing, biométrico y ubicación
- Selectores de tema (claro/oscuro/auto), densidad, idioma, moneda y zona horaria
- Exportar datos, limpiar caché, eliminar cuenta (bloqueada en demo)

#### Ayuda (`/ayuda`)
- **Chat en vivo** con asistente Sofía: respuestas contextuales, indicador de typing, quick-replies
- **Videollamada con perito**: formulario de agenda, confirmación con enlace de sala simulado
- Llamada 24/7: `tel:` nativo al número real
- 6 preguntas frecuentes expandibles
- Formulario de contacto con loading state

#### Búsqueda global
- Paleta abierta con `Cmd+K` / `Ctrl+K` desde cualquier página
- Búsqueda en tiempo real sobre pólizas, inspecciones y siniestros
- Sin texto: acciones rápidas (nueva inspección, comprar días, recargar, reportar, ayuda)
- Navegación directa al detalle del resultado

#### Notificaciones
- Click en cada notificación navega a la sección relevante
- "Marcar todas como leídas" en un clic
- Badge con contador de no leídas

#### TopNav mejorado
- Menú de perfil con navegación a `/perfil`, `/configuracion`, `/ayuda` y logout
- Campo de búsqueda en desktop con atajo de teclado visible

#### Responsividad total
- `BottomNav` exclusivo para móvil con FAB central "Inspectar"
- `SideNav` como drawer en móvil, sidebar fijo en desktop
- Tablas transformadas en tarjetas en pantallas pequeñas
- Tipografía fluida con `clamp()` en todos los tokens
- Cero scroll horizontal en cualquier resolución
- Touch targets ≥ 44px en todos los elementos interactivos
- Soporte para `safe-area-inset` en dispositivos con notch

#### Identidad visual La Mundial de Seguros
- Paleta oficial: Azul Pennsylvania `#0F1A5A`, Rojo Imperial `#E84F51`, Plata `#ACACAC`
- Tipografía: Poppins (UI) + Playfair Display Italic (wordmark)
- Gradientes de marca en botones, fondos hero y tarjetas destacadas
- Sombras semánticas: `elev-primary`, `elev-accent`, `elev-1`, `elev-2`
- Componente `BrandWordmark` con small-caps y cursiva según manual de identidad

#### Infraestructura
- Build de producción con Vite 8
- PM2 para gestión de procesos (producción y desarrollo)
- Cloudflare Tunnel para exposición pública sin servidor dedicado
- Script `start-dev.sh` para inicio en un solo comando
- `DEPLOY.md` con guía completa de despliegue

#### Documentación
- `README.md` completo con arquitectura, stack, usuarios de prueba y hoja de ruta
- `DEPLOY.md` con instrucciones de producción y desarrollo
- `CONTRIBUTING.md` con guía de contribución
- `SECURITY.md` con política de divulgación responsable
- `CODE_OF_CONDUCT.md` (Contributor Covenant v2.1)
- `CHANGELOG.md` (este archivo)
- `LICENSE` MIT

### Datos de prueba incluidos
- 5 usuarios con 4 roles distintos
- 3 vehículos (Toyota RAV4, Honda Civic, Ford Explorer)
- 3 pólizas (activas e inactivas)
- 4 inspecciones en distintos estados
- 3 siniestros con avances distintos
- 4 pagos de historial
- 3 notificaciones (2 no leídas)
- 5 actividades recientes
- 2 métodos de pago pre-cargados
- Templates OCR simulados para cédula, RIF y carnet

---

## [Unreleased]

Ver [`roadmap`](README.md#-hoja-de-ruta) para las próximas versiones planificadas.
