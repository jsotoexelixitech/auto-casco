import Icon from '../ui/Icon'

const QUICK_LINKS = [
  { label: 'Inspección Vehicular', icon: 'car_repair',      to: '/inspecciones/nueva' },
  { label: 'Mis inspecciones',     icon: 'verified',        to: '/inspecciones' },
  { label: 'Planes de Vida',       icon: 'favorite_border', to: '/planes-vida' },
  { label: 'Configuración IA',     icon: 'tune',            to: '/configuracion-ia' },
  { label: 'Centro de ayuda',      icon: 'help',            to: '/ayuda' },
]

export default function SearchPalette({ search, setSearch, results, onClose, onSelect, getVehicle }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center p-3 sm:pt-[12vh] animate-fade-in"
      style={{ paddingTop: 'max(12px, env(safe-area-inset-top, 12px))' }}
    >
      <div className="absolute inset-0 bg-brand-900/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl card-elev2 p-0 overflow-hidden">
        <div className="flex items-center gap-2 p-3 border-b border-outline-variant/40">
          <Icon name="search" className="text-on-surface-variant text-[22px] ml-1" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por número, placa, tipo…"
            className="flex-1 bg-transparent border-0 outline-none text-body-lg text-on-surface placeholder:text-on-surface-variant/60"
            style={{ fontSize: '16px' }}
          />
          <kbd className="hidden sm:inline-flex items-center text-[11px] text-on-surface-variant border border-outline-variant px-1.5 py-0.5 rounded">
            ESC
          </kbd>
          <button onClick={onClose} className="btn-icon sm:hidden" aria-label="Cerrar">
            <Icon name="close" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!search.trim() ? (
            <div>
              <p className="text-caption text-on-surface-variant uppercase tracking-wider px-2 py-1">
                Acciones rápidas
              </p>
              {QUICK_LINKS.map((q) => (
                <button
                  key={q.to}
                  onClick={() => onSelect(q.to)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low transition text-left"
                >
                  <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                    <Icon name={q.icon} filled />
                  </div>
                  <span className="flex-1 font-semibold text-on-surface truncate">{q.label}</span>
                  <Icon name="arrow_forward" className="text-on-surface-variant" />
                </button>
              ))}
            </div>
          ) : results?.total === 0 ? (
            <div className="text-center p-8">
              <Icon name="search_off" className="text-[40px] text-on-surface-variant" />
              <p className="text-body-md text-on-surface-variant mt-1">
                Sin resultados para "<strong>{search}</strong>"
              </p>
            </div>
          ) : (
            <>
              {results.polRes.length > 0 && (
                <ResultGroup label="Pólizas" icon="policy">
                  {results.polRes.map((p) => {
                    const v = getVehicle(p.vehicleId)
                    return (
                      <ResultItem
                        key={p.id}
                        title={`${p.numero} · ${v?.marca} ${v?.modelo}`}
                        sub={`${v?.placa} · ${p.plan}`}
                        onClick={() => onSelect(`/polizas/${p.id}`)}
                      />
                    )
                  })}
                </ResultGroup>
              )}
              {results.insRes.length > 0 && (
                <ResultGroup label="Inspecciones" icon="verified">
                  {results.insRes.map((i) => {
                    const v = getVehicle(i.vehicleId)
                    return (
                      <ResultItem
                        key={i.id}
                        title={`${i.numero} · ${v?.marca} ${v?.modelo}`}
                        sub={`${i.tipo} · ${i.estado}`}
                        onClick={() => onSelect(`/inspecciones/${i.id}`)}
                      />
                    )
                  })}
                </ResultGroup>
              )}
              {results.sinRes.length > 0 && (
                <ResultGroup label="Siniestros" icon="car_crash">
                  {results.sinRes.map((s) => {
                    const v = getVehicle(s.vehicleId)
                    return (
                      <ResultItem
                        key={s.id}
                        title={`${s.id} · ${s.tipo}`}
                        sub={`${v?.placa ?? ''} · ${s.estado}`}
                        onClick={() => onSelect('/siniestros')}
                      />
                    )
                  })}
                </ResultGroup>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ResultGroup({ label, icon, children }) {
  return (
    <div className="mb-1">
      <p className="text-caption text-on-surface-variant uppercase tracking-wider px-2 py-1 flex items-center gap-1">
        <Icon name={icon} className="text-[14px]" />
        {label}
      </p>
      {children}
    </div>
  )
}

function ResultItem({ title, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 p-2.5 rounded-lg hover:bg-surface-container-low transition text-left"
    >
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface truncate">{title}</p>
        <p className="text-caption text-on-surface-variant truncate">{sub}</p>
      </div>
      <Icon name="north_east" className="text-on-surface-variant text-[18px]" />
    </button>
  )
}
