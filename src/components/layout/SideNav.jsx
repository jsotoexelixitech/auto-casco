import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { BrandLogo, BrandWordmark } from '../ui/Brand'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../data/mockData'

const NAV = [
  { to: '/dashboard', label: 'Panel de Control', icon: 'dashboard', roles: 'all' },
  { to: '/polizas', label: 'Pólizas', icon: 'policy', roles: 'all' },
  { to: '/inspecciones', label: 'Inspecciones', icon: 'verified', roles: 'all' },
  { to: '/cobertura', label: 'Cobertura', icon: 'shield', roles: ['asegurado', 'intermediario'] },
  { to: '/emision', label: 'Emisión', icon: 'edit_document', roles: ['perito', 'admin', 'intermediario'] },
  { to: '/siniestros', label: 'Siniestros', icon: 'car_crash', roles: 'all' },
  { to: '/pagos', label: 'Pagos', icon: 'payments', roles: 'all' },
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
          className="md:hidden fixed inset-0 bg-brand-900/50 z-40 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-screen w-[78%] max-w-[300px] md:w-64 bg-white border-r border-outline-variant/60 flex flex-col z-50 transition-transform duration-300 ease-out',
          'md:translate-x-0',
          open ? 'translate-x-0 shadow-elev-2' : '-translate-x-full md:translate-x-0',
        )}
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4 pb-3">
          <div className="flex items-center gap-2 min-w-0">
            <BrandLogo size={36} className="shrink-0" />
            <BrandWordmark size="sm" />
          </div>
          <button
            onClick={onClose}
            className="md:hidden btn-icon -mr-1"
            aria-label="Cerrar menú"
          >
            <Icon name="close" className="text-[22px]" />
          </button>
        </div>

        <div className="px-4 pb-3">
          <button
            onClick={() => {
              onClose?.()
              navigate('/inspecciones/nueva')
            }}
            className="btn-accent w-full group"
          >
            <Icon name="add_a_photo" className="text-[20px] group-hover:rotate-3 transition" filled />
            Nueva Inspección
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-3 flex flex-col gap-1">
          {visible.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              end={item.to === '/dashboard'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 font-sans text-label-md group relative',
                  isActive
                    ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    name={item.icon}
                    className="text-[22px]"
                    filled={isActive}
                  />
                  <span className="truncate flex-1">{item.label}</span>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-400 shadow-[0_0_8px_rgba(255,102,117,0.7)]" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-4 pt-3 border-t border-outline-variant/60 flex flex-col gap-1">
          {FOOTER_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-primary transition"
            >
              <Icon name={item.icon} className="text-[22px]" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-on-error-container transition"
          >
            <Icon name="logout" className="text-[22px]" />
            <span>Cerrar sesión</span>
          </button>

          {user && (
            <div className="mt-3 p-3 rounded-xl bg-surface-container-low flex items-center gap-3 border border-outline-variant/40">
              <div
                className={clsx(
                  'w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0',
                  user.color || 'bg-primary',
                )}
              >
                {user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-label-md text-on-surface truncate">
                  {user.name}
                </p>
                <p className="text-caption text-on-surface-variant truncate">
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
