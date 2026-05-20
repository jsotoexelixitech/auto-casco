import { Link, NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { BrandLockup } from '../ui/Brand'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../data/mockData'

const NAV = [
  { to: '/dashboard',        label: 'Productos',            icon: 'storefront',      roles: 'all' },
  { to: '/movimientos',      label: 'Mis Movimientos',      icon: 'history',         roles: 'all' },
  { to: '/polizas',          label: 'Pólizas',              icon: 'policy',          roles: 'all' },
  
  
  //se comenta planes de vida de la visual pero no se borra
  /*  { to: '/planes-vida',      label: 'Planes de Vida',       icon: 'favorite_border', roles: 'all' }, */
  { to: '/configuracion-ia', label: 'Configuración IA',     icon: 'tune',            roles: 'all' },
]

const FOOTER_NAV = [{ to: '/ayuda', label: 'Ayuda', icon: 'help' }]

export default function SideNav({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const visible = NAV.filter((n) => n.roles === 'all' || n.roles.includes(user?.role))

  return (
    <>
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-brand-900/50 z-[55] backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          'fixed top-0 left-0 w-[82%] max-w-[300px] md:w-64 flex flex-col z-[60] md:z-50 transition-transform duration-300 ease-out',
          'md:translate-x-0',
          open ? 'translate-x-0 shadow-elev-2' : '-translate-x-full md:translate-x-0',
        )}
        style={{
          /* Empieza desde el top absoluto de pantalla */
          top: 0,
          /* 100dvh cubre el viewport dinámico completo incluyendo nav bar Android */
          height: '100dvh',
          backgroundColor: '#0F1A5A',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '4px 0 24px rgba(9, 17, 51, 0.18)',
          /* El contenido salta la zona del status bar que cubre el div global */
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >

        {/* ── Brand header ─────────────────────────────────────────────
            Decorative radial glow + official lockup + hairline divider
            Responsive: the lockup fills the sidebar width on every breakpoint.
        */}
        <div className="relative px-4 sm:px-5 pt-5 sm:pt-6 pb-4 sm:pb-5">
          {/* Soft brand-light glow behind the logo */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-40"
            style={{
              background:
                'radial-gradient(120% 80% at 30% 0%, rgba(232,79,81,0.22) 0%, rgba(232,79,81,0.06) 45%, transparent 75%)',
            }}
          />

          {/* Close button (mobile only) — floats to top-right so it doesn't
              constrain the logo's available width */}
          <button
            onClick={onClose}
            className="md:hidden absolute top-3 right-3 inline-flex items-center justify-center w-9 h-9 rounded-full text-white/85 hover:bg-white/10 transition z-10"
            aria-label="Cerrar menú"
          >
            <Icon name="close" className="text-[20px]" />
          </button>

          <Link
            to="/dashboard"
            onClick={onClose}
            className="relative flex items-center justify-center w-full group rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Ir al inicio"
          >
            <BrandLockup
              className="transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-[0_2px_10px_rgba(0,0,0,0.30)] max-w-[220px] sm:max-w-[240px] md:max-w-full"
            />
          </Link>

          {/* Hairline divider with brand-accent gradient */}
          <div
            aria-hidden
            className="relative mt-4 sm:mt-5 h-px w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(232,79,81,0.55) 25%, rgba(255,255,255,0.18) 60%, transparent 100%)',
            }}
          />
        </div>

        <nav className="relative flex-1 overflow-y-auto px-3 pb-3 pt-2 flex flex-col gap-0.5">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 min-h-[48px] rounded-xl transition-all duration-200 font-sans text-label-md group relative',
                  isActive
                    ? 'font-bold'
                    : 'hover:bg-white/8',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {/* Fondo activo sólido — más contraste */}
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-xl"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.18)',
                        borderLeft: '4px solid #E84F51',   // acento rojo Imperial para marcar activo
                      }}
                    />
                  )}
                  <Icon
                    name={item.icon}
                    className="relative text-[22px] shrink-0"
                    style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.90)' }}
                    filled={isActive}
                  />
                  <span
                    className="relative truncate flex-1 text-[0.9rem]"
                    style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.85)' }}
                  >{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="relative px-3 pb-4 pt-3 border-t border-white/10 flex flex-col gap-0.5">
          {FOOTER_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-white/85 hover:bg-white/8 hover:text-white transition"
            >
              <Icon name={item.icon} className="text-[22px] shrink-0" />
              <span className="text-[0.9rem]">{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-white/85 hover:bg-error/20 hover:text-white transition"
          >
            <Icon name="logout" className="text-[22px] shrink-0" />
            <span className="text-[0.9rem]">Cerrar sesión</span>
          </button>

          {user && (
            <div
              className="mt-3 p-3 rounded-xl flex items-center gap-3"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                  user.color || 'bg-accent-500',
                )}
                style={!user.color ? { background: '#162A7F' } : {}}
              >
                {user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-md text-white truncate">
                  {user.name}
                </p>
                <p className="text-caption text-white/65 truncate">
                  {ROLE_LABELS[user.role]}
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
