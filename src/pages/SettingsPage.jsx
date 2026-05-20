import { useState, useEffect } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import { useToast } from '../context/ToastContext'

const LS_KEY = 'app_settings'

const DEFAULTS = {
  theme: 'auto',
  density: 'comfortable',
  push: true,
  email: true,
  sms: false,
  marketing: false,
  biometric: false,
  location: true,
  language: 'es-VE',
  currency: 'USD',
  timezone: 'America/Caracas',
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { ...DEFAULTS }
}

function saveSettings(s) {
  localStorage.setItem(LS_KEY, JSON.stringify(s))
}

function applyTheme(theme) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const useDark = theme === 'dark' || (theme === 'auto' && prefersDark)
  document.documentElement.classList.toggle('dark', useDark)
  document.documentElement.setAttribute('data-theme', theme)
}

function applyDensity(density) {
  document.documentElement.setAttribute('data-density', density)
}

const SECTIONS = [
  { id: 'preferencias',    label: 'Preferencias',     icon: 'tune' },
  { id: 'notificaciones',  label: 'Notificaciones',   icon: 'notifications' },
  { id: 'privacidad',      label: 'Privacidad',        icon: 'shield' },
  { id: 'idioma',          label: 'Idioma y región',  icon: 'language' },
  { id: 'datos',           label: 'Datos y cuenta',   icon: 'database' },
]

