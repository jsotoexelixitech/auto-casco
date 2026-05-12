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
    <div className="min-h-screen">
      <SideNav open={open} onClose={() => setOpen(false)} />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <TopNav onMenuClick={() => setOpen((s) => !s)} />
        <main
          className="flex-1 container-pad py-4 sm:py-5 md:py-6 lg:py-7 overflow-x-hidden"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 88px)' }}
        >
          <div className="max-w-container mx-auto w-full">
            <div key={location.pathname} className="route-enter">
              <Outlet />
            </div>
          </div>
        </main>
        <footer
          className="hidden md:block py-4 text-center text-caption text-on-surface-variant border-t border-outline-variant/40"
        >
          © 2026 La Mundial de Seguros · 52 años contigo · Auto Casco · Demo
        </footer>
      </div>
      <BottomNav />
    </div>
  )
}
