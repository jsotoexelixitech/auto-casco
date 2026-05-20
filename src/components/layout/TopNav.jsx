import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import Icon from '../ui/Icon'
import { BrandLockup } from '../ui/Brand'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { ROLE_LABELS } from '../../data/mockData'
import SearchPalette from './SearchPalette'

export default function TopNav({ onMenuClick }) {
  const { user, logout } = useAuth()
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    policies,
    inspections,
    siniestros,
    getVehicle,
  } = useData()
  const navigate = useNavigate()
  const [openNotif, setOpenNotif] = useState(false)
  const [openProfile, setOpenProfile] = useState(false)
  const [openSearch, setOpenSearch] = useState(false)
  const [search, setSearch] = useState('')
  const notifRef = useRef(null)
  const profileRef = useRef(null)

  const unread = notifications.filter((n) => n.unread).length

  // Cmd+K / Ctrl+K to open search
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpenSearch(true)
      }
      if (e.key === 'Escape') {
        setOpenSearch(false)
        setOpenNotif(false)
        setOpenProfile(false)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setOpenNotif(false)
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.toLowerCase()
    const polRes = policies
      .filter((p) => {
        const v = getVehicle(p.vehicleId)
        return [p.numero, p.plan, v?.placa, v?.marca, v?.modelo]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .slice(0, 4)
    const insRes = inspections
      .filter((i) => {
        const v = getVehicle(i.vehicleId)
        return [i.numero, i.tipo, i.estado, v?.placa, v?.marca, v?.modelo]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .slice(0, 4)
    const sinRes = siniestros
      .filter((s) => {
        const v = getVehicle(s.vehicleId)
        return [s.id, s.tipo, s.estado, v?.placa, v?.marca, v?.modelo]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q)
      })
      .slice(0, 4)
    return { polRes, insRes, sinRes, total: polRes.length + insRes.length + sinRes.length }
  }, [search, policies, inspections, siniestros, getVehicle])

  const goSearchResult = (path) => {
    navigate(path)
    setOpenSearch(false)
    setSearch('')
  }

  const handleNotifClick = (n) => {
    markNotificationRead(n.id)
    setOpenNotif(false)
    if (n.icon === 'rule') navigate('/inspecciones')
    else if (n.icon === 'timer_off') navigate('/emision')
    else if (n.icon === 'campaign') navigate('/emision')
    else navigate('/dashboard')
  }

  return (
    <header
      className="sticky z-30 overflow-hidden border-b shadow-sm bg-white/90 backdrop-blur-xl"
      style={{
        /* top = zona ya cubierta por el div navy global (safe-area-inset-top) */
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

          <button
            onClick={() => setOpenSearch(true)}
            className="hidden md:flex items-center bg-surface-container-low rounded-full px-4 py-2 border border-outline-variant/70 hover:border-primary focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 transition flex-1 max-w-md text-left"
          >
            <Icon name="search" className="text-on-surface-variant text-[20px] mr-2 shrink-0" />
            <span className="text-body-md text-on-surface-variant/70 truncate flex-1">
              Buscar póliza, inspección, siniestro…
            </span>
            <kbd className="hidden lg:inline-flex items-center gap-1 ml-2 text-[11px] font-semibold text-on-surface-variant px-1.5 py-0.5 rounded border border-outline-variant bg-white shrink-0">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setOpenSearch(true)}
            className="md:hidden btn-icon"
            aria-label="Buscar"
          >
            <Icon name="search" className="text-[22px]" />
          </button>

          <div ref={notifRef} className="relative">
            <button
              onClick={() => setOpenNotif((s) => !s)}
              className="btn-icon relative"
              aria-label="Notificaciones"
            >
              <Icon name="notifications" className="text-[22px]" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-gradient-accent text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unread}
                </span>
              )}
            </button>
            {openNotif && (
              <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] card-elev2 p-2 animate-fade-in">
                <div className="flex items-center justify-between p-2">
                  <p className="font-bold text-on-surface">Notificaciones</p>
                  {unread > 0 ? (
                    <button
                      onClick={() => markAllNotificationsRead()}
                      className="text-caption text-primary hover:underline font-semibold"
                    >
                      Marcar todas
                    </button>
                  ) : (
                    <span className="text-caption text-on-surface-variant">
                      Al día
                    </span>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto flex flex-col gap-1">
                  {notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={clsx(
                        'flex gap-3 p-3 rounded-lg text-left hover:bg-surface-container-low transition',
                        n.unread && 'bg-primary-fixed/40',
                      )}
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                        <Icon name={n.icon} className="text-[20px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-md text-on-surface truncate">{n.title}</p>
                        <p className="text-caption text-on-surface-variant line-clamp-2">
                          {n.body}
                        </p>
                        <p className="text-[11px] text-on-surface-variant/80 mt-0.5">
                          {n.when}
                        </p>
                      </div>
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-1" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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

      {/* Global search palette */}
      {openSearch && (
        <SearchPalette
          search={search}
          setSearch={setSearch}
          results={searchResults}
          onClose={() => {
            setOpenSearch(false)
            setSearch('')
          }}
          onSelect={goSearchResult}
          getVehicle={getVehicle}
        />
      )}
    </header>
  )
}