export default function SettingsPage() {
  const toast = useToast()
  const [active, setActive] = useState('preferencias')
  const [s, setS] = useState(loadSettings)

  // Aplica tema y densidad al montar (persisten entre páginas)
  useEffect(() => {
    applyTheme(s.theme)
    applyDensity(s.density)
  }, [])

  function set(k, v) {
    const next = { ...s, [k]: v }
    setS(next)
    saveSettings(next)

    if (k === 'theme') applyTheme(v)
    if (k === 'density') applyDensity(v)

    toast.success('Ajuste guardado', { duration: 1500 })
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Inicio', to: '/dashboard' }, { label: 'Ajustes' }]}
        title="Ajustes"
        subtitle="Personaliza tu experiencia en La Mundial — Auto Casco."
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="card p-2 sticky top-20 overflow-x-auto no-scrollbar">
            <ul className="flex lg:flex-col gap-1 min-w-fit">
              {SECTIONS.map((sec) => (
                <li key={sec.id} className="shrink-0 lg:flex-1">
                  <button
                    onClick={() => setActive(sec.id)}
                    className={clsx(
                      'w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-label-md transition whitespace-nowrap',
                      active === sec.id
                        ? 'bg-primary text-white shadow-sm'
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
          {/* ── Preferencias ─────────────────────────────────────── */}
          {active === 'preferencias' && (
            <Section title="Preferencias generales" icon="tune">
              <RadioGroup
                label="Tema de la aplicación"
                hint="Elige cómo se ve la interfaz. El cambio se aplica de inmediato."
                value={s.theme}
                onChange={(v) => set('theme', v)}
                options={[
                  { v: 'light', label: 'Claro',        icon: 'light_mode' },
                  { v: 'dark',  label: 'Oscuro',       icon: 'dark_mode' },
                  { v: 'auto',  label: 'Automático',   icon: 'brightness_auto' },
                ]}
              />
              <RadioGroup
                label="Densidad de la interfaz"
                hint="Controla el espaciado en listas y tablas."
                value={s.density}
                onChange={(v) => set('density', v)}
                options={[
                  { v: 'compact',     label: 'Compacta', icon: 'density_small' },
                  { v: 'comfortable', label: 'Cómoda',   icon: 'density_medium' },
                  { v: 'spacious',    label: 'Amplia',   icon: 'density_large' },
                ]}
              />
              <InfoBox
                icon="check_circle"
                tone="success"
                text="Los ajustes de tema y densidad se guardan automáticamente y persisten entre sesiones."
              />
            </Section>
          )}

          {/* ── Notificaciones ───────────────────────────────────── */}
          {active === 'notificaciones' && (
            <Section title="Notificaciones" icon="notifications">
              <Toggle
                icon="notifications"
                title="Notificaciones push"
                desc="Alertas en tiempo real en el dispositivo y app móvil."
                checked={s.push}
                onChange={(v) => set('push', v)}
              />
              <Toggle
                icon="mail"
                title="Notificaciones por correo"
                desc="Resúmenes diarios, vencimientos y eventos importantes."
                checked={s.email}
                onChange={(v) => set('email', v)}
              />
              <Toggle
                icon="sms"
                title="SMS críticos"
                desc="Alertas urgentes: cobertura por vencer, siniestros, fraude."
                checked={s.sms}
                onChange={(v) => set('sms', v)}
              />
              <Toggle
                icon="campaign"
                title="Marketing y novedades"
                desc="Promociones, nuevos planes y actualizaciones de producto."
                checked={s.marketing}
                onChange={(v) => set('marketing', v)}
              />
              {!s.push && !s.email && !s.sms && (
                <InfoBox
                  icon="warning"
                  tone="warning"
                  text="Tienes todas las notificaciones desactivadas. Podrías perderte alertas importantes sobre tu cobertura."
                />
              )}
            </Section>
          )}

          {/* ── Privacidad ───────────────────────────────────────── */}
          {active === 'privacidad' && (
            <Section title="Privacidad y permisos" icon="shield">
              <Toggle
                icon="fingerprint"
                title="Inicio biométrico"
                desc="Usa Touch ID / Face ID para entrar más rápido sin contraseña."
                checked={s.biometric}
                onChange={(v) => set('biometric', v)}
              />
              <Toggle
                icon="my_location"
                title="Acceso a ubicación"
                desc="Requerido para geolocalizar las inspecciones vehiculares in-situ."
                checked={s.location}
                onChange={(v) => {
                  if (!v) {
                    toast.info('La ubicación es necesaria para inspecciones. Puedes desactivarla pero deberás ingresarla manualmente.')
                  }
                  set('location', v)
                }}
              />
              <InfoBox
                icon="lock"
                tone="info"
                text="Tus datos están protegidos. Solo tú y La Mundial de Seguros pueden ver el reporte de daños. Las fotos se cifran en tránsito y en reposo."
              />
            </Section>
          )}

          {/* ── Idioma y región ──────────────────────────────────── */}
          {active === 'idioma' && (
            <Section title="Idioma y región" icon="language">
              <SelectRow
                icon="translate"
                label="Idioma de la aplicación"
                value={s.language}
                onChange={(v) => set('language', v)}
                options={[
                  { v: 'es-VE', label: 'Español (Venezuela)' },
                  { v: 'es-MX', label: 'Español (México)' },
                  { v: 'en-US', label: 'English (United States)' },
                ]}
              />
              <SelectRow
                icon="payments"
                label="Moneda de referencia"
                value={s.currency}
                onChange={(v) => set('currency', v)}
                options={[
                  { v: 'USD', label: 'USD — Dólar americano' },
                  { v: 'VES', label: 'VES — Bolívar soberano' },
                ]}
              />
              <SelectRow
                icon="schedule"
                label="Zona horaria"
                value={s.timezone}
                onChange={(v) => set('timezone', v)}
                options={[
                  { v: 'America/Caracas',     label: 'Caracas (GMT-4)' },
                  { v: 'America/Bogota',       label: 'Bogotá (GMT-5)' },
                  { v: 'America/Mexico_City',  label: 'Ciudad de México (GMT-6)' },
                  { v: 'America/New_York',     label: 'Nueva York (GMT-5/-4)' },
                ]}
              />
              <InfoBox
                icon="info"
                tone="info"
                text={`Configuración actual: ${s.language} · ${s.currency} · ${s.timezone}`}
              />
            </Section>
          )}

          {/* ── Datos y cuenta ───────────────────────────────────── */}
          {active === 'datos' && (
            <Section title="Datos y cuenta" icon="database">
              <ActionRow
                icon="download"
                title="Exportar mis datos"
                desc="Obtén una copia de tus pólizas, inspecciones y pagos en formato JSON."
                action="Solicitar"
                onAction={() =>
                  toast.success('Te enviaremos un correo cuando esté lista la exportación.', {
                    title: 'Exportación solicitada',
                  })
                }
              />
              <ActionRow
                icon="restart_alt"
                title="Borrar caché local"
                desc="Limpia datos temporales del navegador (NO elimina tu configuración de IA ni ajustes)."
                action="Borrar"
                onAction={() => {
                  try {
                    // Solo borra caché de sesión, NO la configuración guardada
                    const keep = ['ia_config', 'ia_sequences', LS_KEY]
                    const saved = {}
                    keep.forEach((k) => { saved[k] = localStorage.getItem(k) })
                    localStorage.clear()
                    keep.forEach((k) => { if (saved[k] != null) localStorage.setItem(k, saved[k]) })
                  } catch { /* noop */ }
                  toast.info('Caché local limpio. Tu configuración fue preservada.')
                }}
              />
              <ActionRow
                icon="settings_backup_restore"
                title="Restablecer ajustes"
                desc="Vuelve a los valores por defecto de tema, notificaciones y región."
                action="Restablecer"
                onAction={() => {
                  setS({ ...DEFAULTS })
                  saveSettings(DEFAULTS)
                  applyTheme(DEFAULTS.theme)
                  applyDensity(DEFAULTS.density)
                  toast.success('Ajustes restablecidos a los valores por defecto.')
                }}
              />
              <ActionRow
                icon="delete_forever"
                title="Eliminar cuenta"
                desc="Acción irreversible. Las pólizas activas se mantienen según contrato."
                action="Eliminar"
                tone="error"
                onAction={() =>
                  toast.error(
                    'Por seguridad, contacta a atención al cliente para eliminar tu cuenta.',
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

// ── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, icon, children }) {
  const C = { navy: '#0F1A5A' }
  return (
    <div className="card p-4 sm:p-5">
      <h3 className="text-headline-md font-bold flex items-center gap-2 mb-4" style={{ color: C.navy }}>
        <Icon name={icon} className="text-[20px]" style={{ color: C.navy }} />
        {title}
      </h3>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Toggle({ icon, title, desc, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/50 bg-surface-container-low/40 hover:bg-surface-container transition text-left active:scale-[0.99]"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: checked ? '#EFF6FF' : '#F1F5F9' }}>
        <Icon name={icon} filled className="text-[20px]"
          style={{ color: checked ? '#1D4ED8' : '#94A3B8' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface">{title}</p>
        <p className="text-caption text-on-surface-variant line-clamp-2">{desc}</p>
      </div>
      {/* Toggle switch */}
      <span
        className="shrink-0 rounded-full transition-colors duration-200 relative"
        style={{
          width: '44px', height: '24px',
          backgroundColor: checked ? '#1D4ED8' : '#CBD5E1',
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: checked ? 'calc(100% - 22px)' : '2px' }}
        />
      </span>
    </button>
  )
}

function RadioGroup({ label, hint, value, onChange, options }) {
  return (
    <div>
      <p className="font-semibold text-on-surface mb-0.5">{label}</p>
      {hint && <p className="text-caption text-on-surface-variant mb-2">{hint}</p>}
      <div className="grid grid-cols-3 gap-2">
        {options.map((o) => (
          <button
            key={o.v}
            onClick={() => onChange(o.v)}
            className={clsx(
              'p-3 min-h-[64px] rounded-xl border-2 transition flex flex-col items-center gap-1 active:scale-95',
              value === o.v
                ? 'border-[#1D4ED8] bg-[#EFF6FF] text-[#1D4ED8]'
                : 'border-outline-variant text-on-surface-variant hover:border-[#93C5FD]',
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

function SelectRow({ icon, label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-label-md font-semibold text-on-surface flex items-center gap-1.5">
        <Icon name={icon} className="text-[18px] text-on-surface-variant" />
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border-2 border-outline/40 bg-white px-3 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-[#1D4ED8] transition"
      >
        {options.map((o) => (
          <option key={o.v} value={o.v}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

function ActionRow({ icon, title, desc, action, onAction, tone = 'primary' }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/50 bg-surface-container-low/40">
      <div className={clsx(
        'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
        tone === 'error' ? 'bg-[#FEE2E2]' : 'bg-[#EFF6FF]',
      )}>
        <Icon name={icon} filled className="text-[20px]"
          style={{ color: tone === 'error' ? '#DC2626' : '#1D4ED8' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface">{title}</p>
        <p className="text-caption text-on-surface-variant line-clamp-2">{desc}</p>
      </div>
      <button
        onClick={onAction}
        className={clsx(
          'shrink-0 min-h-[40px] px-4 rounded-xl text-label-md font-bold transition border-2',
          tone === 'error'
            ? 'border-[#FCA5A5] text-[#DC2626] hover:bg-[#FEE2E2]'
            : 'border-[#BFDBFE] text-[#1D4ED8] hover:bg-[#EFF6FF]',
        )}
      >
        {action}
      </button>
    </div>
  )
}

function InfoBox({ icon, tone, text }) {
  const tones = {
    success: { bg: '#DCFCE7', border: '#86EFAC', fg: '#16A34A' },
    warning: { bg: '#FEF3C7', border: '#FCD34D', fg: '#D97706' },
    error:   { bg: '#FEE2E2', border: '#FCA5A5', fg: '#DC2626' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', fg: '#1D4ED8' },
  }
  const t = tones[tone] || tones.info
  return (
    <div className="flex items-start gap-2 rounded-xl px-4 py-3"
      style={{ background: t.bg, border: `1.5px solid ${t.border}` }}>
      <Icon name={icon} filled className="text-[18px] shrink-0 mt-0.5" style={{ color: t.fg }} />
      <p className="text-caption" style={{ color: t.fg }}>{text}</p>
    </div>
  )
}
