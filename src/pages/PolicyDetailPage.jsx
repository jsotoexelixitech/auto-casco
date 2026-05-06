import { Link, useNavigate, useParams } from 'react-router-dom'
import PageHeader from '../components/ui/PageHeader'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { downloadPdf } from '../utils/downloadPdf'

export default function PolicyDetailPage() {
  const { id } = useParams()
  const { getPolicy, getVehicle, inspections } = useData()
  const navigate = useNavigate()
  const toast = useToast()
  const policy = getPolicy(id)
  if (!policy) {
    return (
      <div className="card p-2xl text-center">
        <p>Póliza no encontrada</p>
        <button onClick={() => navigate('/polizas')} className="btn-ghost mt-md">
          Volver
        </button>
      </div>
    )
  }
  const vehicle = getVehicle(policy.vehicleId)
  const policyInspections = inspections.filter(
    (i) => i.vehicleId === policy.vehicleId,
  )

  const handleDownload = () => {
    const lines = [
      `Numero de poliza: ${policy.numero}`,
      `Estado: ${policy.estado}`,
      `Plan: ${policy.plan}  -  Modalidad: ${policy.modalidad}`,
      `Vigencia: ${policy.vigenciaDesde}  ->  ${policy.vigenciaHasta}`,
      `Dias: ${policy.diasRestantes} restantes / ${policy.diasContratados} contratados`,
      '',
      'Vehiculo asegurado',
      `${vehicle?.marca} ${vehicle?.modelo} ${vehicle?.anio} (${vehicle?.color})`,
      `Placa: ${vehicle?.placa}`,
      `Serial / VIN: ${vehicle?.serial}`,
      `Tipo: ${vehicle?.tipo}  -  Puestos: ${vehicle?.puestos}`,
      '',
      'Coberturas incluidas:',
      ...policy.coberturas.map(
        (c) =>
          `   - ${c.nombre}  /  Limite ${
            typeof c.limite === 'number' ? '$' + c.limite.toLocaleString() : c.limite
          }`,
      ),
      '',
      `Prima total: $${policy.prima.toLocaleString()}`,
      `Saldo disponible: $${policy.saldo.toFixed(2)}`,
      '',
      'Inspecciones asociadas:',
      ...(policyInspections.length === 0
        ? ['   (Sin inspecciones registradas)']
        : policyInspections.map(
            (i) => `   - ${i.numero}  -  ${i.tipo}  -  ${i.estado}`,
          )),
      '',
      'La Mundial de Seguros - 52 anos contigo',
      'Este es un documento generado en demo y no constituye una poliza real.',
    ]
    downloadPdf({
      title: `Poliza ${policy.numero}`,
      lines,
      filename: `${policy.numero}.pdf`,
    })
    toast.success('Póliza descargada en PDF', { title: '¡Listo!' })
  }

  const handleShare = async () => {
    const shareText = `Mi póliza ${policy.numero} de ${vehicle?.marca} ${vehicle?.modelo} - La Mundial de Seguros`
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Póliza ${policy.numero}`,
          text: shareText,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`)
        toast.success('Enlace copiado al portapapeles', { title: 'Compartir' })
      }
    } catch {
      /* user cancelled */
    }
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Pólizas', to: '/polizas' },
          { label: policy.numero },
        ]}
        eyebrow={policy.numero}
        title={`${vehicle?.marca} ${vehicle?.modelo} ${vehicle?.anio}`}
        subtitle={`Plan ${policy.plan} · ${policy.modalidad} · ${policy.vigenciaDesde} → ${policy.vigenciaHasta}`}
        actions={
          <>
            <Link to="/cobertura" className="btn-accent">
              <Icon name="bolt" /> Comprar Días
            </Link>
            <button onClick={handleShare} className="btn-icon" aria-label="Compartir">
              <Icon name="share" />
            </button>
            <button onClick={handleDownload} className="btn-ghost hidden sm:inline-flex">
              <Icon name="picture_as_pdf" /> Descargar
            </button>
            <button onClick={handleDownload} className="btn-icon sm:hidden" aria-label="Descargar">
              <Icon name="picture_as_pdf" />
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card p-0 overflow-hidden">
            <div className="relative h-56 sm:h-64 md:h-72 bg-surface-container">
              {vehicle && (
                <img
                  src={vehicle.image}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute top-3 left-3">
                <StatusChip status={policy.estado} />
              </div>
              <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2 text-white flex-wrap">
                <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <p className="text-[10px] opacity-80 uppercase tracking-wider">Placa</p>
                  <p className="text-headline-md font-bold tracking-wider">
                    {vehicle?.placa}
                  </p>
                </div>
                <div className="bg-black/55 backdrop-blur-md px-3 py-1.5 rounded-lg">
                  <p className="text-[10px] opacity-80 uppercase tracking-wider">Color</p>
                  <p className="font-bold">{vehicle?.color}</p>
                </div>
              </div>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              <Field label="Marca" value={vehicle?.marca} />
              <Field label="Modelo" value={vehicle?.modelo} />
              <Field label="Año" value={vehicle?.anio} />
              <Field label="Versión" value={vehicle?.version} />
              <Field label="Tipo" value={vehicle?.tipo} />
              <Field label="Color" value={vehicle?.color} />
              <Field label="Puestos" value={vehicle?.puestos} />
              <Field label="Kilometraje" value={vehicle?.kilometraje?.toLocaleString() + ' km'} />
              <Field label="Serial / VIN" value={vehicle?.serial} className="col-span-2 sm:col-span-3 md:col-span-4" mono />
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3">
              Coberturas Incluidas
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {policy.coberturas.map((c) => (
                <div
                  key={c.nombre}
                  className="flex items-center justify-between gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/40 min-w-0"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                      <Icon name="verified_user" filled />
                    </div>
                    <p className="font-semibold text-on-surface truncate">{c.nombre}</p>
                  </div>
                  <span className="text-label-md font-bold text-primary whitespace-nowrap">
                    {typeof c.limite === 'number' ? `$${c.limite.toLocaleString()}` : c.limite}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <h3 className="text-headline-md text-on-surface">
                Inspecciones del vehículo
              </h3>
              <Link to="/inspecciones/nueva" className="btn-ghost py-1.5 px-3">
                <Icon name="add" /> Nueva
              </Link>
            </div>
            {policyInspections.length === 0 ? (
              <p className="text-on-surface-variant text-body-md">
                Sin inspecciones registradas para este vehículo.
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-outline-variant/50">
                {policyInspections.map((i) => (
                  <Link
                    to={`/inspecciones/${i.id}`}
                    key={i.id}
                    className="flex items-center gap-3 py-3 hover:bg-surface-container-low rounded-lg px-2 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary flex items-center justify-center shrink-0">
                      <Icon name="verified" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-md font-bold truncate">{i.numero}</p>
                      <p className="text-caption text-on-surface-variant truncate">
                        {i.tipo}
                      </p>
                    </div>
                    <StatusChip status={i.estado} size="sm" />
                    <Icon name="chevron_right" className="hidden sm:inline" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="flex flex-col gap-4">
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3">
              Resumen Financiero
            </h3>
            <div className="space-y-3">
              <Row label="Prima total" value={`$${policy.prima.toLocaleString()}`} />
              <Row label="Saldo disponible" value={`$${policy.saldo.toFixed(2)}`} bold />
              <Row label="Modalidad" value={policy.modalidad} />
              <Row label="Días contratados" value={policy.diasContratados} />
              <Row
                label="Días restantes"
                value={`${policy.diasRestantes} días`}
                bold
              />
            </div>
          </div>

          <div className="card-elev2 p-4 sm:p-5 bg-gradient-brand-soft text-on-primary">
            <h3 className="text-headline-md mb-1">¿Necesitas más cobertura?</h3>
            <p className="text-body-md opacity-80 mb-3">
              Compra días adicionales y mantén tu protección activa al instante.
            </p>
            <Link to="/cobertura" className="btn-accent w-full">
              <Icon name="bolt" /> Activar más días
            </Link>
          </div>
        </aside>
      </div>
    </>
  )
}

function Field({ label, value, mono, className }) {
  return (
    <div className={`min-w-0 ${className ?? ''}`}>
      <p className="text-caption text-on-surface-variant uppercase tracking-wider truncate">
        {label}
      </p>
      <p className={`text-body-md text-on-surface font-semibold truncate ${mono ? 'font-mono text-[14px]' : ''}`}>
        {value ?? '—'}
      </p>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/50 pb-2 last:border-0 gap-2">
      <span className="text-on-surface-variant text-body-md">{label}</span>
      <span className={`text-on-surface text-right ${bold ? 'font-bold text-body-lg' : 'text-label-md'}`}>
        {value}
      </span>
    </div>
  )
}
