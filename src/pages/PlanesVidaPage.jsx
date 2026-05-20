import { Link } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'

const C = {
  navy: '#0F1A5A',
  deep: '#091133',
}

const PLANES = [
  {
    icon: 'person',
    titulo: 'Vida Individual',
    descripcion: 'Protección personal completa para el asegurado. Cobertura ante fallecimiento, invalidez total o parcial, con indemnización directa a los beneficiarios designados.',
  },
  {
    icon: 'family_restroom',
    titulo: 'Vida Familiar',
    descripcion: 'Cobertura para todo el núcleo familiar bajo una sola póliza. Incluye al asegurado principal, cónyuge e hijos, con beneficios diferenciados por edad y cobertura.',
  },
  {
    icon: 'savings',
    titulo: 'Vida + Ahorro',
    descripcion: 'Seguro de vida con componente de ahorro a largo plazo. Cada prima aporta a un fondo de ahorro que crece con el tiempo, combinando protección y patrimonio futuro.',
  },
]

export default function PlanesVidaPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Planes de Vida' }]}
        title="Planes de Vida"
        subtitle="Protección para ti y los tuyos con los mejores planes de vida de La Mundial."
      />

      {/* Banner próximamente */}
      <div
        className="rounded-2xl p-4 sm:p-5 mb-6 text-white relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #091133 0%, #0F1A5A 60%, #162A7F 100%)' }}
      >
        <span className="absolute inset-y-0 left-0 w-1.5 rounded-l-2xl bg-white/30" />
        <div className="pl-3 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Icon name="construction" className="text-[28px]" filled />
          </div>
          <div className="min-w-0">
            <h2 className="text-headline-md font-bold mb-0.5">Próximamente disponible</h2>
            <p className="text-white/75 text-body-md">
              Estamos trabajando en los mejores planes de vida para ti. ¡Muy pronto podrás contratarlos desde aquí!
            </p>
          </div>
        </div>
      </div>

      {/* Cards de planes */}
      <section className="mb-6">
        <h3 className="text-headline-md font-bold mb-3" style={{ color: C.navy }}>
          Planes disponibles próximamente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANES.map((plan) => (
            <div key={plan.titulo} className="card p-4 sm:p-6 flex flex-col gap-4">
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #0F1A5A, #162A7F)', color: '#fff' }}
                >
                  <Icon name={plan.icon} className="text-[28px]" filled />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-headline-md font-bold text-on-surface">{plan.titulo}</h4>
                  <span
                    className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: '#162A7F' }}
                  >
                    <Icon name="schedule" className="text-[12px]" />
                    Próximamente
                  </span>
                </div>
              </div>
              <p className="text-body-md text-on-surface-variant leading-relaxed">
                {plan.descripcion}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <div
        className="rounded-2xl p-4 sm:p-6 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ backgroundColor: '#F8FAFF', border: '1px solid rgba(15,26,90,0.12)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(15,26,90,0.08)' }}
          >
            <Icon name="contact_support" className="text-[26px]" style={{ color: C.navy }} filled />
          </div>
          <div>
            <p className="text-label-md font-bold text-on-surface">¿Te interesa algún plan?</p>
            <p className="text-body-md text-on-surface-variant">
              Contáctanos y te asesoramos sin compromiso.
            </p>
          </div>
        </div>
        <Link to="/ayuda" className="btn-primary shrink-0">
          <Icon name="contact_support" className="text-[18px]" />
          Contáctanos
        </Link>
      </div>
    </>
  )
}
