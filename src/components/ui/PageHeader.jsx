import { Link } from 'react-router-dom'
import Icon from './Icon'

export default function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  eyebrow,
}) {
  return (
    <header className="mb-5 sm:mb-6 md:mb-7 flex flex-col md:flex-row md:items-end md:justify-between gap-3 md:gap-4">
      <div className="min-w-0 flex-1">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center text-caption text-on-surface-variant mb-1.5 flex-wrap">
            {breadcrumbs.map((b, i) => (
              <span key={i} className="flex items-center min-w-0">
                {i > 0 && (
                  <Icon name="chevron_right" className="text-[14px] mx-0.5 shrink-0" />
                )}
                {b.to ? (
                  <Link to={b.to} className="hover:text-primary transition truncate max-w-[150px] sm:max-w-none">
                    {b.label}
                  </Link>
                ) : (
                  <span className="text-on-surface truncate max-w-[180px] sm:max-w-none">
                    {b.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        )}
        {eyebrow && (
          <p className="text-[11px] sm:text-caption text-accent-500 uppercase tracking-widest mb-1 font-bold">
            {eyebrow}
          </p>
        )}
        <h1 className="font-sans text-display-lg text-primary leading-tight tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-body-md sm:text-body-lg text-on-surface-variant mt-1 max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">{actions}</div>
      )}
    </header>
  )
}
