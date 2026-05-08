import { useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import StatCard from '../components/ui/StatCard'
import StatusChip from '../components/ui/StatusChip'
import Icon from '../components/ui/Icon'
import Modal from '../components/ui/Modal'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { downloadPdf } from '../utils/downloadPdf'

const TIPOS = [
  'Choque Frontal',
  'Choque Lateral',
  'Choque Trasero',
  'Robo Total',
  'Robo Parcial',
  'Daños Laterales',
  'Daños por Vandalismo',
  'Inundación / Climatológico',
  'Otro',
]

const SEVERIDADES = [
  { v: 'leve', label: 'Leve', tone: 'success' },
  { v: 'moderado', label: 'Moderado', tone: 'warning' },
  { v: 'grave', label: 'Grave', tone: 'error' },
]

export default function SiniestrosPage() {
  const { siniestros, getVehicle, vehicles, addSiniestro, addActivity } = useData()
  const toast = useToast()

  const [reportOpen, setReportOpen] = useState(false)
  const [detailId, setDetailId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [draft, setDraft] = useState({
    vehicleId: vehicles[0]?.id ?? '',
    tipo: 'Choque Frontal',
    severidad: 'moderado',
    fecha: new Date().toISOString().slice(0, 10),
    hora: new Date().toTimeString().slice(0, 5),
    lugar: '',
    descripcion: '',
    heridos: false,
    autoridad: false,
  })

  const total = siniestros.reduce((acc, s) => acc + s.monto, 0)
  const enAnalisis = siniestros.filter((s) => s.estado === 'En Análisis').length
  const detail = detailId ? siniestros.find((s) => s.id === detailId) : null

  const submitReport = () => {
    if (!draft.lugar || !draft.descripcion) {
      toast.error('Completa el lugar y la descripción del siniestro.')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      const numero = `SIN-2026-${String(Math.floor(Math.random() * 999) + 100).padStart(3, '0')}`
      addSiniestro({
        id: numero,
        fecha: draft.fecha,
        hora: draft.hora,
        estado: 'En Análisis',
        tipo: draft.tipo,
        severidad: draft.severidad,
        vehicleId: draft.vehicleId,
        lugar: draft.lugar,
        descripcion: draft.descripcion,
        heridos: draft.heridos,
        autoridad: draft.autoridad,
        monto: 0,
        avance: 10,
      })
      addActivity({
        type: 'siniestro-report',
        title: `Siniestro reportado ${numero}`,
        subtitle: `${draft.tipo} · ${draft.lugar}`,
        when: 'Hace un momento',
        icon: 'car_crash',
        tone: 'error',
      })
      toast.success(`Reporte ${numero} creado. Un perito te contactará en breve.`, {
        title: '¡Listo!',
        duration: 4000,
      })
      setSubmitting(false)
      setReportOpen(false)
      setDraft({
        ...draft,
        lugar: '',
        descripcion: '',
        heridos: false,
        autoridad: false,
      })
    }, 1100)
  }

  const downloadDetailPdf = (s) => {
    const v = getVehicle(s.vehicleId)
    const lines = [
      `Reporte de siniestro: ${s.id}`,
      `Fecha: ${s.fecha}${s.hora ? '  ' + s.hora : ''}`,
      `Tipo: ${s.tipo}`,
      `Estado: ${s.estado} (${s.avance}% de avance)`,
      `Vehiculo: ${v?.marca} ${v?.modelo} ${v?.anio}  -  Placa ${v?.placa}`,
      `Lugar: ${s.lugar ?? '-'}`,
      '',
      'Descripcion:',
      s.descripcion ?? 'Reporte automatico desde el dashboard.',
      '',
      `Monto estimado: $${s.monto?.toLocaleString?.() ?? s.monto ?? 0}`,
      s.heridos ? '· Hubo heridos en el incidente' : '· Sin heridos reportados',
      s.autoridad ? '· Se notifico a la autoridad' : '· Sin parte de autoridad',
      '',
      'Documento generado desde la plataforma demo La Mundial - Auto Casco.',
    ]
    downloadPdf({
      title: `Siniestro ${s.id}`,
      lines,
      filename: `${s.id}.pdf`,
    })
    toast.success('PDF descargado')
  }

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
          <button onClick={() => setReportOpen(true)} className="btn-primary">
            <Icon name="add" /> <span className="hidden sm:inline">Reportar</span> Siniestro
          </button>
        }
      />

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <StatCard icon="car_crash" label="Total" value={siniestros.length} tone="primary" />
        <StatCard icon="pending_actions" label="En análisis" value={enAnalisis} tone="accent" />
        <StatCard icon="paid" label="Monto" value={`$${total.toLocaleString()}`} />
        <StatCard
          icon="trending_down"
          label="Aprobación"
          value="92%"
          tone="success"
          trend={{ dir: 'up', value: '+4%' }}
        />
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {siniestros.map((s) => {
          const v = getVehicle(s.vehicleId)
          return (
            <button
              type="button"
              key={s.id}
              onClick={() => setDetailId(s.id)}
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

      {/* Report modal */}
      <Modal
        open={reportOpen}
        onClose={() => !submitting && setReportOpen(false)}
        title="Reportar siniestro"
        subtitle="Tu reporte se envía al equipo de peritaje. Te llamaremos en menos de 30 minutos."
        icon="car_crash"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setReportOpen(false)}
              disabled={submitting}
              className="btn-soft"
            >
              Cancelar
            </button>
            <button
              onClick={submitReport}
              disabled={submitting}
              className="btn-accent"
            >
              {submitting ? (
                <>
                  <Icon name="progress_activity" className="animate-spin" />{' '}
                  Enviando…
                </>
              ) : (
                <>
                  <Icon name="send" /> Enviar reporte
                </>
              )}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="label">Vehículo</label>
            <select
              className="input"
              value={draft.vehicleId}
              onChange={(e) => setDraft({ ...draft, vehicleId: e.target.value })}
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.marca} {v.modelo} {v.anio} — {v.placa}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Tipo de siniestro</label>
            <select
              className="input"
              value={draft.tipo}
              onChange={(e) => setDraft({ ...draft, tipo: e.target.value })}
            >
              {TIPOS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Severidad</label>
                  <div className="grid grid-cols-3 gap-1.5">
              {SEVERIDADES.map((sv) => (
                <button
                  type="button"
                  key={sv.v}
                  onClick={() => setDraft({ ...draft, severidad: sv.v })}
                  className={clsx(
                    'min-h-[44px] rounded-lg text-label-md font-bold border transition',
                    draft.severidad === sv.v && sv.tone === 'success' &&
                      'bg-success text-on-success border-success',
                    draft.severidad === sv.v && sv.tone === 'warning' &&
                      'bg-warning text-on-warning border-warning',
                    draft.severidad === sv.v && sv.tone === 'error' &&
                      'bg-error text-on-error border-error',
                    draft.severidad !== sv.v &&
                      'bg-white border-outline-variant text-on-surface-variant',
                  )}
                >
                  {sv.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Fecha del incidente</label>
            <input
              type="date"
              className="input"
              value={draft.fecha}
              onChange={(e) => setDraft({ ...draft, fecha: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Hora aproximada</label>
            <input
              type="time"
              className="input"
              value={draft.hora}
              onChange={(e) => setDraft({ ...draft, hora: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Lugar del incidente</label>
            <input
              className="input"
              value={draft.lugar}
              onChange={(e) => setDraft({ ...draft, lugar: e.target.value })}
              placeholder="Ej. Av. Francisco de Miranda c/c Av. Principal"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Descripción del siniestro</label>
            <textarea
              className="input min-h-[96px] resize-none"
              value={draft.descripcion}
              onChange={(e) =>
                setDraft({ ...draft, descripcion: e.target.value })
              }
              placeholder="Describe lo ocurrido con el mayor detalle posible…"
            />
          </div>
          <CheckboxRow
            label="Hubo heridos en el siniestro"
            checked={draft.heridos}
            onChange={(v) => setDraft({ ...draft, heridos: v })}
          />
          <CheckboxRow
            label="Se notificó a las autoridades"
            checked={draft.autoridad}
            onChange={(v) => setDraft({ ...draft, autoridad: v })}
          />
        </div>
      </Modal>

      {/* Detail modal */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title={detail?.id}
        subtitle={detail ? `${detail.tipo} · ${detail.fecha}` : ''}
        icon="car_crash"
        size="xl"
        footer={
          detail && (
            <>
              <button
                onClick={() => downloadDetailPdf(detail)}
                className="btn-soft"
              >
                <Icon name="picture_as_pdf" /> Descargar PDF
              </button>
              <button
                onClick={() => {
                  toast.info('Te enviaremos las novedades por correo y push.', {
                    title: 'Suscripción activada',
                  })
                  setDetailId(null)
                }}
                className="btn-primary"
              >
                <Icon name="notifications_active" /> Seguir caso
              </button>
            </>
          )
        }
      >
        {detail && <SiniestroDetailBody s={detail} getVehicle={getVehicle} />}
      </Modal>
    </>
  )
}

function CheckboxRow({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 p-3 rounded-lg border border-outline-variant/50 bg-surface-container-low/40 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-5 h-5 rounded text-primary focus:ring-primary/20"
      />
      <span className="text-body-md text-on-surface">{label}</span>
    </label>
  )
}

function SiniestroDetailBody({ s, getVehicle }) {
  const v = getVehicle(s.vehicleId)
  const timeline = buildTimeline(s)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 flex flex-col gap-4">
        <div className="card p-3 sm:p-4 bg-surface-container-low/50">
          <h4 className="text-headline-md mb-2">Datos del incidente</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="Tipo" value={s.tipo} />
            <Field label="Fecha" value={`${s.fecha}${s.hora ? ` · ${s.hora}` : ''}`} />
            <Field label="Severidad" value={s.severidad ?? '—'} capitalize />
            <Field label="Avance" value={`${s.avance}%`} />
            <Field label="Lugar" value={s.lugar ?? '—'} className="col-span-2 sm:col-span-4" />
          </div>
          {s.descripcion && (
            <div className="mt-3">
              <p className="text-caption text-on-surface-variant uppercase tracking-wider mb-1">
                Descripción
              </p>
              <p className="text-body-md text-on-surface">{s.descripcion}</p>
            </div>
          )}
        </div>

        <div className="card p-3 sm:p-4">
          <h4 className="text-headline-md mb-3">Línea de tiempo</h4>
          <ol className="relative border-l-2 border-outline-variant/60 ml-2 pl-4 space-y-3">
            {timeline.map((t, i) => (
              <li key={i} className="relative">
                <span
                  className={clsx(
                    'absolute -left-[22px] top-0 w-4 h-4 rounded-full ring-4 ring-white',
                    t.done ? 'bg-gradient-accent' : 'bg-surface-container-high',
                  )}
                />
                <p
                  className={clsx(
                    'font-bold',
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

      <aside className="flex flex-col gap-3">
        {v && (
          <div className="card p-0 overflow-hidden">
            <div className="aspect-[16/10] bg-surface-container">
              <img src={v.image} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="p-3">
              <p className="font-bold text-on-surface truncate">
                {v.marca} {v.modelo} {v.anio}
              </p>
              <p className="text-caption text-on-surface-variant">
                {v.placa} · {v.color}
              </p>
            </div>
          </div>
        )}
        <div className="card p-3 sm:p-4">
          <h5 className="font-bold text-on-surface mb-2">Resumen financiero</h5>
          <Row label="Monto reclamado" value={`$${s.monto.toLocaleString()}`} bold />
          <Row label="Deducible" value="$250" />
          <Row label="A pagar (estimado)" value={`$${Math.max(0, s.monto - 250).toLocaleString()}`} />
        </div>
        <div className="card p-3 sm:p-4 bg-primary-fixed/40 border border-primary/30">
          <div className="flex items-center gap-2 mb-1">
            <Icon name="support_agent" className="text-primary" filled />
            <p className="font-bold text-primary">Perito asignado</p>
          </div>
          <p className="text-body-md text-on-surface">Miguel Azualde</p>
          <p className="text-caption text-on-surface-variant">
            Te llamará al +58 (414) ***-4567
          </p>
        </div>
      </aside>
    </div>
  )
}

function buildTimeline(s) {
  const base = [
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
  return base
}

function Field({ label, value, className = '', capitalize }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <p className="text-caption text-on-surface-variant uppercase tracking-wider truncate">
        {label}
      </p>
      <p
        className={clsx(
          'text-body-md text-on-surface font-semibold truncate',
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
      <span
        className={clsx(
          'text-on-surface text-right',
          bold ? 'font-bold' : 'text-label-md',
        )}
      >
        {value}
      </span>
    </div>
  )
}
