import { useParams, useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { downloadPdf } from '../utils/downloadPdf'

export default function SiniestroDetailPage() {
  const { id } = useParams()
  const { siniestros, getVehicle } = useData()
  const toast = useToast()
  const navigate = useNavigate()

  const s = siniestros.find((x) => x.id === id)

  if (!s) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-on-surface-variant">
        <Icon name="car_crash" className="text-[64px] opacity-30" />
        <p className="text-headline-md">Siniestro no encontrado</p>
        <button onClick={() => navigate('/siniestros')} className="btn-primary">
          Volver a Siniestros
        </button>
      </div>
    )
  }

  const v = getVehicle(s.vehicleId)
  const timeline = buildTimeline(s)

  const downloadDetailPdf = () => {
    const lines = [
      `Reporte de siniestro: ${s.id}`,
      `Fecha: ${s.fecha}${s.hora ? '  ' + s.hora : ''}`,
      `Tipo: ${s.tipo}`,
      `Estado: ${s.estado} (${s.avance}% de avance)`,
      `Vehículo: ${v?.marca} ${v?.modelo} ${v?.anio}  -  Placa ${v?.placa}`,
      `Lugar: ${s.lugar ?? '-'}`,
      '',
      'Descripción:',
      s.descripcion ?? 'Reporte automático desde el dashboard.',
      '',
      `Monto estimado: $${s.monto?.toLocaleString?.() ?? s.monto ?? 0}`,
      s.heridos ? '· Hubo heridos en el incidente' : '· Sin heridos reportados',
      s.autoridad ? '· Se notificó a la autoridad' : '· Sin parte de autoridad',
      '',
      'Documento generado desde la plataforma demo La Mundial - Auto Casco.',
    ]
    downloadPdf({ title: `Siniestro ${s.id}`, lines, filename: `${s.id}.pdf` })
    toast.success('PDF descargado')
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Siniestros', to: '/siniestros' },
          { label: s.id },
        ]}
        title={s.id}
        subtitle={`${s.tipo} · ${s.fecha}`}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={downloadDetailPdf} className="btn-soft">
              <Icon name="picture_as_pdf" /> Descargar PDF
            </button>
            <button
              onClick={() => {
                toast.info('Te enviaremos las novedades por correo y push.', {
                  title: 'Suscripción activada',
                })
                navigate('/siniestros')
              }}
              className="btn-primary"
            >
              <Icon name="notifications_active" /> Seguir caso
            </button>
          </div>
        }
      />

      {/* Status banner */}
      <div
        className={clsx(
          'flex items-center gap-3 p-3 sm:p-4 rounded-xl border mb-5',
          s.avance >= 100
            ? 'bg-success-container/40 border-success/30'
            : s.avance >= 60
            ? 'bg-warning-container/40 border-warning/30'
            : 'bg-primary-fixed/30 border-primary/20',
        )}
      >
        <StatusChip status={s.estado} />
        <div className="flex-1 min-w-0">
          <p className="text-body-md font-semibold text-on-surface truncate">
            {s.tipo} — {s.severidad ? s.severidad.charAt(0).toUpperCase() + s.severidad.slice(1) : ''}
          </p>
          <p className="text-caption text-on-surface-variant">
            Avance del caso: {s.avance}%
          </p>
        </div>
        <div className="w-28 sm:w-40 shrink-0">
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-accent rounded-full transition-all"
              style={{ width: `${s.avance}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Incident data */}
          <div className="card p-4 sm:p-5">
            <h4 className="text-headline-md mb-4 flex items-center gap-2">
              <Icon name="info" className="text-primary text-[20px]" filled />
              Datos del incidente
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <Field label="Tipo" value={s.tipo} />
              <Field label="Fecha" value={`${s.fecha}${s.hora ? ` · ${s.hora}` : ''}`} />
              <Field label="Severidad" value={s.severidad ?? '—'} capitalize />
              <Field label="Avance" value={`${s.avance}%`} />
              <Field
                label="Lugar"
                value={s.lugar ?? '—'}
                className="col-span-2 sm:col-span-4"
                multiline
              />
            </div>
            {s.descripcion && (
              <>
                <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-2">
                  Descripción
                </p>
                <p className="text-body-md text-on-surface leading-relaxed bg-surface-container-low/50 rounded-xl p-3">
                  {s.descripcion}
                </p>
              </>
            )}
            <div className="flex gap-4 mt-4 pt-3 border-t border-outline-variant/40">
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'w-3 h-3 rounded-full',
                    s.heridos ? 'bg-error' : 'bg-success',
                  )}
                />
                <span className="text-caption text-on-surface-variant">
                  {s.heridos ? 'Con heridos' : 'Sin heridos'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={clsx(
                    'w-3 h-3 rounded-full',
                    s.autoridad ? 'bg-primary' : 'bg-outline-variant',
                  )}
                />
                <span className="text-caption text-on-surface-variant">
                  {s.autoridad ? 'Parte de autoridad' : 'Sin parte de autoridad'}
                </span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-4 sm:p-5">
            <h4 className="text-headline-md mb-4 flex items-center gap-2">
              <Icon name="timeline" className="text-primary text-[20px]" />
              Línea de tiempo
            </h4>
            <ol className="relative border-l-2 border-outline-variant/60 ml-2 pl-5 space-y-4">
              {timeline.map((t, i) => (
                <li key={i} className="relative">
                  <span
                    className={clsx(
                      'absolute -left-[25px] top-0.5 w-4 h-4 rounded-full ring-4 ring-white',
                      t.done ? 'bg-gradient-accent' : 'bg-surface-container-high',
                    )}
                  />
                  <p
                    className={clsx(
                      'font-bold text-body-md',
                      t.done ? 'text-on-surface' : 'text-on-surface-variant',
                    )}
                  >
                    {t.title}
                  </p>
                  <p className="text-caption text-on-surface-variant">{t.when}</p>
                  {t.body && (
                    <p className="text-caption text-on-surface mt-0.5">{t.body}</p>
                  )}
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4">
          {v && (
            <div className="card p-0 overflow-hidden">
              <div className="aspect-[16/9] bg-surface-container">
                <img src={v.image} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-4">
                <p className="font-bold text-on-surface truncate text-body-lg">
                  {v.marca} {v.modelo} {v.anio}
                </p>
                <p className="text-caption text-on-surface-variant">
                  {v.placa} · {v.color}
                </p>
              </div>
            </div>
          )}

          <div className="card p-4">
            <h5 className="font-bold text-on-surface mb-3 flex items-center gap-2">
              <Icon name="payments" className="text-primary text-[18px]" />
              Resumen financiero
            </h5>
            <Row label="Monto reclamado" value={`$${s.monto.toLocaleString()}`} bold />
            <Row label="Deducible" value="$250" />
            <Row
              label="A pagar (estimado)"
              value={`$${Math.max(0, s.monto - 250).toLocaleString()}`}
            />
          </div>

          <div className="card p-4 bg-primary-fixed/30 border border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <Icon name="support_agent" className="text-primary text-[22px]" filled />
              <p className="font-bold text-primary">Perito asignado</p>
            </div>
            <p className="text-body-md font-semibold text-on-surface">Miguel Azualde</p>
            <p className="text-caption text-on-surface-variant mb-3">
              Te llamará al +58 (414) ***-4567
            </p>
            <button className="btn-soft w-full">
              <Icon name="phone" /> Llamar al perito
            </button>
          </div>
        </aside>
      </div>
    </>
  )
}

function Field({ label, value, className = '', capitalize, multiline }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p
        className={clsx(
          'text-body-md text-on-surface font-semibold',
          multiline ? 'break-words' : 'truncate',
          capitalize && 'capitalize',
        )}
      >
        {value}
      </p>
    </div>
  )
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between border-b border-outline-variant/40 pb-2 last:border-0 mb-2 last:mb-0 gap-2">
      <span className="text-on-surface-variant text-caption">{label}</span>
      <span className={clsx('text-on-surface text-right', bold ? 'font-bold text-body-md' : 'text-label-md')}>
        {value}
      </span>
    </div>
  )
}

function buildTimeline(s) {
  return [
    {
      title: 'Reporte recibido',
      when: `${s.fecha}${s.hora ? ' · ' + s.hora : ''}`,
      done: true,
      body: 'El reporte fue registrado en el sistema.',
    },
    {
      title: 'Asignación de perito',
      when: `${s.fecha} · +30 min`,
      done: s.avance >= 25,
      body: 'Miguel Azualde asignado al caso.',
    },
    {
      title: 'Inspección y peritaje',
      when: `${s.fecha} · +24 h`,
      done: s.avance >= 60,
      body: 'Captura de fotos y validación de daños.',
    },
    {
      title: 'Resolución y pago',
      when: s.avance >= 100 ? 'Completado' : 'Pendiente',
      done: s.avance >= 100,
    },
  ]
}
