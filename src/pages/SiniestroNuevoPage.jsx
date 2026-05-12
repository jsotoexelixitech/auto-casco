import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'

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

export default function SiniestroNuevoPage() {
  const { vehicles, addSiniestro, addActivity } = useData()
  const toast = useToast()
  const navigate = useNavigate()
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

  const submit = (e) => {
    e.preventDefault()
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
      navigate('/siniestros')
    }, 1100)
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Siniestros', to: '/siniestros' },
          { label: 'Nuevo reporte' },
        ]}
        title="Reportar Siniestro"
        subtitle="Tu reporte se envía al equipo de peritaje. Te llamaremos en menos de 30 minutos."
      />

      <form onSubmit={submit} noValidate>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main form */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Vehicle + tipo + severidad */}
            <div className="card p-4 sm:p-5">
              <h3 className="text-headline-md text-on-surface mb-4 flex items-center gap-2">
                <Icon name="car_crash" className="text-error text-[22px]" filled />
                Datos del incidente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-3 gap-2">
                    {SEVERIDADES.map((sv) => (
                      <button
                        type="button"
                        key={sv.v}
                        onClick={() => setDraft({ ...draft, severidad: sv.v })}
                        className={clsx(
                          'min-h-[44px] rounded-lg text-label-md font-bold border-2 transition active:scale-95',
                          draft.severidad === sv.v && sv.tone === 'success' &&
                            'bg-success text-on-success border-success shadow-md',
                          draft.severidad === sv.v && sv.tone === 'warning' &&
                            'bg-warning text-on-warning border-warning shadow-md',
                          draft.severidad === sv.v && sv.tone === 'error' &&
                            'bg-error text-on-error border-error shadow-md',
                          draft.severidad !== sv.v &&
                            'bg-white border-outline-variant text-on-surface-variant hover:border-primary/50',
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
                    required
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="label">Descripción del siniestro</label>
                  <textarea
                    className="input min-h-[120px] resize-none"
                    value={draft.descripcion}
                    onChange={(e) => setDraft({ ...draft, descripcion: e.target.value })}
                    placeholder="Describe lo ocurrido con el mayor detalle posible…"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="card p-4 sm:p-5">
              <h3 className="text-headline-md text-on-surface mb-3">
                Información adicional
              </h3>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/60 cursor-pointer hover:bg-surface-container-low/50 transition">
                  <input
                    type="checkbox"
                    checked={draft.heridos}
                    onChange={(e) => setDraft({ ...draft, heridos: e.target.checked })}
                    className="w-5 h-5 rounded text-primary focus:ring-primary/20"
                  />
                  <div>
                    <p className="text-body-md font-semibold text-on-surface">Hubo heridos en el siniestro</p>
                    <p className="text-caption text-on-surface-variant">
                      Se requiere reporte médico adicional
                    </p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/60 cursor-pointer hover:bg-surface-container-low/50 transition">
                  <input
                    type="checkbox"
                    checked={draft.autoridad}
                    onChange={(e) => setDraft({ ...draft, autoridad: e.target.checked })}
                    className="w-5 h-5 rounded text-primary focus:ring-primary/20"
                  />
                  <div>
                    <p className="text-body-md font-semibold text-on-surface">Se notificó a las autoridades</p>
                    <p className="text-caption text-on-surface-variant">
                      Sube el parte policial cuando lo tengas
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Sidebar info */}
          <aside className="flex flex-col gap-4">
            <div className="card p-4 sm:p-5 bg-error-container/30 border border-error/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="emergency" className="text-error text-[22px]" filled />
                <h4 className="font-bold text-on-surface">¿Emergencia?</h4>
              </div>
              <p className="text-body-md text-on-surface-variant mb-3">
                Si hay heridos o riesgo de vida, llama primero al 911.
              </p>
              <a
                href="tel:+18008008800"
                className="btn-soft w-full justify-center text-error border-error/40 hover:bg-error-container/60"
              >
                <Icon name="phone" /> Línea de emergencias
              </a>
            </div>

            <div className="card p-4 sm:p-5 bg-primary-fixed/30 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <Icon name="support_agent" className="text-primary text-[22px]" filled />
                <h4 className="font-bold text-on-surface">¿Qué pasa después?</h4>
              </div>
              <ol className="space-y-2">
                {[
                  'Tu reporte llega al equipo en segundos',
                  'Un perito te llama en < 30 minutos',
                  'Se agenda la inspección del vehículo',
                  'Recibís resolución en 3–5 días hábiles',
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-caption text-on-surface-variant">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* CTA section */}
            <div className="flex flex-col gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="btn-accent w-full py-3 text-body-md"
                onClick={submit}
              >
                {submitting ? (
                  <>
                    <Icon name="progress_activity" className="animate-spin" /> Enviando…
                  </>
                ) : (
                  <>
                    <Icon name="send" /> Enviar reporte
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate('/siniestros')}
                disabled={submitting}
                className="btn-soft w-full"
              >
                Cancelar
              </button>
            </div>
          </aside>
        </div>
      </form>
    </>
  )
}
