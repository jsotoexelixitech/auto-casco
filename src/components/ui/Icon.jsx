import clsx from 'clsx'

export default function Icon({ name, filled = false, className, style, ...rest }) {
  return (
    <span
      className={clsx('msym', filled && 'filled', className)}
      style={{
        fontSize: 'inherit',
        ...style,
      }}
      aria-hidden
      {...rest}
    >
      {name}
    </span>
  )
}
