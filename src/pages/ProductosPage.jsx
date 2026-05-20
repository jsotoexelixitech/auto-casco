import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../components/ui/Icon'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../theme/tokens'

const PRODUCTS = [
  {
    id: 'vehiculos',
    label: 'Vehículos',
    subtitle: 'Auto Casco',
    tagline: 'Asegura tu auto con IA en 5 min',
    description: 'Inspección vehicular con IA · Plan de seguro personalizado según el estado real de tu vehículo.',
    icon: 'directions_car_filled',
    image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80',
    overlay: 'linear-gradient(135deg, rgba(15,26,90,0.92) 0%, rgba(59,79,180,0.78) 50%, rgba(15,26,90,0.55) 100%)',
    accentColor:  BRAND.navy,
    benefits: [
      { icon: 'auto_awesome',  text: 'Análisis con Gemini Vision' },
      { icon: 'shield',        text: 'Cobertura Amplia / Pérdida Total' },
      { icon: 'receipt_long',  text: 'Emisión en minutos' },
    ],
    priceFrom: 'Desde $0.89/día',
    badge: 'Disponible',
    badgeBg: '#DCFCE7',
    badgeFg: '#16A34A',
    sparkles: ['auto_awesome', 'shield_with_heart'],
    active: true,
    to: '/inspecciones/nueva',
  },
  {
    id: 'salud',
    label: 'Salud Tradicional',
    subtitle: 'Cobertura Médica',
    tagline: 'Protege a quienes amas',
    description: 'Atención médica, hospitalización, cirugías y medicamentos. Protege a toda tu familia.',
    icon: 'health_and_safety',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    overlay: 'linear-gradient(135deg, rgba(232,79,81,0.92) 0%, rgba(248,113,113,0.78) 50%, rgba(232,79,81,0.55) 100%)',
    accentColor:  '#E84F51',
    benefits: [
      { icon: 'local_hospital',  text: 'Hospitalización cubierta' },
      { icon: 'medication',      text: 'Medicamentos incluidos' },
      { icon: 'family_restroom', text: 'Cobertura familiar' },
    ],
    priceFrom: 'Desde $35/mes',
    badge: 'Nuevo',
    badgeBg: '#FEE2E2',
    badgeFg: '#9F1239',
    sparkles: ['medical_services', 'favorite'],
    active: true,
    to: '/salud-tradicional',
  },
  {
    id: 'recarga',
    label: 'Recarga de Saldo',
    subtitle: 'Billetera Digital',
    tagline: 'Recarga al instante',
    description: 'Recarga tu saldo y paga tus primas de forma sencilla desde cualquier dispositivo.',
    icon: 'account_balance_wallet',
    image: 'https://images.unsplash.com/photo-1556742502-ec7c0e9f34b1?auto=format&fit=crop&w=1200&q=80',
    overlay: 'linear-gradient(135deg, rgba(13,148,136,0.92) 0%, rgba(20,184,166,0.78) 50%, rgba(13,148,136,0.55) 100%)',
    accentColor:  '#0D9488',
    benefits: [
      { icon: 'bolt',        text: 'Recarga instantánea' },
      { icon: 'credit_card', text: 'Múltiples métodos de pago' },
      { icon: 'history',     text: 'Historial completo' },
    ],
    priceFrom: 'Desde $1/día',
    badge: 'Disponible',
    badgeBg: '#CCFBF1',
    badgeFg: '#0F766E',
    sparkles: ['bolt', 'savings'],
    active: true,
    to: '/recarga-saldo',
  },
  {
    id: 'cobertura-parcial',
    label: 'Cobertura Parcial',
    subtitle: 'RCV / Básica',
    tagline: 'Protección obligatoria',
    description: 'Responsabilidad civil y cobertura básica para protección mínima obligatoria.',
    icon: 'gpp_good',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
    overlay: 'linear-gradient(135deg, rgba(124,58,237,0.92) 0%, rgba(167,139,250,0.78) 50%, rgba(124,58,237,0.55) 100%)',
    accentColor:  '#7C3AED',
    benefits: [
      { icon: 'gavel',         text: 'Responsabilidad Civil' },
      { icon: 'car_crash',     text: 'Daños a terceros' },
      { icon: 'support_agent', text: 'Asistencia en ruta' },
    ],
    priceFrom: 'Próximamente',
    badge: 'Próximamente',
    badgeBg: '#F1F5F9',
    badgeFg: '#64748B',
    sparkles: ['enhanced_encryption', 'verified_user'],
    active: false,
  },
]

