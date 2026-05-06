import Icon from './Icon'

export default function EmptyState({ icon = 'inbox', title, body, action }) {
  return (
    <div className="card p-6 sm:p-8 flex flex-col items-center text-center gap-2">
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-brand-soft text-on-primary flex items-center justify-center shadow-elev-primary">
        <Icon name={icon} className="text-[28px] sm:text-[32px]" />
      </div>
      <h3 className="font-sans text-headline-md text-on-surface">{title}</h3>
      {body && (
        <p className="text-body-md text-on-surface-variant max-w-md">{body}</p>
      )}
      {action}
    </div>
  )
}
