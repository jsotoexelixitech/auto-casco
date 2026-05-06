import clsx from 'clsx'

export function BrandLogo({ size = 40, className }) {
  return (
    <img
      src="/logo-isotipo-transparente.png"
      alt="La Mundial"
      width={size}
      height={size}
      className={clsx('object-contain shrink-0 select-none', className)}
      style={{ width: size, height: 'auto' }}
      draggable="false"
    />
  )
}

/**
 * Brand wordmark — "La Mundial / de Seguros"
 * Reproduces the official logotype using Playfair Display Italic
 * (web-safe substitute for Constantia Bold Italic) with small-caps.
 */
export function BrandWordmark({ size = 'md', tone = 'dark', className }) {
  const sizes = {
    xs: { primary: 'text-[12px]', secondary: 'text-[8px]' },
    sm: { primary: 'text-[15px]', secondary: 'text-[10px]' },
    md: { primary: 'text-[20px]', secondary: 'text-[12px]' },
    lg: { primary: 'text-[28px]', secondary: 'text-[14px]' },
    xl: { primary: 'text-[40px]', secondary: 'text-[18px]' },
  }
  const tones = {
    dark: { primary: 'text-primary', secondary: 'text-accent-500' },
    light: { primary: 'text-white', secondary: 'text-accent-400' },
    'on-primary': { primary: 'text-on-primary', secondary: 'text-accent-400' },
  }
  const s = sizes[size] || sizes.md
  const t = tones[tone] || tones.dark
  return (
    <div className={clsx('wordmark leading-tight select-none', className)}>
      <p
        className={clsx(s.primary, t.primary, 'tracking-tight font-bold italic')}
        style={{ fontVariantCaps: 'small-caps', fontFeatureSettings: '"smcp"' }}
      >
        La Mundial
      </p>
      <p className={clsx(s.secondary, t.secondary, 'italic font-medium tracking-wide -mt-1')}>
        de Seguros
      </p>
    </div>
  )
}

export function BrandLockup({ size = 'md', tone = 'dark', className, withLogo = true, logoSize }) {
  const logoSizes = { xs: 22, sm: 28, md: 36, lg: 44, xl: 64 }
  return (
    <div className={clsx('flex items-center gap-2.5', className)}>
      {withLogo && <BrandLogo size={logoSize ?? logoSizes[size] ?? 36} />}
      <BrandWordmark size={size} tone={tone} />
    </div>
  )
}
