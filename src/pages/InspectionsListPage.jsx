import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import StatCard from '../components/ui/StatCard'
import { useData } from '../context/DataContext'

const FILTERS = [
  'Todas',
  'En Progreso',
  'Pendiente de Validación',
  'Aprobada',
  'Rechazada',
]

const TIPOS = [
  {
    id: 'auto',
    label: 'Auto-Gestionable',
    sub: 'Cliente',
    icon: 'smartphone',
    desc: 'Captura guiada con IA desde el móvil del cliente.',
  },
  {
    id: 'in-situ',
    label: 'In-situ',
    sub: 'Perito',
    icon: 'support_agent',
    desc: 'Inspección presencial realizada por un perito.',
  },
  {
    id: 'video',
    label: 'Videollamada',
    sub: 'Asistida',
    icon: 'videocam',
    desc: 'Perito guía al cliente en tiempo real.',
  },
]

export default function InspectionsListPage() {
  const { inspections, getVehicle } = useData()
  const [filter, setFilter] = useState('Todas')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return inspections.filter((i) => {
      const v = getVehicle(i.vehicleId)
      const matchSearch =
        !search ||
        [i.numero, i.tipo, v?.placa, v?.marca, v?.modelo]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchFilter = filter === 'Todas' || i.estado === filter
      return matchSearch && matchFilter
    })
  }, [inspections, search, filter, getVehicle])

  const stats = useMemo(() => {
    const total = inspections.length
    const enProg = inspections.filter((i) => i.estado === 'En Progreso').length
    const pend = inspections.filter(
      (i) => i.estado === 'Pendiente de Validación',
    ).length
    const apro = inspections.filter((i) => i.estado === 'Aprobada').length
    return { total, enProg, pend, apro }
  }, [inspections])

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Inspecciones' }]}
        title="Inspecciones"
        subtitle="Captura guiada de imágenes y video con flujos diferenciados para cliente y perito."
        actions={
          <Link to="/inspecciones/nueva" className="btn-accent">
            <Icon name="add_a_photo" /> Nueva
          </Link>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <StatCard icon="verified" label="Total" value={stats.total} tone="primary" />
        <StatCard icon="autorenew" label="En progreso" value={stats.enProg} hint="captura activa" />
        <StatCard
          icon="rule"
          label="Por validar"
          value={stats.pend}
          tone="accent"
          hint="esperando perito"
        />
        <StatCard
          icon="task_alt"
          label="Aprobadas"
          value={stats.apro}
          tone="success"
        />
      </section>

      {/* Tipos de inspección */}
      <section className="mb-5 sm:mb-6">
        <h3 className="text-headline-md mb-3 text-on-surface">
          Iniciar nueva inspección
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {TIPOS.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/inspecciones/nueva?tipo=${t.id}`)}
              className="card p-4 sm:p-5 group hover:-translate-y-0.5 hover:shadow-elev-2 hover:border-primary transition-all text-left active:scale-[0.99]"
            >
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-brand-soft text-on-primary flex items-center justify-center shrink-0 group-hover:scale-110 transition shadow-elev-primary">
                  <Icon name={t.icon} className="text-[22px]" filled />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-caption font-bold text-accent-500 uppercase tracking-wider">
                    {t.sub}
                  </p>
                  <h4 className="text-body-lg font-bold text-on-surface mb-0.5">
                    {t.label}
                  </h4>
                  <p className="text-caption text-on-surface-variant line-clamp-2">{t.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-primary text-label-md mt-3 group-hover:gap-2 transition-all">
                Iniciar <Icon name="arrow_forward" className="text-[16px]" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Filters */}
      <div className="card p-3 mb-3 flex flex-col gap-3">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar por número, tipo, placa…"
          />
        </div>
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-full overflow-x-auto no-scrollbar -mx-1">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 sm:px-4 min-h-[40px] py-1.5 rounded-full text-label-md transition whitespace-nowrap shrink-0 ${
                filter === f
                  ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
                  : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile: cards. Desktop: table */}
      <div className="md:hidden flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center text-on-surface-variant">
            Sin inspecciones que coincidan.
          </div>
        ) : (
          filtered.map((i) => {
            const v = getVehicle(i.vehicleId)
            return (
              <button
                key={i.id}
                onClick={() => navigate(`/inspecciones/${i.id}`)}
                className="card p-3 flex gap-3 text-left hover:border-primary transition active:scale-[0.99]"
              >
                {v && (
                  <img
                    src={v.image}
                    alt=""
                    className="w-16 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-on-surface truncate">{i.numero}</p>
                    <StatusChip status={i.estado} size="sm" />
                  </div>
                  <p className="text-label-md text-on-surface truncate">
                    {v?.marca} {v?.modelo} · {v?.placa}
                  </p>
                  <p className="text-caption text-on-surface-variant truncate">
                    {i.tipo}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-surface-container h-1.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-accent rounded-full"
                        style={{ width: `${i.progreso}%` }}
                      />
                    </div>
                    <span className="text-caption font-bold text-on-surface w-8 text-right">
                      {i.progreso}%
                    </span>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>

      <div className="hidden md:block card overflow-hidden">
        <table className="w-full">
          <thead className="bg-surface-container-low border-b border-outline-variant/60">
            <tr className="text-left text-caption uppercase tracking-wider text-on-surface-variant">
              <th className="px-4 py-3">Inspección</th>
              <th className="px-4 py-3">Vehículo</th>
              <th className="px-4 py-3 hidden lg:table-cell">Tipo</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Progreso</th>
              <th className="px-4 py-3 text-right" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => {
              const v = getVehicle(i.vehicleId)
              return (
                <tr
                  key={i.id}
                  onClick={() => navigate(`/inspecciones/${i.id}`)}
                  className="border-b border-outline-variant/40 last:border-0 hover:bg-surface-container-low cursor-pointer transition"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-on-surface">{i.numero}</p>
                    <p className="text-caption text-on-surface-variant">
                      {new Date(i.fechaCreacion).toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {v && (
                        <img
                          src={v.image}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="text-label-md text-on-surface truncate">
                          {v?.marca} {v?.modelo}
                        </p>
                        <p className="text-caption text-on-surface-variant tracking-wider">
                          {v?.placa}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-body-md text-on-surface-variant">
                      {i.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusChip status={i.estado} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 lg:w-24 bg-surface-container h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-accent rounded-full"
                          style={{ width: `${i.progreso}%` }}
                        />
                      </div>
                      <span className="text-caption font-bold text-on-surface w-8">
                        {i.progreso}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Icon
                      name="arrow_forward"
                      className="text-on-surface-variant"
                    />
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-on-surface-variant">
                  Sin inspecciones que coincidan con los filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}
