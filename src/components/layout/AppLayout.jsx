import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SideNav from './SideNav'
import TopNav from './TopNav'
import BottomNav from './BottomNav'

export default function AppLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close drawer on route change (mobile UX)
  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <div className="overflow-x-hidden" style={{ minHeight: '100dvh' }}>
      <SideNav open={open} onClose={() => setOpen(false)} />
      <div className="md:ml-[4.5rem] flex flex-col overflow-x-hidden" style={{ minHeight: '100dvh' }}>
        <TopNav onMenuClick={() => setOpen((s) => !s)} />
        <main
          className="flex-1 container-pad py-3 sm:py-4 overflow-x-hidden"
          style={{
            paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + var(--main-bottom-pad, 88px))',
          }}
        >
          <div key={location.pathname} className="route-enter w-full">
            <Outlet />
          </div>
        </main>
        <footer
          className="hidden md:block py-2.5 text-center text-caption text-on-surface-variant border-t border-outline-variant/40"
        >
          © 2026 La Mundial de Seguros · 52 años contigo · Auto Casco · Demo
        </footer>
      </div>
      <BottomNav />
    </div>
  )
}
