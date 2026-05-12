import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import StatusChip from '../../components/ui/StatusChip'
import {
  ESTADO_PIEZA,
  PHOTO_SEQUENCES,
  calcularAsegurabilidad,
} from '../../data/mockData'
import { useAuth } from '../../context/AuthContext'

export default function Step5Review({ state, inspectionNumber }) {
  const {
    docs,
    tomador,
    vehiculo,
    ubicacion,
    photos,
    danios,
    video360,
    tipoInspeccion,
    descripcionDanios,
    observacionesRiesgo,
    iaDiagnostico,
  } = state
  const { user } = useAuth()
  const isPerito = user?.role === 'perito' || user?.role === 'admin'

  const totals = PHOTO_SEQUENCES.reduce(
    (acc, s) => {
      const ph = photos[s.id]
      if (ph?.uploaded) acc.uploaded++
      Object.values(ph?.piezas ?? {}).forEach((p) => {
        acc.piezas++
        if (p.estado === ESTADO_PIEZA.MALO) acc.malos++
        else if (p.estado === ESTADO_PIEZA.REGULAR) acc.regulares++
        else if (p.estado === ESTADO_PIEZA.NO_EXISTE) acc.faltantes++
      })
      return acc
    },
    { uploaded: 0, piezas: 0, malos: 0, regulares: 0, faltantes: 0 },
  )

  const asegurabilidad = calcularAsegurabilidad(photos)

  /* ─── CLIENT VIEW ─────────────────────────────────────────────────── */
  if (!isPerito) {
    return (
      <div className="flex flex-col gap-4">
        {/* Brand hero confirmation */}
        <div className="rounded-2xl p-5 sm:p-6 relative overflow-hidden text-white"
          style={{ background: 'linear-gradient(135deg, #0F1A5A 0%, #162A7F 60%, #E84F51 100%)' }}>
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(232,79,81,0.25)' }} />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-2xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              <Icon name="task_alt" className="text-[36px] text-white" filled />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] uppercase tracking-widest opacity-70 mb-0.5">La Mundial de Seguros</p>
              <h2 className="text-headline-lg sm:text-display-sm font-bold leading-tight">
                ¡Inspección completada!
              </h2>
              <p className="opacity-85 mt-1 text-body-md">
                Número <span className="font-mono font-bold">{inspectionNumber}</span> — tus fotos fueron enviadas para revisión.
              </p>
            </div>
          </div>
          <div className="relative mt-4 pt-4 border-t border-white/20 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Fotos capturadas" value={`${totals.uploaded} / ${PHOTO_SEQUENCES.length}`} />
            <Stat label="Estado" value="En revisión" />
            <Stat label="Video 360°" value={video360.uploaded ? 'Cargado ✓' : 'No cargado'} />
          </div>
        </div>

        {/* Info message */}
        <div className="flex items-start gap-3 p-4 bg-brand-50 border border-brand-200 rounded-xl">
          <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shrink-0 shadow-elev-primary">
            <Icon name="info" className="text-[20px]" filled />
          </div>
          <div>
            <p className="font-bold text-primary">¿Qué pasa ahora?</p>
            <p className="text-body-md text-on-surface mt-0.5">
              Un perito de La Mundial de Seguros revisará tu inspección y te notificará el resultado. Puedes cerrar esta pantalla.
            </p>
          </div>
        </div>

        {/* Vehicle + holder */}
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
          </div>
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
              <Icon name="directions_car" className="text-primary" filled /> Datos del Vehículo
            </h3>
            <Field label="Marca / Modelo" value={`${vehiculo.marca || '—'} ${vehiculo.modelo || ''}`} />
            <Field label="Placa" value={vehiculo.placa || '—'} mono />
            <Field label="Color" value={vehiculo.color || '—'} />
          </div>
        </div>

        {/* Photo grid — no AI indicators */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3">Fotos capturadas</h3>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
            {PHOTO_SEQUENCES.map((s) => {
              const ph = photos[s.id]
              return (
                <div key={s.id} className={clsx('rounded-xl overflow-hidden relative aspect-square', ph?.uploaded ? 'border border-success/30' : 'border border-outline-variant/50 bg-surface-container-low')}>
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

        {/* Integration info */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3">Próximos pasos</h3>
          <Integration icon="gavel" label="Revisión por perito calificado" />
          <Integration icon="notifications_active" label="Notificación del resultado" />
          <Integration icon="edit_document" label="Emisión de póliza (si aplica)" />
        </div>
      </div>
    )
  }

  /* ─── PERITO VIEW ──────────────────────────────────────────────────── */
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 flex flex-col gap-4">
        {/* Asegurabilidad verdict — perito only */}
        <div className={clsx('rounded-2xl p-4 sm:p-5 flex items-start gap-3 border-2',
          asegurabilidad.asegurable ? 'bg-success-container/40 border-success/50 text-on-success-container' : 'bg-error-container/40 border-error/50 text-on-error-container',
        )}>
          <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', asegurabilidad.asegurable ? 'bg-success text-on-success' : 'bg-error text-on-error')}>
            <Icon name={asegurabilidad.asegurable ? 'verified' : 'gpp_bad'} className="text-[26px]" filled />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-caption uppercase tracking-widest font-bold opacity-70 mb-0.5">Resultado de Asegurabilidad</p>
            <h3 className="text-headline-lg font-bold leading-tight">
              {asegurabilidad.asegurable ? 'VEHÍCULO ASEGURABLE' : 'VEHÍCULO NO ASEGURABLE'}
            </h3>
            <p className="text-body-md mt-1 opacity-90">
              {asegurabilidad.asegurable
                ? `Cumple criterios. Piezas R: ${asegurabilidad.totalR} · M: ${asegurabilidad.totalM}`
                : `Supera límite. Piezas R: ${asegurabilidad.totalR} · M: ${asegurabilidad.totalM} · Total R+M: ${asegurabilidad.totalRM} (máx. 14)`}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={clsx('px-2.5 py-1 rounded-full text-caption font-bold border', asegurabilidad.asegurable ? 'bg-success/20 border-success/40' : 'bg-error/20 border-error/40')}>{asegurabilidad.totalR} Regulares</span>
              <span className={clsx('px-2.5 py-1 rounded-full text-caption font-bold border', asegurabilidad.totalM > 0 ? 'bg-error/20 border-error/40' : 'bg-success/10 border-success/30')}>{asegurabilidad.totalM} Malos</span>
              <span className="px-2.5 py-1 rounded-full text-caption font-bold border bg-surface-container/50 border-outline-variant/50 text-on-surface">{totals.piezas} Total piezas</span>
            </div>
          </div>
        </div>

        {/* Hero summary — perito */}
        <div className="card-elev2 p-4 sm:p-5 overflow-hidden relative text-white rounded-2xl" style={{ background: 'linear-gradient(135deg, #091133 0%, #0F1A5A 60%, #162A7F 100%)' }}>
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(232,79,81,0.3)' }} />
          <div className="relative z-10">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 flex-wrap">
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
                <Icon name="admin_panel_settings" className="text-white text-[26px]" filled />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] opacity-70 uppercase tracking-widest font-bold">La Mundial de Seguros · Perito</p>
                <h2 className="text-headline-lg leading-tight truncate">{inspectionNumber}</h2>
              </div>
              <StatusChip tone="warning" status="Pendiente Validación" icon="rule" size="sm" className="shrink-0" />
            </div>
            <p className="text-body-md sm:text-body-lg opacity-90 mb-3">
              Revisa el informe técnico completo antes de enviar para validación.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
              <Stat label="Fotos" value={`${totals.uploaded}/${PHOTO_SEQUENCES.length}`} />
              <Stat label="Piezas" value={totals.piezas} />
              <Stat label="Daños" value={danios.length} />
              <Stat label="Video 360°" value={video360.uploaded ? '✓' : '—'} />
            </div>
          </div>
        </div>

        {/* Vehicle + holder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
              <Icon name="person" className="text-primary" filled /> Tomador
            </h3>
            <Field label="Tipo" value={docs.naturaleza === 'juridica' ? 'Persona Jurídica' : 'Persona Natural'} />
            {docs.naturaleza === 'juridica' ? (
              <Field label="Razón Social" value={tomador.razonSocial} />
            ) : (
              <Field label="Nombre completo" value={`${tomador.nombres} ${tomador.apellidos}`} />
            )}
            <Field label="Documento" value={tomador.documento} mono />
            <Field label="Email" value={tomador.email || '—'} />
            <Field label="Teléfono" value={tomador.telefono || '—'} />
          </div>
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
              <Icon name="directions_car" className="text-primary" filled /> Vehículo
            </h3>
            <Field label="Marca / Modelo" value={`${vehiculo.marca || '—'} ${vehiculo.modelo || ''}`} />
            <Field label="Año" value={vehiculo.anio || '—'} />
            <Field label="Placa" value={vehiculo.placa || '—'} mono />
            <Field label="Color" value={vehiculo.color || '—'} />
            <Field label="Serial" value={vehiculo.serial || '—'} mono />
          </div>
        </div>

        {/* Captured sequences */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3">
            Secuencias fotográficas
          </h3>
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 gap-2">
            {PHOTO_SEQUENCES.map((s) => {
              const ph = photos[s.id]
              return (
                <div
                  key={s.id}
                  className={clsx(
                    'rounded-xl overflow-hidden relative aspect-square',
                    ph.uploaded
                      ? 'border border-success/30'
                      : 'border border-outline-variant/50 bg-surface-container-low',
                  )}
                >
                  {ph.uploaded ? (
                    <img src={ph.thumbnail} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-on-surface-variant">
                      <Icon name="image_not_supported" className="text-[20px]" />
                      <span className="text-[10px] mt-1">Sin foto</span>
                    </div>
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-1.5 py-1 text-white">
                    <p className="text-[10px] font-bold leading-tight line-clamp-2">
                      {s.nombre}
                    </p>
                  </div>
                  {ph.uploaded && ph.placaMatch === false && (
                    <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-warning text-on-warning flex items-center justify-center">
                      <Icon name="warning" className="text-[14px]" filled />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Descripción / Observaciones / Diagnóstico IA */}
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
                <p className="text-label-md text-on-surface-variant uppercase tracking-wide text-[10px] mb-1">Observaciones y Opinión del Riesgo</p>
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

        {isPerito && (
          <div className="card p-4 sm:p-5 border-2 border-error/20 bg-error-container/10">
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h3 className="text-headline-md text-on-surface flex items-center gap-2 min-w-0">
                <Icon name="report" className="text-error" filled />{' '}
                <span className="truncate">Informe de daños (Perito)</span>
              </h3>
              <StatusChip tone="error" icon="visibility_off" status="Confidencial" size="sm" />
            </div>
            {danios.length === 0 ? (
              <p className="text-on-surface-variant">
                Sin daños registrados durante la inspección.
              </p>
            ) : (
              <ul className="space-y-2">
                {danios.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-2 p-2.5 rounded-lg bg-white border border-outline-variant/40"
                  >
                    <div
                      className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                        d.severidad === 'leve' && 'bg-success-container text-on-success-container',
                        d.severidad === 'moderado' && 'bg-warning-container text-on-warning-container',
                        d.severidad === 'grave' && 'bg-error-container text-on-error-container',
                      )}
                    >
                      <Icon name="report" filled />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-on-surface capitalize truncate">
                        {d.tipo}
                      </p>
                      <p className="text-caption text-on-surface-variant truncate">
                        {d.ubicacion}
                      </p>
                    </div>
                    <span
                      className={clsx(
                        'chip uppercase',
                        d.severidad === 'leve' && 'bg-success-container text-on-success-container',
                        d.severidad === 'moderado' && 'bg-warning-container text-on-warning-container',
                        d.severidad === 'grave' && 'bg-error-container text-on-error-container',
                      )}
                    >
                      {d.severidad}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-4">
        {/* AI summary pills — perito only */}
        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
            <Icon name="auto_awesome" className="text-primary text-[20px]" filled />
            Resumen IA
          </h3>
          <DataRow label="Tipo de inspección" value={tipoInspeccion} />
          <DataRow label="Ubicación" value={ubicacion.direccion || '—'} />
          <div className="grid grid-cols-3 gap-1.5 mt-3 text-center">
            <Pill tone="success" value={totals.piezas - totals.regulares - totals.malos - totals.faltantes} label="Buenas" />
            <Pill tone="warning" value={totals.regulares} label="Regular" />
            <Pill tone="error" value={totals.malos} label="Malas" />
          </div>
        </div>

        <div className="card p-4 sm:p-5">
          <h3 className="text-headline-md text-on-surface mb-3">Integración</h3>
          <p className="text-body-md text-on-surface-variant mb-3">Al enviar, esta inspección se conectará con:</p>
          <Integration icon="request_quote" label="Módulo de Cotización" />
          <Integration icon="edit_document" label="Módulo de Emisión" />
          <Integration icon="receipt_long" label="Trazabilidad / Auditoría" />
        </div>

        <div className="card-elev2 p-4 sm:p-5 text-white relative overflow-hidden rounded-2xl" style={{ background: 'linear-gradient(135deg, #091133 0%, #0F1A5A 60%, #E84F51 100%)' }}>
          <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl" style={{ background: 'rgba(232,79,81,0.35)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="verified_user" className="text-accent-300" filled />
              <h4 className="font-bold">Estado al enviar</h4>
            </div>
            <p className="text-body-md opacity-90">
              Quedará en <strong style={{ color: '#ff8c8e' }}>Pendiente de Validación</strong> hasta la aprobación del perito.
            </p>
          </div>
        </div>
      </aside>
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
      <span className="text-caption text-on-surface-variant uppercase tracking-wider whitespace-nowrap">
        {label}
      </span>
      <span className={`text-on-surface text-label-md text-right truncate ${mono ? 'font-mono' : ''}`}>
        {value || '—'}
      </span>
    </div>
  )
}

function DataRow({ label, value }) {
  return (
    <div className="py-2 border-b border-outline-variant/30 last:border-0">
      <p className="text-caption text-on-surface-variant uppercase tracking-wider">
        {label}
      </p>
      <p className="text-on-surface font-semibold capitalize break-words">
        {value || '—'}
      </p>
    </div>
  )
}

function Pill({ tone, value, label }) {
  const TONE = {
    success: 'bg-success-container text-on-success-container',
    warning: 'bg-warning-container text-on-warning-container',
    error: 'bg-error-container text-on-error-container',
  }
  return (
    <div className={`rounded-lg p-2 ${TONE[tone]}`}>
      <p className="text-headline-md font-bold leading-none">{value}</p>
      <p className="text-[10px] uppercase mt-1 font-bold">{label}</p>
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
