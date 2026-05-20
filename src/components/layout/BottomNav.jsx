import { NavLink, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'

const ITEMS = [
  { to: '/dashboard',   label: 'Productos',   icon: 'storefront',      central: true },
  { to: '/movimientos', label: 'Movimientos', icon: 'history' },
  { to: '/polizas',     label: 'Pólizas',     icon: 'policy' },
  { to: '/planes-vida', label: 'Vida',        icon: 'favorite_border' },
  { to: '/perfil',      label: 'Perfil',      icon: 'person' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const visible = ITEMS
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-xl border-t border-outline-variant/60 shadow-elev-2"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 px-1 py-0.5 landscape:py-0 max-w-md mx-auto">
        {visible.map((item) => {
          if (item.central) {
            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="relative flex flex-col items-center justify-center gap-0.5 min-h-[52px] landscape:min-h-[44px] py-1 group"
              >
                <span className="-mt-7 landscape:-mt-2 w-14 h-14 landscape:w-10 landscape:h-10 rounded-full bg-gradient-accent shadow-elev-accent flex items-center justify-center text-white border-4 border-white transition-transform group-active:scale-95">
                  <Icon name={item.icon} className="text-[26px] landscape:text-[18px]" filled />
                </span>
                <span className="text-[10px] font-bold text-accent-500 mt-0.5 landscape:hidden">
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
                  'flex flex-col items-center justify-center gap-0.5 min-h-[52px] landscape:min-h-[44px] py-1.5 landscape:py-1 rounded-lg transition relative',
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
