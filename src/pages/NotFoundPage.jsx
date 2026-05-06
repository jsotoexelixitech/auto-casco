import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-brand-soft text-on-primary flex items-center justify-center mb-3 shadow-elev-primary">
        <Icon name="explore_off" className="text-[40px] sm:text-[48px]" filled />
      </div>
      <h1 className="text-display-2xl text-primary mb-2">404</h1>
      <p className="text-headline-md text-on-surface mb-1">Página no encontrada</p>
      <p className="text-body-md text-on-surface-variant max-w-sm mb-4">
        La página que estás buscando no existe o fue movida.
      </p>
      <Link to="/dashboard" className="btn-primary">
        <Icon name="home" /> Volver al panel
      </Link>
    </div>
  )
}
