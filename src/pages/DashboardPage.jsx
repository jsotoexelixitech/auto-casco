import { Link, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'

export default function DashboardPage() {
  const { user } = useAuth()
  const { policies, vehicles, inspections, activities, getVehicle } = useData()
  const navigate = useNavigate()

  const isPerito = user?.role === 'perito' || user?.role === 'admin'
  const myPolicy = policies[0]
  const myVehicle = getVehicle(myPolicy?.vehicleId)

  const inspectionsToValidate = inspections.filter(
    (i) =>
      i.estado === 'Pendiente de Validación' || i.estado === 'En Progreso',
  )

  return (
    <>
      <PageHeader
        eyebrow={`Hola, ${user?.name?.split(' ')[0] ?? 'Usuario'}`}
        title="Panel de Control"
        subtitle={
          isPerito
            ? 'Resumen ejecutivo de inspecciones, pólizas y siniestros activos.'
            : 'Resumen de tu póliza, cobertura y opciones rápidas.'
        }
        actions={
          <>
            <Link to="/inspecciones/nueva" className="btn-accent">
              <Icon name="add_a_photo" className="text-[20px]" />
              <span className="hidden sm:inline">Nueva</span> Inspección
            </Link>
            <Link to="/cobertura" className="btn-ghost hidden sm:inline-flex">
              <Icon name="bolt" /> Comprar Días
            </Link>
          </>
        }
      />

      {/* KPI grid — 2 col on mobile, scales up */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {isPerito ? (
          <>
            <StatCard
              icon="verified"
              label="Inspecciones"
              value={inspections.length}
              hint={`${inspectionsToValidate.length} requieren acción`}
              tone="primary"
              onClick={() => navigate('/inspecciones')}
            />
            <StatCard
              icon="policy"
              label="Pólizas Activas"
              value={policies.filter((p) => p.estado === 'Activa').length}
              hint={`de ${policies.length} totales`}
              trend={{ dir: 'up', value: '+12%' }}
              onClick={() => navigate('/polizas')}
            />
            <StatCard
              icon="directions_car"
              label="Vehículos"
              value={vehicles.length}
              hint="Asegurados"
              tone="accent"
            />
            <StatCard
              icon="auto_awesome"
              label="IA Confianza"
              value="98%"
              hint="Validación automática"
              trend={{ dir: 'up', value: '+1.2%' }}
              tone="success"
            />
          </>
        ) : (
          <>
            <StatCard
              icon="event_available"
              label="Días Restantes"
              value={myPolicy?.diasRestantes ?? 0}
              hint={`de ${myPolicy?.diasContratados ?? 0}`}
              tone="primary"
              onClick={() => navigate('/cobertura')}
            />
            <StatCard
              icon="account_balance_wallet"
              label="Saldo"
              value={`$${(myPolicy?.saldo ?? 0).toFixed(2)}`}
              hint="Disponible"
              tone="accent"
            />
            <StatCard
              icon="shield"
              label="Plan Activo"
              value={myPolicy?.plan ?? '—'}
              hint={myPolicy?.modalidad}
            />
            <StatCard
              icon="savings"
              label="Ahorro 30d"
              value="$45.00"
              hint="vs. tradicional"
              trend={{ dir: 'up', value: '18%' }}
              tone="success"
            />
          </>
        )}
      </section>

      {/* Vehicle hero + quick actions */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5 sm:mb-6">
        <div className="lg:col-span-2 card p-3 sm:p-5 flex flex-col md:flex-row gap-3 md:gap-5 items-stretch">
          <div className="md:w-[55%] aspect-[16/10] sm:aspect-[16/9] md:aspect-[4/3] rounded-xl overflow-hidden relative bg-surface-container shrink-0">
            {myVehicle && (
              <img
                src={myVehicle.image}
                alt={`${myVehicle.marca} ${myVehicle.modelo}`}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
            <div className="absolute top-2 left-2">
              <StatusChip status={myPolicy?.estado} size="sm" />
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between text-white gap-1">
              <div className="bg-black/50 backdrop-blur-md rounded-lg px-2.5 py-1 min-w-0">
                <p className="text-[10px] opacity-90 uppercase tracking-wider">Placa</p>
                <p className="font-bold tracking-wider text-sm truncate">{myVehicle?.placa}</p>
              </div>
              <div className="bg-black/50 backdrop-blur-md rounded-lg px-2.5 py-1 text-right min-w-0">
                <p className="text-[10px] opacity-90 uppercase tracking-wider">Póliza</p>
                <p className="font-bold text-sm truncate">#{myPolicy?.numero}</p>
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <p className="text-caption text-on-surface-variant uppercase tracking-wider font-bold">
                Vehículo principal
              </p>
              <h3 className="text-headline-md text-on-surface mt-1 truncate">
                {myVehicle?.marca} {myVehicle?.modelo} {myVehicle?.anio}
              </h3>
              <p className="text-body-md text-on-surface-variant truncate">
                {myVehicle?.version} · {myVehicle?.color}
              </p>
              <div className="bg-gradient-to-br from-surface-container to-surface-container-low rounded-xl p-3 sm:p-4 mt-3 border border-outline-variant/40">
                <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-0.5">
                  Días restantes
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-display-lg font-bold text-primary leading-none">
                    {myPolicy?.diasRestantes ?? 0}
                  </span>
                  <span className="text-body-md text-on-surface-variant">
                    / {myPolicy?.diasContratados ?? 0}
                  </span>
                </div>
                <div className="w-full bg-surface-container-high h-2 rounded-full mt-2 overflow-hidden">
                  <div
                    className="bg-gradient-accent h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ((myPolicy?.diasRestantes ?? 0) / (myPolicy?.diasContratados || 1)) * 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate('/cobertura')}
              className="btn-accent w-full mt-3"
            >
              <Icon name="shopping_cart" /> Comprar Días Ahora
            </button>
          </div>
        </div>

        <div className="flex flex-col xs:flex-row lg:flex-col gap-3 sm:gap-4">
          <BentoAction
            tone="primary"
            icon="calendar_month"
            title="Comprar Días"
            body="Activa tu seguro por el tiempo que necesites."
            to="/cobertura"
          />
          <BentoAction
            tone="light"
            icon="account_balance_wallet"
            title="Recargar Saldo"
            body="Añade fondos para futuras compras automáticas."
            to="/pagos"
          />
        </div>
      </section>

      {/* Lower row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-md text-on-surface">Uso Mensual</h3>
            <StatusChip
              tone="success"
              icon="trending_up"
              dot={false}
              status="Activo"
              size="sm"
            >
              Activo
            </StatusChip>
          </div>
          <div>
            <div className="flex justify-between text-label-md mb-1">
              <span className="text-on-surface-variant">Días utilizados</span>
              <span className="text-on-surface font-bold">12 / 30</span>
            </div>
            <div className="w-full bg-surface-container h-2.5 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-accent-500 transition-all"
                style={{ width: '40%' }}
              />
            </div>
          </div>

          {/* Mini bar chart */}
          <div className="mt-4 grid grid-cols-12 gap-0.5 sm:gap-1 h-20 sm:h-24 items-end">
            {[18, 22, 30, 14, 38, 26, 55, 42, 28, 44, 60, 33].map((h, i) => (
              <div
                key={i}
                className={clsx(
                  'rounded-t-md transition-all hover:scale-y-105 origin-bottom',
                  i === 10 ? 'bg-gradient-accent' : 'bg-primary/15',
                )}
                style={{ height: `${h}%` }}
                title={`Mes ${i + 1}: ${h}%`}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-outline-variant/50">
            <div>
              <p className="text-caption text-on-surface-variant uppercase">Ahorro</p>
              <p className="text-headline-md text-primary font-bold">$45</p>
            </div>
            <div>
              <p className="text-caption text-on-surface-variant uppercase">Sin uso</p>
              <p className="text-headline-md text-on-surface font-bold">18d</p>
            </div>
            <div>
              <p className="text-caption text-on-surface-variant uppercase">Costo prom.</p>
              <p className="text-headline-md text-on-surface font-bold">$3.75</p>
            </div>
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-headline-md text-on-surface">Actividad Reciente</h3>
            <Link to="/pagos" className="text-label-md text-primary hover:underline">
              Ver todo
            </Link>
          </div>
          <div className="flex flex-col">
            {activities.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-lg transition"
              >
                <div
                  className={clsx(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    a.tone === 'primary' && 'bg-primary-fixed text-primary',
                    a.tone === 'accent' && 'bg-secondary-fixed text-on-secondary-fixed-variant',
                    a.tone === 'success' && 'bg-success-container text-on-success-container',
                    a.tone === 'error' && 'bg-error-container text-on-error-container',
                  )}
                >
                  <Icon name={a.icon} className="text-[20px]" filled />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-md text-on-surface truncate">{a.title}</p>
                  <p className="text-caption text-on-surface-variant truncate">
                    {a.subtitle}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  {a.amount !== undefined && (
                    <p
                      className={clsx(
                        'text-label-md font-bold',
                        a.amount > 0 ? 'text-success' : 'text-on-surface',
                      )}
                    >
                      {a.amount > 0 ? '+' : ''}
                      {a.amount}$
                    </p>
                  )}
                  <p className="text-caption text-on-surface-variant whitespace-nowrap">
                    {a.when}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inspections to validate (perito) */}
      {isPerito && inspectionsToValidate.length > 0 && (
        <section className="mt-5 sm:mt-6">
          <div className="flex items-center justify-between mb-3 gap-2">
            <h3 className="text-headline-md text-on-surface">
              Atención requerida
            </h3>
            <Link to="/inspecciones" className="text-label-md text-primary hover:underline whitespace-nowrap">
              Ver todas →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {inspectionsToValidate.slice(0, 3).map((i) => {
              const v = getVehicle(i.vehicleId)
              return (
                <Link
                  to={`/inspecciones/${i.id}`}
                  key={i.id}
                  className="card p-4 group hover:border-primary hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <p className="text-caption font-bold text-on-surface-variant uppercase tracking-wider truncate">
                      {i.numero}
                    </p>
                    <StatusChip status={i.estado} size="sm" />
                  </div>
                  <h4 className="text-body-lg font-bold text-on-surface truncate">
                    {v?.marca} {v?.modelo}{' '}
                    <span className="text-on-surface-variant font-normal">
                      {v?.anio}
                    </span>
                  </h4>
                  <p className="text-caption text-on-surface-variant truncate">{i.tipo}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-caption text-on-surface-variant mb-1">
                      <span>Progreso</span>
                      <span className="font-bold text-on-surface">{i.progreso}%</span>
                    </div>
                    <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-accent rounded-full" style={{ width: `${i.progreso}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}

function BentoAction({ tone, icon, title, body, to }) {
  return (
    <Link
      to={to}
      className={clsx(
        'flex-1 rounded-xl p-4 sm:p-5 flex flex-col justify-between group cursor-pointer hover:shadow-elev-2 transition-all min-w-0',
        tone === 'primary'
          ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
          : 'card',
      )}
    >
      <div className="flex justify-between items-start mb-3">
        <div
          className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0',
            tone === 'primary'
              ? 'bg-white/15 text-accent-300'
              : 'bg-primary-fixed text-primary',
          )}
        >
          <Icon name={icon} className="text-[22px]" filled />
        </div>
        <Icon
          name="arrow_outward"
          className={clsx(
            'text-[18px] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform',
            tone === 'primary' ? 'opacity-60' : 'text-on-surface-variant',
          )}
        />
      </div>
      <div>
        <h4
          className={clsx(
            'text-headline-md mb-0.5 truncate',
            tone !== 'primary' && 'text-primary',
          )}
        >
          {title}
        </h4>
        <p
          className={clsx(
            'text-caption sm:text-body-md leading-snug line-clamp-2',
            tone === 'primary' ? 'opacity-80' : 'text-on-surface-variant',
          )}
        >
          {body}
        </p>
      </div>
    </Link>
  )
}
