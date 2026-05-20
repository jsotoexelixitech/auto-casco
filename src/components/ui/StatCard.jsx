import clsx from 'clsx'
import Icon from './Icon'

/**
 * StatCard — rediseño fintech moderno
 *
 * Paleta La Mundial (Manual de Identidad):
 *   navy  #0F1A5A · deep #091133 · soft #162A7F
 *   red   #E84F51 · dark #B23F44
 *   silver #ACACAC · dark #777777 · light #DDDDDD
 *
 * Enfoque: fondo tint claro + borde izq sólido + valor en color brand.
 * Sin fondos oscuros pesados. Legible en todas las resoluciones.
 */

const TONES = {
  navy: {
    border: '#0F1A5A',
    bg: '#EEF0FA',
    icon: '#0F1A5A',
    iconBg: '#D8DCF2',
    value: '#0F1A5A',
    label: '#5A6080',
    trend: { bg: '#D8DCF2', fg: '#0F1A5A' },
  },
  'navy-deep': {
    border: '#091133',
    bg: '#E8EAF4',
    icon: '#091133',
    iconBg: '#CDD1E8',
    value: '#091133',
    label: '#4A4E6A',
    trend: { bg: '#CDD1E8', fg: '#091133' },
  },
  'navy-soft': {
    border: '#162A7F',
    bg: '#EFF1FA',
    icon: '#162A7F',
    iconBg: '#D5DAF5',
    value: '#162A7F',
    label: '#5A6080',
    trend: { bg: '#D5DAF5', fg: '#162A7F' },
  },
  red: {
    border: '#E84F51',
    bg: '#FEF0F0',
    icon: '#E84F51',
    iconBg: '#FCDADA',
    value: '#B23F44',
    label: '#9A5555',
    trend: { bg: '#FCDADA', fg: '#B23F44' },
  },
  'red-dark': {
    border: '#B23F44',
    bg: '#FAECEC',
    icon: '#B23F44',
    iconBg: '#F5D5D6',
    value: '#B23F44',
    label: '#8A4848',
    trend: { bg: '#F5D5D6', fg: '#B23F44' },
  },
  silver: {
    border: '#ACACAC',
    bg: '#F5F5F5',
    icon: '#777777',
    iconBg: '#E4E4E4',
    value: '#555555',
    label: '#888888',
    trend: { bg: '#E4E4E4', fg: '#555555' },
  },
  'silver-dark': {
    border: '#777777',
    bg: '#EFEFEF',
    icon: '#555555',
    iconBg: '#DCDCDC',
    value: '#444444',
    label: '#777777',
    trend: { bg: '#DCDCDC', fg: '#444444' },
  },
  // alias para compatibilidad
  deep: {
    border: '#091133',
    bg: '#E8EAF4',
    icon: '#091133',
    iconBg: '#CDD1E8',
    value: '#091133',
    label: '#4A4E6A',
    trend: { bg: '#CDD1E8', fg: '#091133' },
  },
  primary: {
    border: '#0F1A5A',
    bg: '#EEF0FA',
    icon: '#0F1A5A',
    iconBg: '#D8DCF2',
    value: '#0F1A5A',
    label: '#5A6080',
    trend: { bg: '#D8DCF2', fg: '#0F1A5A' },
  },
  accent: {
    border: '#E84F51',
    bg: '#FEF0F0',
    icon: '#E84F51',
    iconBg: '#FCDADA',
    value: '#B23F44',
    label: '#9A5555',
    trend: { bg: '#FCDADA', fg: '#B23F44' },
  },
}

const DEFAULT_TONE = TONES.navy

export default function StatCard({ label, value, icon, tone = 'navy', trend, hint, onClick }) {
  const t = TONES[tone] ?? DEFAULT_TONE

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        backgroundColor: t.bg,
        borderLeft: `4px solid ${t.border}`,
        color: '#091133',
      }}
      className={clsx(
        'p-3 sm:p-4 rounded-xl text-left w-full transition-all min-w-0 active:scale-[0.98]',
        'shadow-elev-1 border-t border-r border-b border-outline-variant/30',
        onClick ? 'hover:brightness-[0.96] hover:shadow-elev-2 cursor-pointer' : 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between mb-2.5">
        <div
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: t.iconBg, color: t.icon }}
        >
          <Icon name={icon} className="text-[22px]" filled />
        </div>
        {trend && (
          <span
            className="inline-flex items-center gap-0.5 text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
            style={{ backgroundColor: t.trend.bg, color: t.trend.fg }}
          >
            <Icon name={trend.dir === 'up' ? 'trending_up' : 'trending_down'} className="text-[12px]" />
            {trend.value}
          </span>
        )}
      </div>
      <p
        className="text-[10px] sm:text-caption uppercase tracking-wider mb-0.5 font-bold leading-tight"
        style={{ color: t.label }}
      >
        {label}
      </p>
      <p className="font-sans text-headline-lg leading-none truncate font-bold" style={{ color: t.value }}>
        {value}
      </p>
      {hint && (
        <p className="text-[11px] sm:text-caption mt-1 truncate" style={{ color: t.label }}>
          {hint}
        </p>
      )}
    </button>
  )
}
