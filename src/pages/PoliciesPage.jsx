import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'

export default function PoliciesPage() {
  const { policies, getVehicle } = useData()
  const [filter, setFilter] = useState('Todas')
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    return policies.filter((p) => {
      const v = getVehicle(p.vehicleId)
      const matchSearch =
        !search ||
        [p.numero, v?.placa, v?.marca, v?.modelo]
          .join(' ')
          .toLowerCase()
          .includes(search.toLowerCase())
      const matchFilter = filter === 'Todas' || p.estado === filter
      return matchSearch && matchFilter
    })
  }, [policies, filter, search, getVehicle])

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Pólizas' },
        ]}
        title="Pólizas"
        subtitle="Gestiona todas las pólizas de Auto Casco emitidas en la plataforma."
        actions={
          <Link to="/inspecciones/nueva" className="btn-primary">
            <Icon name="add" /> <span className="hidden sm:inline">Emitir Póliza</span>
            <span className="sm:hidden">Emitir</span>
          </Link>
        }
      />

      <div className="card p-3 mb-4 flex flex-col gap-3">
        <div className="relative">
          <Icon
            name="search"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-10"
            placeholder="Buscar por número, placa, marca…"
          />
        </div>
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-full overflow-x-auto no-scrollbar -mx-1">
          {['Todas', 'Activa', 'Inactiva'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 min-h-[40px] py-1.5 rounded-full text-label-md transition whitespace-nowrap shrink-0 ${
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {filtered.map((p) => {
          const v = getVehicle(p.vehicleId)
          const pct = Math.min(
            100,
            ((p.diasRestantes ?? 0) / (p.diasContratados || 1)) * 100,
          )
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => navigate(`/polizas/${p.id}`)}
              className="safe-clip card p-0 text-left group hover:-translate-y-1 hover:shadow-elev-2 transition-[transform,box-shadow] duration-300 ease-out active:scale-[0.99]"
            >
              <div className="relative h-36 sm:h-40 bg-surface-container overflow-hidden rounded-t-xl isolate">
                {v && (
                  <img
                    src={v.image}
                    alt={`${v.marca} ${v.modelo}`}
                    className="w-full h-full object-cover transform-gpu group-hover:scale-105 transition-transform duration-500 ease-out"
                    draggable={false}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <div className="absolute top-2 right-2">
                  <StatusChip status={p.estado} size="sm" />
                </div>
                <div className="absolute bottom-2 left-3 right-3 flex items-end justify-between text-white gap-2">
                  <div className="min-w-0">
                    <p className="text-[10px] opacity-90 uppercase tracking-wider">Placa</p>
                    <p className="font-bold tracking-wider truncate text-sm sm:text-base">{v?.placa}</p>
                  </div>
                  <div className="text-right min-w-0">
                    <p className="text-[10px] opacity-90 uppercase tracking-wider">Plan</p>
                    <p className="font-bold truncate text-sm sm:text-base">{p.plan}</p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-1 gap-2">
                  <p className="text-caption font-bold uppercase tracking-wider text-on-surface-variant truncate">
                    {p.numero}
                  </p>
                  <span className="text-caption text-on-surface-variant whitespace-nowrap">
                    {p.modalidad}
                  </span>
                </div>
                <h3 className="text-body-lg font-bold text-on-surface truncate">
                  {v?.marca} {v?.modelo}{' '}
                  <span className="text-on-surface-variant font-normal">
                    {v?.anio}
                  </span>
                </h3>
                <div className="mt-3">
                  <div className="flex justify-between text-caption mb-1">
                    <span className="text-on-surface-variant">Días restantes</span>
                    <span className="font-bold text-on-surface">
                      {p.diasRestantes} / {p.diasContratados}
                    </span>
                  </div>
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pct > 30 ? 'bg-gradient-brand-soft' : 'bg-gradient-accent'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-outline-variant/50">
                  <div className="min-w-0">
                    <p className="text-caption text-on-surface-variant">Prima</p>
                    <p className="text-label-md font-bold truncate">${p.prima}</p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption text-on-surface-variant">Saldo</p>
                    <p className="text-label-md font-bold text-accent-500 truncate">
                      ${p.saldo}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <p className="text-caption text-on-surface-variant">Cobertura</p>
                    <p className="text-label-md font-bold truncate">
                      {p.coberturas.length} ítems
                    </p>
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </>
  )
}
