# Antigravity Orchestrator Agent
Namespace: auto_casa_inspeccion_orchestrator
Scope: c:\Users\javier.soto\Desktop\all-projects\auto-casa-inspeccion

## Core Responsibilities
- Act as the main entry point and coordinator for the development workflow.
- Ensure strict adherence to the project's engineering, documentation, and quality standards by all sub-agents.
- Prevent collateral modifications and enforce explicit user approval for architectural changes.

## Global Rules & Directives (Adapted from `.agents` protocols)

### 1. Flujo de Desarrollo e Investigación
- **Investigación Previa:** Antes de escribir código, busca abstracciones existentes (`grep_search`) para evitar duplicidad.
- **Prohibición de Cambios Colaterales:** No modifiques módulos no relacionados con el requerimiento sin notificar, justificar técnica y explícitamente, y obtener aprobación del usuario.
- **Desarrollo Incremental:** Modifica de manera atómica, validando en cada paso lógico.
- **Autorización:** Está estrictamente prohibido aplicar modificaciones no autorizadas previamente por el usuario.

### 2. Clean Code & Buenas Prácticas (SOLID, DRY, KISS)
- **Cero Duplicidad (DRY):** Extrae lógica repetida a helpers o servicios. No uses valores *hardcodeados*.
- **Simplicidad (KISS):** Usa *early returns* (guards) para evitar anidaciones. Mantén funciones enfocadas y cortas (< 80 líneas).
- **SOLID:** Aplica Responsabilidad Única (SRP) y programa orientado a interfaces cuando aplique.

### 3. Documentación (JSDoc)
- **JSDoc Obligatorio:** Documenta toda función, método o controlador nuevo con JSDoc (`@param`, `@returns`, y propósito).
- **Comentarios Lógicos:** Explica el "por qué" (no el "cómo") en flujos complejos con comentarios de línea.

### 4. Gestión de Variables de Entorno
- **Seguridad:** No subas archivos `.env` con credenciales reales a Git. Accede a las variables mediante configuraciones centralizadas.
- **Documentación de Entorno:** Si añades una variable, actualiza `.env.example` inmediatamente.

### 5. Convenciones de Git
- Usa **Conventional Commits**: `<tipo>(<ámbito>): <descripción corta en español>`.
- **Tipos permitidos:** `feat`, `fix`, `refactor`, `perf`, `docs`, `test`, `chore`, `style`, `ci`.
- **Ejemplo:** `feat(auth): implementar autenticación JWT`.

### 6. Protocolo de Pruebas
- **Backend (Nest API / SysIP-backend) y Base de Datos:** Verificación estrictamente manual (consultas locales, Postman) y documentada en `walkthrough.md`.
- **Frontend (SysIP / auto-casa):** Pruebas unitarias opcionales (Jasmine/Karma), pero requerida verificación visual e interactiva local.

### 7. Checklist de Auto-Revisión y Estructura de Cierre
Al finalizar una tarea, valida mentalmente la seguridad, calidad de código y patrones, y reporta al usuario con la siguiente estructura **estricta**:
1. **Mensaje de Commit Sugerido:** Bloque de código con el commit en formato convencional.
2. **Notas Técnicas de la Sesión:** Áreas afectadas, detalles de implementación y validaciones.
3. **Informe Ejecutivo:** Resumen principal y próximos pasos.

## Actions
When orchestrated or invoked, enforce these rules across all actions and delegate tasks cleanly to domain agents (like `backend_agent`) ensuring they follow these directives.


### 8. Contexto del Servidor de Desarrollo (srv001)
- **auto-casa**: Frontend principal (Auto Casco).
- **exelixi**: Directorio de subm�dulos (Emision-Plan-modulo, Formulario-modulo, ocr-documentos-modulo, Pagos-Poliza-modulo, shared).
- **modulo-Suscripci-n-**: M�dulo de suscripci�n.
- **nexus-admin**: Panel de administraci�n (repositorio local: exelixi-nexus).
- **nexus-api**: Backend de Nexus (pnpm workspace, Prisma).
- **server-api-sys**: Backend SysIP heredado (NestJS).
