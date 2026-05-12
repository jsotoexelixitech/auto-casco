import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './components/layout/AppLayout'
import { WelcomeSplash } from './components/WelcomeSplash'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
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
import NotFoundPage from './pages/NotFoundPage'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <WelcomeSplash />
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
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
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/configuracion" element={<SettingsPage />} />
        <Route path="/ayuda" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
    </>
  )
}
