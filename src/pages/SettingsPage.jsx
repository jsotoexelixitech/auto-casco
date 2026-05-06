import { useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'

const SECTIONS = [
  { id: 'preferencias', label: 'Preferencias', icon: 'tune' },
  { id: 'notificaciones', label: 'Notificaciones', icon: 'notifications' },
  { id: 'privacidad', label: 'Privacidad', icon: 'shield' },
  { id: 'idioma', label: 'Idioma y región', icon: 'language' },
  { id: 'datos', label: 'Datos y cuenta', icon: 'database' },
]

export default function SettingsPage() {
  const toast = useToast()
  const [active, setActive] = useState('preferencias')
  const [s, setS] = useState({
    theme: 'auto',
    density: 'comfortable',
    push: true,
    email: true,
    sms: false,
    marketing: false,
    biometric: true,
    location: true,
    language: 'es-VE',
    currency: 'USD',
    timezone: 'America/Caracas',
  })
  const set = (k, v) => {
    setS((prev) => ({ ...prev, [k]: v }))
    toast.success('Preferencia actualizada', { duration: 1800 })
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Configuración' },
        ]}
        title="Configuración"
        subtitle="Personaliza tu experiencia en La Mundial · Auto Casco."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar tabs */}
        <aside className="lg:col-span-1">
          <div className="card p-2 sticky top-20 -mx-1 sm:mx-0 overflow-x-auto no-scrollbar">
            <ul className="flex lg:flex-col gap-1 min-w-fit">
              {SECTIONS.map((sec) => (
                <li key={sec.id} className="shrink-0 lg:shrink lg:flex-1">
                  <button
                    onClick={() => setActive(sec.id)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-label-md transition whitespace-nowrap',
                      active === sec.id
                        ? 'bg-gradient-brand-soft text-on-primary shadow-elev-primary'
                        : 'text-on-surface-variant hover:bg-surface-container',
                    )}
                  >
                    <Icon name={sec.icon} className="text-[20px]" />
                    {sec.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="lg:col-span-3 flex flex-col gap-4">
          {active === 'preferencias' && (
            <Section title="Preferencias generales">
              <RadioGroup
                label="Tema de la aplicación"
                hint="Elige cómo se ve la interfaz."
                value={s.theme}
                onChange={(v) => set('theme', v)}
                options={[
                  { v: 'light', label: 'Claro', icon: 'light_mode' },
                  { v: 'dark', label: 'Oscuro', icon: 'dark_mode' },
                  { v: 'auto', label: 'Automático', icon: 'brightness_auto' },
                ]}
              />
              <RadioGroup
                label="Densidad"
                hint="Espaciado en listas y tablas."
                value={s.density}
                onChange={(v) => set('density', v)}
                options={[
                  { v: 'compact', label: 'Compacta', icon: 'density_small' },
                  { v: 'comfortable', label: 'Cómoda', icon: 'density_medium' },
                  { v: 'spacious', label: 'Amplia', icon: 'density_large' },
                ]}
              />
            </Section>
          )}

          {active === 'notificaciones' && (
            <Section title="Notificaciones">
              <Toggle
                icon="notifications"
                title="Notificaciones push"
                desc="Alertas en el dispositivo y app móvil."
                checked={s.push}
                onChange={(v) => set('push', v)}
              />
              <Toggle
                icon="mail"
                title="Notificaciones por correo"
                desc="Resúmenes diarios y eventos importantes."
                checked={s.email}
                onChange={(v) => set('email', v)}
              />
              <Toggle
                icon="sms"
                title="SMS críticos"
                desc="Cobertura por vencer, siniestros, fraude."
                checked={s.sms}
                onChange={(v) => set('sms', v)}
              />
              <Toggle
                icon="campaign"
                title="Marketing y novedades"
                desc="Promociones y nuevos planes (puedes desactivar)."
                checked={s.marketing}
                onChange={(v) => set('marketing', v)}
              />
            </Section>
          )}

          {active === 'privacidad' && (
            <Section title="Privacidad y permisos">
              <Toggle
                icon="fingerprint"
                title="Inicio biométrico"
                desc="Usa Touch ID / Face ID para entrar más rápido."
                checked={s.biometric}
                onChange={(v) => set('biometric', v)}
              />
              <Toggle
                icon="my_location"
                title="Acceso a ubicación"
                desc="Necesario para inspecciones in-situ con trazabilidad."
                checked={s.location}
                onChange={(v) => set('location', v)}
              />
              <div className="card p-4 bg-warning-container/40 border border-warning/30 mt-2">
                <div className="flex items-start gap-2">
                  <Icon name="info" className="text-warning text-[22px] mt-0.5 shrink-0" filled />
                  <div className="flex-1">
                    <p className="font-bold text-on-warning-container">
                      Tus datos están protegidos
                    </p>
                    <p className="text-caption text-on-warning-container/80">
                      Solo el perito asignado puede ver el reporte de daños. Las fotos
                      se cifran en tránsito y reposo.
                    </p>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {active === 'idioma' && (
            <Section title="Idioma y región">
              <Select
                icon="translate"
                label="Idioma"
                value={s.language}
                onChange={(v) => set('language', v)}
                options={[
                  { v: 'es-VE', label: 'Español (Venezuela)' },
                  { v: 'es-MX', label: 'Español (México)' },
                  { v: 'en-US', label: 'English (United States)' },
                ]}
              />
              <Select
                icon="payments"
                label="Moneda"
                value={s.currency}
                onChange={(v) => set('currency', v)}
                options={[
                  { v: 'USD', label: 'USD — Dólar americano' },
                  { v: 'VES', label: 'VES — Bolívar' },
                ]}
              />
              <Select
                icon="schedule"
                label="Zona horaria"
                value={s.timezone}
                onChange={(v) => set('timezone', v)}
                options={[
                  { v: 'America/Caracas', label: 'Caracas (GMT-4)' },
                  { v: 'America/Bogota', label: 'Bogotá (GMT-5)' },
                  { v: 'America/Mexico_City', label: 'Ciudad de México (GMT-6)' },
                ]}
              />
            </Section>
          )}

          {active === 'datos' && (
            <Section title="Datos y cuenta">
              <ActionRow
                icon="download"
                title="Exportar mis datos"
                desc="Obtén una copia de tus pólizas, inspecciones y pagos."
                action="Solicitar"
                onAction={() =>
                  toast.success('Te enviaremos un correo cuando esté lista.', {
                    title: 'Exportación solicitada',
                  })
                }
              />
              <ActionRow
                icon="restart_alt"
                title="Borrar caché local"
                desc="Limpia datos temporales del navegador."
                action="Borrar"
                onAction={() => {
                  try {
                    localStorage.clear()
                  } catch {
                    /* noop */
                  }
                  toast.info('Caché local limpio')
                }}
              />
              <ActionRow
                icon="delete_forever"
                title="Eliminar cuenta"
                desc="Acción irreversible. Pólizas activas se mantienen."
                action="Eliminar"
                tone="error"
                onAction={() =>
                  toast.error(
                    'Por seguridad, contacta atención al cliente para eliminar tu cuenta.',
                    { title: 'Acción no permitida en demo' },
                  )
                }
              />
            </Section>
          )}
        </div>
      </div>
    </>
  )
}

function Section({ title, children }) {
  return (
    <div className="card p-4 sm:p-5">
      <h3 className="text-headline-md text-on-surface mb-3">{title}</h3>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

function Toggle({ icon, title, desc, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/50 bg-surface-container-low/40 hover:bg-surface-container-low transition text-left active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary flex items-center justify-center shrink-0">
        <Icon name={icon} filled />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface truncate">{title}</p>
        <p className="text-caption text-on-surface-variant line-clamp-2">{desc}</p>
      </div>
      <span
        className={clsx(
          'w-12 h-6.5 rounded-full transition relative shrink-0',
          checked ? 'bg-gradient-accent' : 'bg-surface-container-high',
        )}
        style={{ width: '44px', height: '24px' }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
          style={{ left: checked ? 'calc(100% - 22px)' : '2px' }}
        />
      </span>
    </button>
  )
}

function RadioGroup({ label, hint, value, onChange, options }) {
  return (
    <div>
      <p className="font-semibold text-on-surface">{label}</p>
      {hint && <p className="text-caption text-on-surface-variant mb-2">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={clsx(
              'p-3 rounded-xl border-2 transition flex flex-col items-center gap-1 active:scale-95',
              value === o.v
                ? 'border-primary bg-primary-fixed/40 ring-2 ring-primary/20 text-primary'
                : 'border-outline-variant text-on-surface-variant hover:border-primary/40',
            )}
          >
            <Icon name={o.icon} className="text-[22px]" filled />
            <span className="text-caption font-bold">{o.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Select({ icon, label, value, onChange, options }) {
  return (
    <div>
      <label className="label flex items-center gap-1.5">
        <Icon name={icon} className="text-[18px] text-on-surface-variant" />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function ActionRow({ icon, title, desc, action, onAction, tone = 'primary' }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/50 bg-surface-container-low/40">
      <div
        className={clsx(
          'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
          tone === 'error'
            ? 'bg-error-container text-on-error-container'
            : 'bg-primary-fixed text-primary',
        )}
      >
        <Icon name={icon} filled />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface truncate">{title}</p>
        <p className="text-caption text-on-surface-variant line-clamp-2">{desc}</p>
      </div>
      <button
        onClick={onAction}
        className={clsx(
          'shrink-0 py-1.5 px-3 rounded-lg text-label-md font-bold transition',
          tone === 'error'
            ? 'bg-error-container text-on-error-container hover:bg-error hover:text-on-error'
            : 'btn-soft',
        )}
      >
        {action}
      </button>
    </div>
  )
}
