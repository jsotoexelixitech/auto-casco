import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { BrandLockup, BrandLogo } from '../ui/Brand'
import Modal from '../ui/Modal'
import { useAuth } from '../../context/AuthContext'

const NAV = [
  { to: '/dashboard',        label: 'Productos',            icon: 'storefront',      roles: 'all' },
  { to: '/movimientos',      label: 'Mis Movimientos',      icon: 'history',         roles: 'all' },
  { to: '/polizas',          label: 'Pólizas',              icon: 'policy',          roles: 'all' },

  //se comenta planes de vida de la visual pero no se borra
  /*  { to: '/planes-vida',      label: 'Planes de Vida',       icon: 'favorite_border', roles: 'all' }, */
  { to: '/configuracion-ia', label: 'Configuración IA',     icon: 'tune',            roles: 'all' },
]

/**
 * Ítem del rail compacto (desktop): el icono no se mueve; un flyout animado
 * muestra el nombre a la derecha. En móvil: icono + texto en el drawer.
 */
function NavItem({ to, label, icon, end, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        clsx(
          'group relative flex items-center gap-3 px-3 py-2.5 min-h-[48px] rounded-xl font-sans text-label-md',
          'transition-[background-color,box-shadow,transform] duration-200 ease-out',
          'md:w-11 md:h-11 md:min-h-0 md:px-0 md:py-0 md:justify-center',
          isActive
            ? 'font-semibold text-white'
            : 'font-medium text-white/85 hover:bg-white/[0.08] hover:text-white',
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* ── Activo móvil: pastilla con gradiente + acento Imperial ── */}
          {isActive && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-xl md:hidden overflow-hidden"
              style={{
                background:
                  'linear-gradient(105deg, rgba(232,79,81,0.28) 0%, rgba(255,255,255,0.14) 42%, rgba(255,255,255,0.08) 100%)',
                boxShadow:
                  'inset 0 0 0 1px rgba(255,255,255,0.14), 0 6px 16px rgba(9,17,51,0.22)',
              }}
            >
              <span
                className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full"
                style={{
                  background: 'linear-gradient(180deg, #E84F51 0%, #B23F44 100%)',
                  boxShadow: '0 0 10px rgba(232,79,81,0.55)',
                }}
              />
            </span>
          )}

          {/* ── Activo desktop: disco suave + anillo + punto Imperial ── */}
          {isActive && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden md:block rounded-xl"
            >
              <span
                className="absolute inset-[3px] rounded-xl"
                style={{
                  background:
                    'radial-gradient(circle at 50% 45%, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 55%, transparent 72%)',
                  boxShadow:
                    'inset 0 0 0 1px rgba(255,255,255,0.16), 0 0 0 1px rgba(232,79,81,0.18)',
                }}
              />
              <span
                className="absolute left-1/2 bottom-1 h-1 w-1 -translate-x-1/2 rounded-full"
                style={{
                  backgroundColor: '#E84F51',
                  boxShadow: '0 0 8px 2px rgba(232,79,81,0.65)',
                }}
              />
            </span>
          )}

          <Icon
            name={icon}
            className={clsx(
              'relative z-[1] text-[22px] shrink-0 transition-transform duration-200 ease-out',
              'md:group-hover:scale-110',
              isActive && 'drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]',
            )}
            style={{ color: isActive ? '#ffffff' : 'rgba(255,255,255,0.88)' }}
            filled={isActive}
          />
          <span
            className={clsx(
              'relative z-[1] truncate text-[0.9rem] md:hidden transition-colors duration-200',
              isActive ? 'text-white' : 'text-white/85',
            )}
          >
            {label}
          </span>
          <DesktopFlyout label={label} icon={icon} isActive={isActive} />
        </>
      )}
    </NavLink>
  )
}

/** Panel flotante de marca: slide + fade, sin sacar el ítem del flujo. */
function DesktopFlyout({ label, icon, isActive, tone = 'nav' }) {
  const isLogout = tone === 'logout'
  return (
    <span
      aria-hidden
      className={clsx(
        'pointer-events-none absolute left-[calc(100%+0.4rem)] top-1/2 z-[70] hidden -translate-y-1/2 md:flex',
        'items-center gap-2.5 rounded-xl py-2.5 pl-2.5 pr-3.5 whitespace-nowrap',
        /* Enter rápido / leave con delay corto → no “queda colgado” al cambiar de ítem */
        'origin-left opacity-0 scale-95 -translate-x-1',
        'transition-[opacity,transform] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] delay-75',
        'group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 group-hover:delay-0',
        'group-focus-visible:translate-x-0 group-focus-visible:scale-100 group-focus-visible:opacity-100 group-focus-visible:delay-0',
      )}
      style={{
        background: isLogout
          ? 'linear-gradient(135deg, #3A1520 0%, #0F1A5A 55%, #091133 100%)'
          : 'linear-gradient(135deg, #162A7F 0%, #0F1A5A 48%, #091133 100%)',
        boxShadow: '0 10px 28px rgba(9, 17, 51, 0.45), 0 0 0 1px rgba(255,255,255,0.10)',
      }}
    >
      <span
        aria-hidden
        className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45"
        style={{
          background: isLogout ? '#2A1218' : '#162A7F',
          boxShadow: '-1px 1px 0 rgba(255,255,255,0.08)',
        }}
      />
      <span
        className="relative flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
        style={{
          background: isLogout
            ? 'rgba(232,79,81,0.22)'
            : 'rgba(255,255,255,0.12)',
          boxShadow: isActive && !isLogout ? 'inset 0 0 0 1px rgba(232,79,81,0.55)' : undefined,
        }}
      >
        <Icon
          name={icon}
          className="text-[18px] text-white"
          filled={isActive && !isLogout}
        />
      </span>
      <span className="relative flex flex-col min-w-0">
        <span className="text-[0.82rem] font-semibold leading-tight text-white tracking-wide">
          {label}
        </span>
        {!isLogout && (
          <span
            className="mt-0.5 h-0.5 w-6 rounded-full"
            style={{
              background: 'linear-gradient(90deg, #E84F51 0%, rgba(232,79,81,0.15) 100%)',
            }}
          />
        )}
      </span>
    </span>
  )
}

