import Icon from '../../components/ui/Icon'
import { getDynamicSequences } from '../../utils/sequencesConfig'
import DetalleZonaFotografica from '../../components/inspection/DetalleZonaFotografica'
import { calcularPiezas } from '../../utils/planEngine'

export default function Step5Review({ state, inspectionNumber }) {
  const {
    docs,
    titular,
    vehiculo,
    ubicacion,
    photos,
    observacionesRiesgo,
  } = state

  const sequences = getDynamicSequences(vehiculo, photos)
  const uploadedSequences = sequences.filter((s) => photos[s.id]?.uploaded)
  const totals = {
    uploaded: uploadedSequences.length,
  }
  const piezasResumen = calcularPiezas(photos)
  const hallazgosDetectados = piezasResumen.regulares + piezasResumen.malas
  const tipoTitular = docs.tipoTitular ?? docs.naturaleza
  const esJuridica = tipoTitular === 'juridica'
  const persona = titular ?? {}

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)] gap-4 lg:items-start">
        {/* Columna izquierda: resumen + titular + vehículo */}
        <div className="flex flex-col gap-4">
        {/* Hero confirmation */}
        <div
          className="rounded-2xl p-4 sm:p-5 relative overflow-hidden text-white flex flex-col"
          style={{ backgroundColor: '#0F1A5A', borderLeft: '4px solid #ACACAC' }}
        >
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl" style={{ background: 'rgba(255,255,255,0.04)' }} />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full blur-2xl" style={{ background: 'rgba(255,255,255,0.03)' }} />
          <div className="relative flex flex-col gap-3 flex-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                <Icon name="task_alt" className="text-white" filled style={{ fontSize: '18px' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] uppercase tracking-widest opacity-70 mb-0.5">La Mundial de Seguros</p>
                <h2 className="text-label-md sm:text-headline-md font-bold leading-tight">¡Inspección completada!</h2>
                <div className="mt-2.5 flex flex-col gap-1 text-caption text-white/80">
                  <p className="font-semibold text-white">
                    {piezasResumen.total} piezas analizadas
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" aria-hidden />
                    {piezasResumen.buenas} en buen estado
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" aria-hidden />
                    {piezasResumen.regulares} con observación regular
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" aria-hidden />
                    {piezasResumen.malas} con daño grave
                  </p>
                </div>
              </div>
            </div>
            <div className="relative mt-auto pt-3 border-t border-white/20 grid grid-cols-2 gap-2">
              <Stat label="Fotos capturadas" value={totals.uploaded} />
              <Stat label="Hallazgos detectados" value={hallazgosDetectados} />
            </div>
          </div>
        </div>

        {/* Datos del vehículo */}
        <div className="card p-3 sm:p-4 flex flex-col">
          <h3 className="text-label-md sm:text-headline-md text-on-surface mb-2.5 flex items-center gap-2">
            <Icon name="directions_car" className="text-primary" filled /> Datos del Vehículo
          </h3>
          <div className="grid grid-cols-2 gap-1.5 flex-1 content-start">
            <VehicleField label="Marca" value={vehiculo.marca} />
            <VehicleField label="Modelo" value={vehiculo.modelo} />
            <VehicleField label="Color" value={vehiculo.color} />
            <VehicleField label="Año" value={vehiculo.anio} />
            <VehicleField label="Placa" value={vehiculo.placa} />
            <VehicleField label="Serial" value={vehiculo.serial} />
          </div>
        </div>

        {/* Datos del titular */}
        <div className="card p-3 sm:p-4 flex flex-col">
          <h3 className="text-label-md sm:text-headline-md text-on-surface mb-2.5 flex items-center gap-2">
            <Icon name="person" className="text-primary" filled /> Datos del Titular
          </h3>
          <div className="grid grid-cols-2 gap-1.5 flex-1 content-start">
            <VehicleField
              label="Tipo"
              value={esJuridica ? 'Persona Jurídica' : 'Persona Natural'}
            />
            <VehicleField label="Documento" value={persona.documento} />
            {esJuridica ? (
              <VehicleField label="Razón Social" value={persona.razonSocial} className="col-span-2" />
            ) : (
              <>
                <VehicleField label="Nombres" value={persona.nombres} />
                <VehicleField label="Apellidos" value={persona.apellidos} />
                <VehicleField label="Fecha de nacimiento" value={persona.fechaNacimiento} className="col-span-2" />
              </>
            )}
            <VehicleField label="Email" value={persona.email} />
            <VehicleField label="Teléfono" value={persona.telefono} />
            {/* {ubicacion?.direccion?.trim() ? (
              <VehicleField label="Ubicación" value={ubicacion.direccion} className="col-span-2" />
            ) : null} */}
          </div>
        </div>
        </div>

        {/* Columna derecha: fotos por zona */}
        <div className="min-w-0">
          <DetalleZonaFotografica photos={photos} />
        </div>
      </div>
      {observacionesRiesgo && (
        <div className="card p-4 sm:p-5 flex flex-col gap-3">
          <h3 className="text-headline-md text-on-surface flex items-center gap-2">
            <Icon name="assignment" className="text-primary" filled /> Observaciones adicionales
          </h3>
          <p className="text-body-md text-on-surface leading-relaxed bg-surface-container/50 rounded-lg p-3 border border-outline-variant/40">
            {observacionesRiesgo}
          </p>
        </div>
      )}
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

function VehicleField({ label, value, className = '' }) {
  return (
    <div className={`min-w-0 rounded-lg bg-white/85 border border-primary/15 px-2.5 py-2 flex flex-col gap-0.5 shadow-sm ${className}`}>
      <p className="text-[10px] font-bold text-primary/70 uppercase tracking-wider">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-semibold text-on-surface font-mono tracking-wide leading-snug break-words [overflow-wrap:anywhere]">
        {value || '—'}
      </p>
    </div>
  )
}
