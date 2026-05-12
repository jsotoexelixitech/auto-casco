import clsx from 'clsx'
import Icon from './Icon'

const TONE_BG = {
  // Colores sólidos del Manual de Identidad La Mundial (alineado con Suscripcion-rcv).
  primary: 'bg-primary text-on-primary',
  accent:  'bg-accent text-white',
  success: 'bg-success text-on-success',
  light:   'card text-on-surface',
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
  const dark = tone !== 'light'
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
            dark ? 'bg-white/15 backdrop-blur' : 'bg-primary-fixed text-primary',
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