export default function SideNav({ open, onClose }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [confirmLogoutOpen, setConfirmLogoutOpen] = useState(false)

  const visible = NAV.filter((n) => n.roles === 'all' || n.roles.includes(user?.role))

  const handleConfirmLogout = () => {
    setConfirmLogoutOpen(false)
    onClose?.()
    logout()
    navigate('/login')
  }

  return (
    <>
      <Modal
        open={confirmLogoutOpen}
        onClose={() => setConfirmLogoutOpen(false)}
        title="Confirmación"
        subtitle="¿Deseas cerrar sesión?"
        icon="logout"
        size="sm"
        headerSize="compact"
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(false)}
              className="btn-soft flex-1 sm:flex-none"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmLogout}
              className="btn-accent flex-1 sm:flex-none"
            >
              Sí, cerrar sesión
            </button>
          </>
        }
      >
        <p className="text-body-md text-on-surface-variant">
          Al confirmar, perderás los cambios no guardados y tendrás que volver a iniciar sesión para acceder a tu cuenta.
        </p>
      </Modal>
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-brand-900/50 z-[80] backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          'fixed top-0 left-0 flex flex-col z-[90] md:z-50 transition-[transform,width] duration-300 ease-out',
          'w-[70%] max-w-[230px] md:w-[4.5rem] md:max-w-none',
          'md:translate-x-0 md:overflow-visible',
          open ? 'translate-x-0 shadow-elev-2' : '-translate-x-full md:translate-x-0',
        )}
        style={{
          top: 0,
          height: '100dvh',
          backgroundColor: '#0F1A5A',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '4px 0 24px rgba(9, 17, 51, 0.18)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="relative px-4 sm:px-5 md:px-2 pt-5 sm:pt-6 md:pt-5 pb-4 sm:pb-5 md:pb-4 shrink-0">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-28 opacity-40 md:h-20"
            style={{
              background:
                'radial-gradient(120% 80% at 30% 0%, rgba(232,79,81,0.22) 0%, rgba(232,79,81,0.06) 45%, transparent 75%)',
            }}
          />

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
              className="md:hidden transition-transform duration-300 group-hover:scale-[1.02] drop-shadow-[0_2px_10px_rgba(0,0,0,0.30)] max-w-[150px] sm:max-w-[180px]"
            />
            <BrandLogo
              size={36}
              className="hidden md:block transition-transform duration-300 group-hover:scale-[1.05] drop-shadow-[0_2px_10px_rgba(0,0,0,0.30)]"
            />
          </Link>

          <div
            aria-hidden
            className="relative mt-4 sm:mt-5 md:mt-3 h-px w-full"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(232,79,81,0.55) 25%, rgba(255,255,255,0.18) 60%, transparent 100%)',
            }}
          />
        </div>

        <nav className="relative flex-1 overflow-y-auto md:overflow-visible px-3 md:px-2 pb-3 pt-2 flex flex-col gap-0.5 md:items-center md:gap-1">
          {visible.map((item) => (
            <div key={item.to} className="relative w-full md:w-11 md:h-11 shrink-0">
              <NavItem
                to={item.to}
                label={item.label}
                icon={item.icon}
                end={item.to === '/dashboard'}
                onNavigate={onClose}
              />
            </div>
          ))}
        </nav>

        <div className="relative px-3 md:px-2 pb-4 pt-3 border-t border-white/10 flex flex-col gap-0.5 md:items-center md:overflow-visible shrink-0">
          <div className="relative w-full md:w-11 md:h-11">
            <button
              type="button"
              onClick={() => setConfirmLogoutOpen(true)}
              aria-label="Cerrar sesión"
              className={clsx(
                'group relative flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-xl text-white/85 transition-colors duration-200',
                'hover:bg-error/20 hover:text-white',
                'md:w-11 md:h-11 md:min-h-0 md:px-0 md:py-0 md:justify-center',
              )}
            >
              <Icon
                name="logout"
                className="relative z-[1] text-[22px] shrink-0 transition-transform duration-200 ease-out md:group-hover:scale-110"
              />
              <span className="text-[0.9rem] md:hidden">Cerrar sesión</span>
              <DesktopFlyout label="Cerrar sesión" icon="logout" isActive={false} tone="logout" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
