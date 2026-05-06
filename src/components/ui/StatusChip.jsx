import clsx from 'clsx'
import Icon from './Icon'

const TONES = {
  primary: 'bg-primary-fixed text-on-primary-fixed border border-primary/20',
  accent: 'bg-secondary-fixed text-on-secondary-fixed-variant border border-accent-500/30',
  success:
    'bg-success-container text-on-success-container border border-success/20',
  error: 'bg-error-container text-on-error-container border border-error/20',
  warning:
    'bg-warning-container text-on-warning-container border border-warning/20',
  neutral:
    'bg-surface-container-high text-on-surface-variant border border-outline-variant',
}

const STATUS_TONE_MAP = {
  Activa: 'success',
  Inactiva: 'error',
  'En Progreso': 'primary',
  'Pendiente de Validación': 'warning',
  'Pendiente Cliente': 'warning',
  Aprobada: 'success',
  Rechazada: 'error',
  'En Análisis': 'warning',
  Cerrado: 'neutral',
  Aprobado: 'success',
  Completado: 'success',
}

const STATUS_ICON_MAP = {
  Activa: 'verified',
  Inactiva: 'timer_off',
  'En Progreso': 'autorenew',
  'Pendiente de Validación': 'rule',
  'Pendiente Cliente': 'pending',
  Aprobada: 'task_alt',
  Rechazada: 'cancel',
  'En Análisis': 'pending_actions',
  Cerrado: 'lock',
  Aprobado: 'task_alt',
  Completado: 'task_alt',
}

export default function StatusChip({
  status,
  tone,
  icon,
  children,
  dot = true,
  className,
  size = 'md',
}) {
  const _tone = tone ?? STATUS_TONE_MAP[status] ?? 'neutral'
  const _icon = icon ?? STATUS_ICON_MAP[status]
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-caption',
        TONES[_tone],
        className,
      )}
    >
      {dot && !_icon && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {_icon && <Icon name={_icon} className="text-[14px]" filled />}
      {children ?? status}
    </span>
  )
}