export default function ProductosPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const firstName = user?.name?.split(' ')[0] ?? 'Usuario'

  return (
    <div className="flex flex-col gap-4">

      {/* ── Hero greeting — texto izquierda, stats/acceso rápido derecha ── */}
      <div
        className="rounded-2xl text-white px-5 py-5 sm:py-6 relative overflow-hidden"
        style={{ backgroundColor: BRAND.navy }}
      >
        {/* Burbujas decorativas */}
        <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full opacity-[0.08] bg-white" />
        <div className="absolute bottom-0 right-1/3 w-56 h-56 rounded-full opacity-[0.05] bg-white" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-[0.06] bg-white" />

        <div className="relative flex items-center justify-between gap-4">
          {/* Texto */}
          <div>
            <p className="text-white/60 text-caption font-semibold uppercase tracking-widest mb-1">
              La Mundial de Seguros
            </p>
            <h1 className="text-display-sm sm:text-display-md font-bold leading-tight mb-1">
              Hola, {firstName} 👋
            </h1>
            <p className="text-white/75 text-body-md leading-relaxed">
              ¿Qué deseas hacer hoy? Selecciona un producto.
            </p>
          </div>

          {/* Acceso rápido — solo desktop */}
          <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
            <button
              onClick={() => navigate('/movimientos')}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm border border-white/25 text-white font-semibold text-label-md px-4 py-2.5 rounded-xl transition"
            >
              <Icon name="history" className="text-[18px]" />
              Mis movimientos
            </button>
            <button
              onClick={() => navigate('/polizas')}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white/85 text-caption px-3 py-1.5 rounded-lg transition"
            >
              <Icon name="policy" className="text-[16px]" />
              Ver mis pólizas
            </button>
          </div>
        </div>
      </div>

      {/* ── Section title — solo mobile (en desktop ya está en el hero) ── */}
      <div className="flex md:hidden items-center justify-between">
        <h2 className="text-headline-md font-bold text-on-surface">
          Nuestros productos
        </h2>
        <button
          onClick={() => navigate('/movimientos')}
          className="flex items-center gap-1.5 text-caption font-semibold text-primary hover:text-primary/80 transition"
        >
          <Icon name="history" className="text-[18px]" />
          Mis movimientos
        </button>
      </div>
      <h2 className="hidden md:block text-headline-md font-bold text-on-surface -mt-1">
        Nuestros productos
      </h2>

      {/* ── Product cards — 2 cols en tablet, 4 en desktop ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 auto-rows-fr">
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            type="button"
            onClick={() => product.active && navigate(product.to)}
            disabled={!product.active}
            className={clsx(
              /* `safe-clip` (definido en index.css) aplica:
                  - isolate + translateZ(0) → layer GPU propio
                  - mask-image radial → fuerza clipping redondeado robusto
                  - appearance-none + outline reset → quita el borde cuadrado
                    default del <button> que pelea con rounded-3xl.
                 Las transiciones son explícitas (NO transition-all) para no
                 interpolar el border-radius. */
              'safe-clip group relative text-left rounded-3xl flex flex-col shadow-md h-full min-h-[380px] lg:min-h-[360px]',
              'transition-[transform,box-shadow] duration-300 ease-out',
              product.active
                ? 'bg-white hover:shadow-2xl hover:-translate-y-1.5 active:scale-[0.98] cursor-pointer'
                : 'bg-white cursor-not-allowed',
            )}
          >
            {/* ── Hero image with overlay ────────────────────────────────
                 Doble-clip de seguridad: el contenedor también lleva
                 rounded-t-3xl + overflow-hidden + isolate, así la imagen
                 nunca puede sangrar fuera del rounded del botón ni
                 siquiera durante el group-hover:scale-110. */}
            <div className="relative h-40 overflow-hidden shrink-0 rounded-t-3xl isolate">
              {/* Background image — transform-gpu para que el scale viva
                  en su propio layer compuesto (clipping perfecto). */}
              <img
                src={product.image}
                alt={product.label}
                className={clsx(
                  'absolute inset-0 w-full h-full object-cover transform-gpu transition-transform duration-700 ease-out',
                  product.active ? 'group-hover:scale-110' : 'grayscale opacity-70',
                )}
                loading="lazy"
                draggable={false}
              />

              {/* Brand color overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: product.active
                    ? product.overlay
                    : 'linear-gradient(135deg, rgba(100,116,139,0.85) 0%, rgba(148,163,184,0.6) 100%)',
                }}
              />

              {/* Decorative sparkles — transition-opacity (no transition-all)
                  para que el border-radius nunca se interpole. */}
              {product.active && product.sparkles?.map((sp, i) => (
                <div
                  key={sp}
                  className="absolute opacity-25 transition-opacity duration-700 group-hover:opacity-45 pointer-events-none"
                  style={{
                    top:  i === 0 ? '20%' : '55%',
                    left: i === 0 ? '60%' : '12%',
                    transform: `rotate(${i * 20}deg)`,
                  }}
                >
                  <Icon name={sp} filled className="text-[40px] text-white drop-shadow-lg" />
                </div>
              ))}

              {/* Top row: subtitle pill + badge */}
              <div className="absolute top-3 inset-x-3 flex items-start justify-between gap-2 z-10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/95 bg-white/15 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/25">
                  {product.subtitle}
                </span>
                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md shrink-0"
                  style={{ backgroundColor: product.badgeBg, color: product.badgeFg }}
                >
                  {product.badge}
                </span>
              </div>

              {/* Title at bottom */}
              <div className="absolute bottom-3 inset-x-4 z-10">
                <h3 className="text-headline-lg font-bold text-white leading-tight drop-shadow-lg">
                  {product.label}
                </h3>
                <p className="text-[12px] text-white/90 mt-0.5 font-semibold drop-shadow line-clamp-1">
                  {product.tagline}
                </p>
              </div>
            </div>

            {/* ── Icon strip — separated from image to avoid overflow issues ── */}
            <div className="relative px-5 pt-4 pb-1 flex items-center gap-3 shrink-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-rotate-6 shrink-0 -mt-9 relative z-10 transform-gpu"
                style={{
                  background: product.active
                    ? `linear-gradient(135deg, ${product.accentColor} 0%, ${product.accentColor}DD 100%)`
                    : 'linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%)',
                  border: '3px solid #FFFFFF',
                }}
              >
                <Icon
                  name={product.icon}
                  filled
                  className="text-[28px] text-white drop-shadow"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-caption text-on-surface-variant leading-snug line-clamp-2">
                  {product.description}
                </p>
              </div>
            </div>

            {/* ── Body ──────────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3 p-5 pt-3 flex-1">

              {/* Benefits */}
              <div className="flex flex-col gap-1.5 py-1 flex-1">
                {product.benefits.map((b) => (
                  <div key={b.text} className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: product.active ? `${product.accentColor}15` : '#F1F5F9',
                      }}
                    >
                      <Icon
                        name={b.icon}
                        filled
                        className="text-[14px]"
                        style={{ color: product.active ? product.accentColor : '#94A3B8' }}
                      />
                    </div>
                    <span className="text-[12px] text-on-surface font-medium truncate">{b.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA strip */}
              <div className="mt-auto flex items-center justify-between gap-2 pt-3 border-t border-outline-variant/30">
                <div className="min-w-0">
                  <p className="text-[9px] text-on-surface-variant uppercase tracking-wider font-bold">
                    {product.active ? 'Prima' : 'Estado'}
                  </p>
                  <p
                    className="text-label-md font-bold truncate"
                    style={{ color: product.active ? product.accentColor : '#94A3B8' }}
                  >
                    {product.priceFrom}
                  </p>
                </div>
                {product.active ? (
                  <div
                    className="flex items-center gap-1.5 font-bold text-label-md px-3 py-2 rounded-xl transition-[gap] duration-200 group-hover:gap-2.5 shadow-sm shrink-0"
                    style={{ backgroundColor: product.accentColor, color: '#FFFFFF' }}
                  >
                    <span>Cotizar</span>
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-caption text-on-surface-variant shrink-0">
                    <Icon name="schedule" className="text-[16px]" />
                    <span>Pronto</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* ── Quick access strip — solo mobile (en desktop está en el hero) ── */}
      <div
        className="md:hidden rounded-2xl p-4 flex items-center justify-between gap-3"
        style={{ backgroundColor: `${BRAND.navy}08`, border: `1px solid ${BRAND.navy}15` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: BRAND.navy }}
          >
            <Icon name="policy" className="text-white text-[20px]" filled />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-on-surface text-label-md">¿Ya tienes un vehículo asegurado?</p>
            <p className="text-caption text-on-surface-variant truncate">Ver mis pólizas activas e inspecciones</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/polizas')}
          className="btn-soft shrink-0 text-caption"
        >
          Ver pólizas
          <Icon name="arrow_forward" className="text-[16px]" />
        </button>
      </div>

    </div>
  )
}
