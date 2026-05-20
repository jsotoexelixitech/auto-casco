import clsx from 'clsx'
import Icon from './Icon'

export default function Stepper({ steps, current = 0, onStepClick, flat = false }) {
  return (
    <div className={flat ? 'py-2' : 'card p-3 sm:p-4'}>
      {/* Mobile: compact "x of n" + label */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-caption font-bold text-on-surface-variant uppercase tracking-wider">
            Paso {current + 1} / {steps.length}
          </span>
          <span className="text-caption font-bold text-primary">
            {Math.round(((current + 1) / steps.length) * 100)}%
          </span>
        </div>
        <div className="relative h-2 bg-surface-container rounded-full overflow-hidden mb-2">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-accent rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
        <p className="text-label-md text-primary font-semibold">
          {steps[current].label}
        </p>
      </div>

      {/* Desktop: full visual stepper */}
      <ol className="hidden sm:flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
        {steps.map((step, i) => {
          const status = i < current ? 'done' : i === current ? 'active' : 'pending'
          const interactive = i <= current && onStepClick
          return (
            <li
              key={step.id ?? i}
              className="flex-1 flex items-center min-w-fit"
            >
              <button
                type="button"
                disabled={!interactive}
                onClick={() => interactive && onStepClick(i)}
                className={clsx(
                  'flex flex-col items-center gap-1 px-1 transition group',
                  interactive && 'cursor-pointer',
                )}
              >
                <div
                  className={clsx(
                    'w-9 h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-label-md font-bold ring-4 ring-white transition-all',
                    status === 'done' && 'bg-gradient-accent text-on-secondary-container',
                    status === 'active' &&
                      'bg-gradient-brand-soft text-on-primary shadow-elev-primary',
                    status === 'pending' &&
                      'bg-surface-container text-on-surface-variant border border-outline-variant',
                  )}
                >
                  {status === 'done' ? (
                    <Icon name="check" className="text-[18px]" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={clsx(
                    'text-[11px] lg:text-caption text-center px-1 leading-tight max-w-[100px] line-clamp-2',
                    status === 'active' && 'text-primary font-semibold',
                    status === 'done' && 'text-on-surface',
                    status === 'pending' && 'text-on-surface-variant',
                  )}
                >
                  {step.label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div
                  className={clsx(
                    'flex-1 h-0.5 mx-1 rounded-full',
                    i < current ? 'bg-accent-500' : 'bg-outline-variant',
                  )}
                />
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
