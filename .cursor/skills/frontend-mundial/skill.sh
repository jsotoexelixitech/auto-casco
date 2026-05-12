#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# skill.sh — Frontend Mundial · Auto Casco
# Diagnóstico y utilidades del frontend La Mundial de Seguros
# Uso: bash .cursor/skills/frontend-mundial/skill.sh <comando>
# ─────────────────────────────────────────────────────────────────────────────

set -e
PROJECT_ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
cd "$PROJECT_ROOT"

cmd="${1:-help}"

color_check() {
  echo "🎨 Verificando uso de paleta oficial La Mundial…"
  local off_brand_count
  off_brand_count=$(grep -rE "bg-(blue|red|green|yellow|purple|pink|orange|indigo)-[0-9]" src/ --include="*.jsx" --include="*.js" | wc -l || true)
  echo "  → Tonos genéricos detectados: $off_brand_count (objetivo: 0 fuera de íconos semánticos)"
  echo ""
  echo "Brand tokens válidos:"
  echo "  primary, on-primary, accent-{50-900}, brand-{50-900}, brand-navy, brand-red, brand-silver, blue-{50-950}"
}

role_check() {
  echo "🔐 Verificando control de rol cliente/perito…"
  echo ""
  echo "Archivos con isPerito:"
  grep -rln "isPerito" src/ --include="*.jsx" || echo "  (ninguno)"
  echo ""
  echo "⚠️  Recordar: el cliente NO debe ver:"
  echo "  - Clasificación de piezas B/R/M/N/E"
  echo "  - Análisis IA / diagnóstico"
  echo "  - Banner de asegurabilidad"
  echo "  - Descripciones técnicas de daños"
}

responsive_check() {
  echo "📱 Auditoría de responsividad…"
  echo ""
  echo "Buscando potenciales scrolls laterales (overflow no controlado):"
  grep -rEn "overflow-x-(scroll|auto)" src/ --include="*.jsx" | head -20
  echo ""
  echo "Buscando touch targets pequeños:"
  grep -rEn "min-h-\[(3[0-9]|2[0-9])" src/ --include="*.jsx" | head -10 || echo "  ✓ No hay min-h con altura crítica"
}

dev_clean() {
  echo "🧹 Limpiando y arrancando dev server…"
  if [ -d "node_modules/.vite" ]; then rm -rf node_modules/.vite; echo "  ✓ cache vite limpiado"; fi
  echo "  → npm run dev en puerto 5173"
  npm run dev
}

build_check() {
  echo "🏗️  Build de verificación…"
  npm run build 2>&1 | tail -20
}

context() {
  echo "📚 Contexto del proyecto frontend"
  echo ""
  cat .cursor/skills/frontend-mundial/SKILL.md | head -80
}

show_help() {
  cat <<EOF
Frontend Mundial · skill.sh

Comandos disponibles:
  color-check       Verifica que la UI use solo colores de marca
  role-check        Lista uso de isPerito y recordatorios de rol
  responsive-check  Audita responsividad y touch targets
  dev               Limpia cache y arranca dev server
  build             Ejecuta npm run build
  context           Muestra resumen del SKILL.md
  help              Muestra esta ayuda

Ejemplo:
  bash .cursor/skills/frontend-mundial/skill.sh color-check
EOF
}

case "$cmd" in
  color-check)      color_check ;;
  role-check)       role_check ;;
  responsive-check) responsive_check ;;
  dev)              dev_clean ;;
  build)            build_check ;;
  context)          context ;;
  help|--help|-h|*) show_help ;;
esac
