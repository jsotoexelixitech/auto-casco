import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'

export default function SiniestrosPage() {
  const { siniestros, getVehicle } = useData()
  const navigate = useNavigate()

  const total = siniestros.reduce((acc, s) => acc + s.monto, 0)
  const enAnalisis = siniestros.filter((s) => s.estado === 'En Análisis').length

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Siniestros' },
        ]}
        title="Siniestros"
        subtitle="Seguimiento de siniestros, ajustes y reclamos asociados a tus pólizas."
        actions={
          <button onClick={() => navigate('/siniestros/nueva')} className="btn-primary">
            <Icon name="add" /> <span className="hidden sm:inline">Reportar</span> Siniestro
          </button>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <StatCard icon="car_crash" label="Total" value={siniestros.length} tone="deep" />
        <StatCard icon="pending_actions" label="En análisis" value={enAnalisis} tone="warning" />
        <StatCard icon="paid" label="Monto" value={`$${total.toLocaleString()}`} />
        <StatCard
          icon="trending_down"
          label="Aprobación"
          value="92%"
          tone="success"
          trend={{ dir: 'up', value: '+4%' }}
        />
      </section>

      {siniestros.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-on-surface-variant">
          <Icon name="car_crash" className="text-[64px] opacity-20" />
          <p className="text-headline-md">Sin siniestros reportados</p>
          <button onClick={() => navigate('/siniestros/nueva')} className="btn-primary">
            <Icon name="add" /> Reportar siniestro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {siniestros.map((s) => {
            const v = getVehicle(s.vehicleId)
            return (
              <button
                type="button"
                key={s.id}
                onClick={() => navigate(`/siniestros/${s.id}`)}
                className="card p-4 sm:p-5 group hover:-translate-y-0.5 hover:shadow-elev-2 hover:border-primary transition-all text-left active:scale-[0.99]"
              >
                <div className="flex items-center justify-between mb-2 gap-2">
                  <span className="text-caption font-bold uppercase tracking-wider text-on-surface-variant truncate">
                    {s.id}
                  </span>
                  <StatusChip status={s.estado} size="sm" />
                </div>
                <h3 className="text-headline-md text-on-surface truncate">{s.tipo}</h3>
                <p className="text-caption text-on-surface-variant truncate">
                  {s.fecha} · {v?.marca} {v?.modelo} · {v?.placa}
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-caption mb-1">
                    <span className="text-on-surface-variant">Avance</span>
                    <span className="font-bold text-on-surface">{s.avance}%</span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-accent rounded-full transition-all"
                      style={{ width: `${s.avance}%` }}
                    />
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-outline-variant/50 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-caption text-on-surface-variant uppercase tracking-wider">
                      Monto
                    </p>
                    <p className="text-headline-md font-bold text-primary truncate">
                      ${s.monto.toLocaleString()}
                    </p>
                  </div>
                  <span className="btn-ghost group-hover:bg-primary group-hover:text-on-primary group-hover:border-primary transition shrink-0">
                    <span className="hidden sm:inline">Ver detalle</span>
                    <Icon name="arrow_forward" className="text-[16px]" />
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </>
  )
}
