import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom'
import ErrorBoundary from './components/ui/ErrorBoundary'
import AppLayout from './components/layout/AppLayout'
import { WelcomeSplash } from './components/WelcomeSplash'
import LoginPage from './pages/LoginPage'
import ProductosPage from './pages/ProductosPage'
import MovimientosPage from './pages/MovimientosPage'
import PoliciesPage from './pages/PoliciesPage'
import PolicyDetailPage from './pages/PolicyDetailPage'
import InspectionsListPage from './pages/InspectionsListPage'
import InspectionWizardPage from './pages/InspectionWizardPage'
import CoveragePage from './pages/CoveragePage'
import EmissionPage from './pages/EmissionPage'
import SiniestrosPage from './pages/SiniestrosPage'
import SiniestroNuevoPage from './pages/SiniestroNuevoPage'
import SiniestroDetailPage from './pages/SiniestroDetailPage'
import PaymentsPage from './pages/PaymentsPage'
import PaymentResultPage from './pages/PaymentResultPage'
import HelpPage from './pages/HelpPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import PlanesVidaPage from './pages/PlanesVidaPage'
import SaludTradicionalPage from './pages/SaludTradicionalPage'
import RecargaSaldoPage from './pages/RecargaSaldoPage'
import ConfiguracionIAPage from './pages/ConfiguracionIAPage'
import NotFoundPage from './pages/NotFoundPage'

function AppRoot() {
  return (
    <>
      {/*
        Cubre la zona del status bar (notch / Dynamic Island) con color navy.
        - En iOS con viewport-fit=cover, este div se dibuja detrás del status bar
          transparente, haciendo que aparezca navy en lugar de blanco.
        - En Android, actúa como fondo de la zona superior.
        - z-index 9999: siempre encima de todo el contenido de la app.
      */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 'env(safe-area-inset-top, 0px)',
          backgroundColor: '#0F1A5A',
          zIndex: 9999,
        }}
        aria-hidden="true"
      />
      <WelcomeSplash />
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </>
  )
}

export function createAppRouter() {
  return createBrowserRouter([
    {
      element: <AppRoot />,
      children: [
        { path: '/login', element: <LoginPage /> },
        {
          // ProtectedRoute temporalmente desactivado para revisión sin login
          element: <AppLayout />,
          children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            { path: '/dashboard', element: <ProductosPage /> },
            { path: '/movimientos', element: <MovimientosPage /> },
            { path: '/polizas', element: <PoliciesPage /> },
            { path: '/polizas/:id', element: <PolicyDetailPage /> },
            { path: '/inspecciones', element: <InspectionsListPage /> },
            { path: '/inspecciones/nueva', element: <InspectionWizardPage /> },
            { path: '/inspecciones/:id', element: <InspectionWizardPage /> },
            { path: '/cobertura', element: <CoveragePage /> },
            { path: '/emision', element: <EmissionPage /> },
            { path: '/siniestros', element: <SiniestrosPage /> },
            { path: '/siniestros/nueva', element: <SiniestroNuevoPage /> },
            { path: '/siniestros/:id', element: <SiniestroDetailPage /> },
            { path: '/pagos', element: <PaymentsPage /> },
            { path: '/pago/resultado', element: <PaymentResultPage /> },
            { path: '/planes-vida', element: <PlanesVidaPage /> },
            { path: '/salud-tradicional', element: <SaludTradicionalPage /> },
            { path: '/recarga-saldo', element: <RecargaSaldoPage /> },
            { path: '/configuracion-ia', element: <ConfiguracionIAPage /> },
            { path: '/perfil', element: <ProfilePage /> },
            { path: '/ajustes', element: <SettingsPage /> },
            { path: '/ayuda', element: <HelpPage /> },
            { path: '*', element: <NotFoundPage /> },
          ],
        },
      ],
    },
  ])
}
