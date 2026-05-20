import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import { getActiveSequences } from '../../utils/sequencesConfig'

export default function Step5Review({ state, inspectionNumber }) {
  const {
    docs,
    tomador,
    vehiculo,
    ubicacion,
    photos,
    danios,
    video360,
    descripcionDanios,
    observacionesRiesgo,
    iaDiagnostico,
  } = state

  const activeSequences = getActiveSequences()
  const totals = activeSequences.reduce(
    (acc, s) => {
      const ph = photos[s.id]
      if (ph?.uploaded) acc.uploaded++
      Object.values(ph?.piezas ?? {}).forEach((p) => {
        acc.piezas++
      })
      return acc
    },
    { uploaded: 0, piezas: 0 },
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Hero confirmation */}
      <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden text-white"
        style={{ backgroundColor: '#0F1A5A', borderLeft: '4px solid #ACACAC' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
        <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
            <Icon name="task_alt" className="text-[36px] text-white" filled />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-widest opacity-70 mb-0.5">La Mundial de Seguros</p>
            <h2 className="text-headline-lg sm:text-display-sm font-bold leading-tight">¡Inspección completada!</h2>
            <p className="opacity-85 mt-1 text-body-md">
              Número <span className="font-mono font-bold">{inspectionNumber}</span> — tus fotos fueron analizadas por la IA.
            </p>
          </div>
          <StatusChip tone="success" status="Completada" icon="verified" size="sm" className="shrink-0 self-start sm:self-center" />
        </div>
        <div className="relative mt-4 pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat label="Fotos capturadas" value={`${totals.uploaded} / ${activeSequences.length}`} />
          <Stat label="Daños registrados" value={danios.length} />
          <Stat label="Video 360°" value={video360.uploaded ? 'Cargado ✓' : 'No cargado'} />
          <Stat label="Análisis IA" value="Completado ✓" />
        </div>
      </div>

      {/* Datos del tomador y vehículo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
            <Icon name="person" className="text-primary" filled /> Datos del Tomador
          </h3>
          <Field label="Tipo" value={docs.naturaleza === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'} />
          {docs.naturaleza === 'juridica' ? (
            <Field label="Razón Social" value={tomador.razonSocial} />
          ) : (
            <Field label="Nombre" value={`${tomador.nombres} ${tomador.apellidos}`} />
          )}
          <Field label="Documento" value={tomador.documento} mono />
          <Field label="Ubicación" value={ubicacion.direccion || '—'} />
        </div>
        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
            <Icon name="directions_car" className="text-primary" filled /> Datos del Vehículo
          </h3>
          <Field label="Marca / Modelo" value={`${vehiculo.marca || '—'} ${vehiculo.modelo || ''}`} />
          <Field label="Año" value={vehiculo.anio || '—'} />
          <Field label="Placa" value={vehiculo.placa || '—'} mono />
          <Field label="Color" value={vehiculo.color || '—'} />
          <Field label="Serial" value={vehiculo.serial || '—'} mono />
        </div>
      </div>

      {/* Fotos capturadas */}
      <div className="card p-4 sm:p-5">
        <h3 className="text-headline-md text-on-surface mb-3">Fotos capturadas</h3>
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
          {activeSequences.map((s) => {
            const ph = photos[s.id]
            return (
              <div key={s.id} className={clsx(
                'rounded-xl overflow-hidden relative aspect-square',
                ph?.uploaded ? 'border border-success/30' : 'border border-outline-variant/50 bg-surface-container-low',
              )}>
                {ph?.uploaded ? (
                  <img src={ph.thumbnail} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
                    <Icon name="image_not_supported" className="text-[20px]" />
                    <span className="text-[10px] mt-1">Sin foto</span>
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 py-1 text-white">
                  <p className="text-[10px] font-bold leading-tight line-clamp-2">{s.nombre}</p>
                </div>
                {ph?.uploaded && (
                  <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <Icon name="check" className="text-[12px] text-white" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Descripción / Diagnóstico IA (si fueron completados) */}
      {(descripcionDanios || observacionesRiesgo || iaDiagnostico) && (
        <div className="card p-4 sm:p-5 flex flex-col gap-4">
          <h3 className="text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="description" className="text-primary" filled /> Descripción y Observaciones
          </h3>
          {descripcionDanios && (
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wide text-[10px] mb-1">Descripción de los Daños</p>
              <p className="text-body-md text-on-surface leading-relaxed bg-surface-container/50 rounded-lg p-3 border border-outline-variant/40">{descripcionDanios}</p>
            </div>
          )}
          {observacionesRiesgo && (
            <div>
              <p className="text-label-md text-on-surface-variant uppercase tracking-wide text-[10px] mb-1">Observaciones adicionales</p>
              <p className="text-body-md text-on-surface leading-relaxed bg-surface-container/50 rounded-lg p-3 border border-outline-variant/40">{observacionesRiesgo}</p>
            </div>
          )}
          {iaDiagnostico && (
            <div className="flex items-start gap-2 p-3 bg-primary-fixed/20 border border-primary/20 rounded-xl">
              <Icon name="auto_awesome" className="text-primary text-[20px] mt-0.5 shrink-0" filled />
              <div>
                <p className="text-label-md font-semibold text-primary mb-1">Diagnóstico IA</p>
                <p className="text-body-md text-on-surface">{iaDiagnostico}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Próximos pasos */}
      <div className="card p-4 sm:p-5">
        <h3 className="text-headline-md text-on-surface mb-3">Próximos pasos</h3>
        <Integration icon="request_quote" label="Módulo de Cotización" />
        <Integration icon="edit_document" label="Módulo de Emisión" />
        <Integration icon="notifications_active" label="Notificación de resultado" />
        <Integration icon="receipt_long" label="Trazabilidad y Auditoría" />
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="bg-white/10 rounded-lg p-2.5 backdrop-blur min-w-0">
      <p className="text-caption opacity-80">{label}</p>
      <p className="text-headline-md font-bold truncate">{value}</p>
    </div>
  )
}

function Field({ label, value, mono }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-outline-variant/30 last:border-0 gap-2 min-w-0">
      <span className="text-caption text-on-surface-variant uppercase tracking-wider whitespace-nowrap">{label}</span>
      <span className={`text-on-surface text-label-md text-right truncate ${mono ? 'font-mono' : ''}`}>{value || '—'}</span>
    </div>
  )
}

function Integration({ icon, label }) {
  return (
    <div className="flex items-center gap-2 py-2 border-b border-outline-variant/40 last:border-0">
      <div className="w-9 h-9 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
        <Icon name={icon} filled />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-on-surface truncate">{label}</p>
        <p className="text-caption text-success">Conectado</p>
      </div>
      <Icon name="check_circle" className="text-success" filled />
    </div>
  )
}
