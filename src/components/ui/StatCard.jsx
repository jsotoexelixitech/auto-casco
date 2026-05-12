import clsx from 'clsx'
import Icon from './Icon'

const TONE_BG = {
  // ──────────────────────────────────────────────────────────────────────
  // 100% Manual de Identidad — La Mundial de Seguros
  // El manual sólo usa Azul Pennsylvania + Rojo Imperial (y sus shades).
  // La jerarquía se expresa con la INTENSIDAD del azul.
  // ──────────────────────────────────────────────────────────────────────
  deep:    'bg-deep text-on-deep',                // #091133 Navy Deep — KPI maestro / total general
  primary: 'bg-primary text-on-primary',          // #0F1A5A Azul Pennsylvania — KPI principal
  info:    'bg-info text-on-info',                // #162A7F Azul Pennsylvania medio — KPI secundario / "en proceso"
  accent:  'bg-accent text-white',                // #E84F51 Rojo Imperial — sólo CTA crítica / egresos / atención
  // Tonos de UI semántica (chips/badges, no para KPI dominantes)
  success: 'bg-white text-on-surface ring-1 ring-success/40',  // estado positivo (outline, sin fondo agresivo)
  warning: 'bg-white text-on-surface ring-1 ring-warning/50',  // estado advertencia (outline)
  light:   'card text-on-surface',
}

const DARK_TONES = new Set(['deep', 'primary', 'info', 'accent'])
const OUTLINE_TONES = {
  success: { ring: 'text-success', iconBg: 'bg-success-container text-success' },
  warning: { ring: 'text-warning', iconBg: 'bg-warning-container text-warning' },
}

export default function StatCard({
  label,
  value,
  icon,
  tone = 'light',
  trend,
  hint,
  onClick,
}) {
  const dark = DARK_TONES.has(tone)
  const outline = OUTLINE_TONES[tone]
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'p-4 sm:p-5 rounded-xl text-left w-full group transition-all min-w-0 active:scale-[0.99]',
        TONE_BG[tone],
        onClick && 'hover:scale-[1.01] hover:shadow-elev-2 cursor-pointer',
        !onClick && 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className={clsx(
            'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0',
            dark
              ? 'bg-white/15 backdrop-blur'
              : outline
                ? outline.iconBg
                : 'bg-primary-fixed text-primary',
          )}
        >
          <Icon name={icon} className="text-[22px]" filled />
        </div>
        {trend && (
          <span
            className={clsx(
              'inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
              dark ? 'bg-white/15' : 'bg-success-container text-on-success-container',
            )}
          >
            <Icon
              name={trend.dir === 'up' ? 'trending_up' : 'trending_down'}
              className="text-[12px]"
            />
            {trend.value}
          </span>
        )}
      </div>
      <p
        className={clsx(
          'text-[10px] sm:text-caption uppercase tracking-wider mb-0.5 font-bold leading-tight',
          dark ? 'opacity-80' : 'text-on-surface-variant',
        )}
      >
        {label}
      </p>
      <p className="font-sans text-headline-lg leading-none truncate font-bold">
        {value}
      </p>
      {hint && (
        <p
          className={clsx(
            'text-[11px] sm:text-caption mt-1 truncate',
            dark ? 'opacity-70' : 'text-on-surface-variant',
          )}
        >
          {hint}
        </p>
      )}
    </button>
  )
}
