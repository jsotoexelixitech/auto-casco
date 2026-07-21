import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { BrandLockup } from '../ui/Brand'
import { useAuth } from '../../context/AuthContext'
import { ROLE_LABELS } from '../../data/mockData'

export default function TopNav({ onMenuClick }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [openProfile, setOpenProfile] = useState(false)
  const profileRef = useRef(null)

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenProfile(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header
      className="sticky z-30 overflow-hidden border-b shadow-sm bg-white/90 backdrop-blur-xl"
      style={{
        top: 'env(safe-area-inset-top, 0px)',
        borderBottomColor: 'rgba(15, 26, 90, 0.10)',
      }}
    >
      <div className="flex items-center justify-between gap-2 container-pad h-14 sm:h-16 w-full">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={onMenuClick}
            className="md:hidden btn-icon -ml-1"
            aria-label="Abrir menú"
          >
            <Icon name="menu" className="text-[24px] text-primary" />
          </button>

          <Link to="/dashboard" className="md:hidden flex items-center min-w-0">
            <BrandLockup height={36} className="xs:hidden" />
            <BrandLockup height={40} className="hidden xs:inline-block" />
          </Link>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Link
            to="/ajustes"
            className="hidden sm:inline-flex btn-icon"
            aria-label="Configuración"
          >
            <Icon name="settings" className="text-[22px]" />
          </Link>

          <div ref={profileRef} className="relative">
            <button
              onClick={() => setOpenProfile((s) => !s)}
              className="ml-1 flex items-center gap-2 p-1.5 min-h-[44px] min-w-[44px] rounded-full hover:bg-surface-container transition"
              aria-label="Perfil"
            >
              <div
                className={clsx(
                  'w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm',
                  user?.color || 'bg-primary',
                )}
              >
                {user?.avatar ?? '?'}
              </div>
              <div className="hidden lg:block text-left pr-1">
                <p className="text-label-md text-on-surface leading-tight">
                  {user?.name}
                </p>
                <p className="text-caption text-on-surface-variant leading-tight">
                  {ROLE_LABELS[user?.role]}
                </p>
              </div>
            </button>
            {openProfile && (
              <div className="absolute right-0 top-full mt-2 w-64 max-w-[calc(100vw-1rem)] card-elev2 p-1 animate-fade-in">
                <div className="p-3 border-b border-outline-variant/50">
                  <p className="font-bold text-on-surface truncate">{user?.name}</p>
                  <p className="text-caption text-on-surface-variant truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setOpenProfile(false)
                    navigate('/perfil')
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition"
                >
                  <Icon name="person" className="text-[20px]" /> Mi Perfil
                </button>
                <button
                  onClick={() => {
                    setOpenProfile(false)
                    navigate('/ajustes')
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition"
                >
                  <Icon name="tune" className="text-[20px]" /> Preferencias
                </button>
                <button
                  onClick={() => {
                    setOpenProfile(false)
                    navigate('/ayuda')
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container-low transition"
                >
                  <Icon name="help" className="text-[20px]" /> Ayuda
                </button>
                <button
                  onClick={() => {
                    setOpenProfile(false)
                    logout()
                    navigate('/login')
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error-container hover:text-on-error-container transition"
                >
                  <Icon name="logout" className="text-[20px]" /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
