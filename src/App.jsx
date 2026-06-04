import { Navigate, Route, Routes } from 'react-router-dom'
import ErrorBoundary from './components/ui/ErrorBoundary'
import { useAuth } from './context/AuthContext'
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
import HelpPage from './pages/HelpPage'
import ProfilePage from './pages/ProfilePage'
import SettingsPage from './pages/SettingsPage'
import PlanesVidaPage from './pages/PlanesVidaPage'
import SaludTradicionalPage from './pages/SaludTradicionalPage'
import RecargaSaldoPage from './pages/RecargaSaldoPage'
import ConfiguracionIAPage from './pages/ConfiguracionIAPage'
import NotFoundPage from './pages/NotFoundPage'
import InstallPWA from './components/ui/InstallPWA'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
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
      <InstallPWA />
    <ErrorBoundary>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* ProtectedRoute temporalmente desactivado para revisión sin login */}
      <Route
        element={
          // <ProtectedRoute>
            <AppLayout />
          // </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<ProductosPage />} />
        <Route path="/movimientos" element={<MovimientosPage />} />
        <Route path="/polizas" element={<PoliciesPage />} />
        <Route path="/polizas/:id" element={<PolicyDetailPage />} />
        <Route path="/inspecciones" element={<InspectionsListPage />} />
        <Route path="/inspecciones/nueva" element={<InspectionWizardPage />} />
        <Route path="/inspecciones/:id" element={<InspectionWizardPage />} />
        <Route path="/cobertura" element={<CoveragePage />} />
        <Route path="/emision" element={<EmissionPage />} />
        <Route path="/siniestros" element={<SiniestrosPage />} />
        <Route path="/siniestros/nueva" element={<SiniestroNuevoPage />} />
        <Route path="/siniestros/:id" element={<SiniestroDetailPage />} />
        <Route path="/pagos" element={<PaymentsPage />} />
        <Route path="/planes-vida" element={<PlanesVidaPage />} />
        <Route path="/salud-tradicional" element={<SaludTradicionalPage />} />
        <Route path="/recarga-saldo" element={<RecargaSaldoPage />} />
        <Route path="/configuracion-ia" element={<ConfiguracionIAPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/ajustes" element={<SettingsPage />} />
        <Route path="/ayuda" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </ErrorBoundary>
    </>
  )
}
