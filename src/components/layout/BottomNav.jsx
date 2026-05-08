import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { useAuth } from '../../context/AuthContext'

const ITEMS = [
  { to: '/dashboard', label: 'Inicio', icon: 'home', filled: 'home' },
  { to: '/polizas', label: 'Pólizas', icon: 'policy', filled: 'policy' },
  { to: '/inspecciones', label: 'Inspectar', icon: 'verified', central: true },
  { to: '/cobertura', label: 'Cobertura', icon: 'shield', roles: ['asegurado', 'intermediario'] },
  { to: '/emision', label: 'Emisión', icon: 'edit_document', roles: ['perito', 'admin', 'intermediario'] },
  { to: '/pagos', label: 'Pagos', icon: 'account_balance_wallet' },
]

export default function BottomNav() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const visible = ITEMS.filter((i) => !i.roles || i.roles.includes(user?.role)).slice(0, 5)
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-outline-variant/60 shadow-elev-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 px-2 py-1 max-w-md mx-auto">
        {visible.map((item) => {
          if (item.central) {
            return (
              <button
                key={item.to}
                onClick={() => navigate('/inspecciones/nueva')}
                className="relative flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-1 group"
              >
                <span className="-mt-7 w-14 h-14 rounded-full bg-gradient-accent shadow-elev-accent flex items-center justify-center text-white border-4 border-white transition-transform group-active:scale-95">
                  <Icon name="add_a_photo" className="text-[26px]" filled />
                </span>
                <span className="text-[10px] font-bold text-accent-500 mt-0.5">
                  {item.label}
                </span>
              </button>
            )
          }
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex flex-col items-center justify-center gap-0.5 min-h-[56px] py-2 rounded-lg transition relative',
                  isActive
                    ? 'text-primary'
                    : 'text-on-surface-variant active:bg-surface-container',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 w-8 h-1 rounded-full bg-accent-500" />
                  )}
                  <Icon
                    name={item.icon}
                    className="text-[22px]"
                    filled={isActive}
                  />
                  <span
                    className={clsx(
                      'text-[10px] font-semibold leading-none',
                      isActive ? 'text-primary' : 'text-on-surface-variant',
                    )}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
