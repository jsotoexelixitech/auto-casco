# Guía de Contribución

¡Gracias por tu interés en mejorar **Auto Casco · Inspección Digital**!  
Este documento describe el proceso para contribuir de forma efectiva y respetuosa.

---

## Tabla de contenidos

- [Código de conducta](#código-de-conducta)
- [¿Por dónde empezar?](#por-dónde-empezar)
- [Reportar un error](#reportar-un-error)
- [Solicitar una función](#solicitar-una-función)
- [Configurar el entorno de desarrollo](#configurar-el-entorno-de-desarrollo)
- [Convenciones de código](#convenciones-de-código)
- [Convenciones de commits](#convenciones-de-commits)
- [Flujo de trabajo con ramas](#flujo-de-trabajo-con-ramas)
- [Proceso de Pull Request](#proceso-de-pull-request)
- [Revisión de código](#revisión-de-código)
- [Preguntas frecuentes](#preguntas-frecuentes)

---

## Código de conducta

Este proyecto y todos sus participantes están regidos por el [Código de Conducta](CODE_OF_CONDUCT.md).  
Al participar, aceptas respetar sus términos.

---

## ¿Por dónde empezar?

- Revisa los [issues abiertos](https://github.com/jsotoexelixitech/auto-casa/issues) para ver qué necesita ayuda.
- Los issues etiquetados con `good first issue` son ideales para empezar.
- Los etiquetados con `help wanted` tienen prioridad.
- Si quieres implementar algo que no está en los issues, [abre uno primero](#solicitar-una-función) para validar la idea.

---

## Reportar un error

Antes de reportar, verifica que el error no haya sido reportado ya.

Al abrir el issue, incluye:

1. **Título claro y conciso**: `[Bug] El wizard de inspección se congela en el paso 3 en iOS Safari`
2. **Descripción del problema**
3. **Pasos para reproducir** (numerados)
4. **Comportamiento esperado** vs **comportamiento actual**
5. **Capturas de pantalla** o **video** (si aplica)
6. **Entorno**: SO, navegador, versión, tamaño de pantalla
7. **Consola de DevTools**: copia cualquier error relevante

---

## Solicitar una función

1. Abre un issue con el prefijo `[Feature Request]`
2. Describe **el problema que resuelve** (no solo la solución)
3. Propón una posible implementación si tienes idea de cómo
4. Espera retroalimentación del equipo antes de implementar

---

## Configurar el entorno de desarrollo

### Prerrequisitos

- Node.js ≥ 20 LTS
- npm ≥ 10
- Git

### Pasos

```bash
# 1. Fork en GitHub, luego clona tu fork
git clone https://github.com/TU-USUARIO/auto-casa.git
cd auto-casa

# 2. Agrega el upstream para mantenerte sincronizado
git remote add upstream https://github.com/jsotoexelixitech/auto-casa.git

# 3. Instala dependencias
npm install

# 4. Inicia el servidor de desarrollo
npm run dev
# → http://localhost:5173
```

### Sincronizar con upstream

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

---

## Convenciones de código

### JavaScript / JSX

- **ES Modules** — siempre `import/export`, nunca `require`
- **React funcional** — sin clases
- **Hooks** — `useState`, `useEffect`, `useMemo`, etc.
- **Props**: camelCase; evita destructuring en línea si hay más de 3 props
- **Nombres**: componentes en PascalCase, funciones/variables en camelCase
- No usar `any` implícito — si un valor puede ser `null`, valídalo antes de usarlo
- Evitar comentarios obvios; solo documenta *por qué*, no *qué*

### CSS / Tailwind

- Clases utilitarias de Tailwind en línea; componentes complejos en `index.css` bajo `@layer components`
- Nunca hardcodear colores — usar tokens del tema (`text-primary`, `bg-accent`, etc.)
- Mobile-first: base = móvil, luego `sm:`, `md:`, `lg:`
- Touch targets mínimos: `min-h-[44px]` para todos los elementos interactivos

### Estructura de archivos

- Un componente por archivo
- Archivos de página en `src/pages/`
- Componentes reutilizables en `src/components/ui/`
- Componentes de layout en `src/components/layout/`
- Lógica de negocio en `src/context/` o `src/utils/`

---

## Convenciones de commits

Seguimos **Conventional Commits** ([spec](https://www.conventionalcommits.org/)):

```
<tipo>(<alcance>): <descripción corta en imperativo>

[cuerpo opcional]

[pie opcional: BREAKING CHANGE o refs a issues]
```

### Tipos permitidos

| Tipo | Uso |
|---|---|
| `feat` | Nueva funcionalidad |
| `fix` | Corrección de error |
| `docs` | Solo documentación |
| `style` | Cambios de formato (sin lógica) |
| `refactor` | Refactoring (sin nueva feature ni bugfix) |
| `perf` | Mejora de rendimiento |
| `test` | Añadir o corregir tests |
| `chore` | Tareas de mantenimiento (dependencias, config) |
| `ci` | Cambios en CI/CD |

### Ejemplos

```
feat(siniestros): agregar modal de reporte con timeline de seguimiento

fix(topnav): corregir cierre del menú al hacer click fuera en iOS Safari

docs(readme): agregar sección de variables de entorno y bases legales

perf(step3photos): optimizar re-renders del carousel de secuencias
```

---

## Flujo de trabajo con ramas

```
main          ← producción estable (protegida, requiere PR)
  └── develop ← integración de features (base para PRs)
        ├── feat/global-search
        ├── feat/payment-methods-modal
        ├── fix/inspection-wizard-ios-crash
        └── docs/contributing-guide
```

### Nombramiento de ramas

```
feat/<descripcion-corta>       # nueva funcionalidad
fix/<descripcion-corta>        # corrección de error
docs/<descripcion-corta>       # documentación
chore/<descripcion-corta>      # mantenimiento
hotfix/<descripcion-corta>     # corrección urgente en producción
```

---

## Proceso de Pull Request

1. **Crea tu rama** desde `develop` (no desde `main`)
2. **Implementa** tus cambios siguiendo las convenciones
3. **Verifica** que el lint y el build pasen:
   ```bash
   npm run lint
   npm run build
   ```
4. **Actualiza** el `CHANGELOG.md` bajo `[Unreleased]` si aplica
5. **Abre el PR** contra `develop` con:
   - Título en formato Conventional Commits
   - Descripción: qué cambia, por qué, cómo probarlo
   - Screenshots / videos si hay cambios visuales
   - Referencia al issue: `Closes #123`
6. **Responde** los comentarios de revisión en < 48h

### Checklist del PR

```markdown
- [ ] El código sigue las convenciones del proyecto
- [ ] `npm run lint` pasa sin errores
- [ ] `npm run build` pasa sin errores
- [ ] Los cambios visuales se ven bien en móvil y desktop
- [ ] CHANGELOG.md actualizado (si aplica)
- [ ] Issue relacionado referenciado (si aplica)
```

---

## Revisión de código

Los mantenedores revisarán el PR en un plazo de 3 días hábiles.  
El PR puede ser:

- ✅ **Aprobado y mergeado** directamente
- 💬 **Aprobado con cambios menores** (el autor puede mergear tras resolverlos)
- 🔄 **Cambios solicitados** (el autor debe responder y solicitar re-revisión)
- ❌ **Cerrado** con explicación (no se adapta a la hoja de ruta o convenciones)

---

## Preguntas frecuentes

**¿Puedo contribuir si no tengo experiencia con React?**  
¡Sí! Hay tareas de documentación, traducción, diseño y testing que no requieren código React.

**¿Cómo puedo agregar datos de prueba?**  
Edita `src/data/mockData.js`. Sigue el mismo formato de los objetos existentes.

**¿Puedo proponer cambios al design system?**  
El design system sigue el Manual de Identidad de La Mundial de Seguros, por lo que los colores y tipografía base no son negociables. Sin embargo, se aceptan mejoras de accesibilidad, densidad y UX.

---

¿Tienes dudas? Abre un issue con la etiqueta `question` o escribe a  
[joelmis.materano@exelixitech.com](mailto:joelmis.materano@exelixitech.com)
