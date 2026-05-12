# Frontend Mundial — Cursor Agent Skill

Este skill mantiene el contexto del frontend de Auto Casco · La Mundial de Seguros.

## Archivos

- **`SKILL.md`** — reglas, convenciones y paleta oficial (carga automática al editar `src/**`)
- **`context.md`** — snapshot del estado actual del proyecto, áreas sensibles
- **`skill.sh`** — utilidades CLI para diagnóstico (`color-check`, `role-check`, `responsive-check`, etc.)

## Cómo usarlo

Cursor cargará `SKILL.md` automáticamente cuando trabajes en archivos `src/**/*.{jsx,js,css}` o `tailwind.config.js`. El frontmatter del SKILL determina cuándo aplicar.

Para ejecutar utilidades del shell:

```powershell
# Auditar uso de colores fuera de marca
bash .cursor/skills/frontend-mundial/skill.sh color-check

# Verificar control de rol perito vs cliente
bash .cursor/skills/frontend-mundial/skill.sh role-check

# Auditoría responsiva
bash .cursor/skills/frontend-mundial/skill.sh responsive-check

# Limpiar cache vite y arrancar dev
bash .cursor/skills/frontend-mundial/skill.sh dev
```

## Reglas críticas

1. **Cliente ≠ Perito** — el cliente nunca ve análisis IA, piezas técnicas, diagnóstico
2. **Solo paleta oficial** — Azul Pennsylvania `#0F1A5A`, Rojo Imperial `#E84F51`, Plata
3. **Sin modales** — preferir páginas dedicadas o secciones inline
4. **Touch targets ≥ 44px**
5. **Responsive desde 320px** sin scrolls laterales
