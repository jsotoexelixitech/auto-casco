import { useState } from 'react'
import clsx from 'clsx'
import PageHeader from '../components/ui/PageHeader'
import Icon from '../components/ui/Icon'
import StatusChip from '../components/ui/StatusChip'
import { useAuth } from '../context/AuthContext'
import { useData } from '../context/DataContext'
import { useToast } from '../context/ToastContext'
import { ROLE_LABELS } from '../data/mockData'

export default function ProfilePage() {
  const { user } = useAuth()
  const { policies, vehicles, inspections } = useData()
  const toast = useToast()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: '+58 (0414) 123-4567',
    address: 'Av. Francisco de Miranda, Caracas, Venezuela',
    documento: 'V-18.456.789',
    fechaNacimiento: '1989-07-14',
  })

  const myPolicies = policies.filter((p) => p.holderId === user?.id)
  const myVehicles = vehicles.filter((v) => v.ownerId === user?.id)
  const myInspections = inspections.filter((i) => i.asignadoA === user?.id)

  const save = () => {
    setEditing(false)
    toast.success('Perfil actualizado correctamente', { title: 'Cambios guardados' })
  }

  return (
    <>
      <PageHeader
        breadcrumbs={[
          { label: 'Inicio', to: '/dashboard' },
          { label: 'Mi Perfil' },
        ]}
        title="Mi Perfil"
        subtitle="Información personal y resumen de tu cuenta en La Mundial."
        actions={
          editing ? (
            <>
              <button onClick={() => setEditing(false)} className="btn-soft">
                <Icon name="close" /> Cancelar
              </button>
              <button onClick={save} className="btn-primary">
                <Icon name="check" /> Guardar
              </button>
            </>
          ) : (
            <button onClick={() => setEditing(true)} className="btn-primary">
              <Icon name="edit" /> Editar
            </button>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: profile card */}
        <aside className="card-elev2 p-5 sm:p-6 text-center bg-gradient-brand text-on-primary relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-400/20 rounded-full blur-3xl" />
          <div className="relative">
            <div
              className={clsx(
                'w-24 h-24 sm:w-28 sm:h-28 rounded-full mx-auto flex items-center justify-center text-white font-bold text-3xl ring-4 ring-white/30',
                user?.color || 'bg-primary',
              )}
            >
              {user?.avatar}
            </div>
            <h2 className="text-headline-lg mt-3 truncate">{user?.name}</h2>
            <p className="text-body-md opacity-80 truncate">
              {ROLE_LABELS[user?.role]}
            </p>
            <div className="mt-3 flex justify-center">
              <StatusChip
                tone="accent"
                status="Cuenta verificada"
                icon="verified"
                size="sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-5 pt-5 border-t border-white/15">
              <div className="min-w-0">
                <p className="text-headline-md font-bold leading-none">{myPolicies.length}</p>
                <p className="text-[10px] opacity-80 uppercase tracking-wider mt-0.5">Pólizas</p>
              </div>
              <div className="min-w-0">
                <p className="text-headline-md font-bold leading-none">{myVehicles.length}</p>
                <p className="text-[10px] opacity-80 uppercase tracking-wider mt-0.5">Vehículos</p>
              </div>
              <div className="min-w-0">
                <p className="text-headline-md font-bold leading-none">{myInspections.length}</p>
                <p className="text-[10px] opacity-80 uppercase tracking-wider mt-0.5">Inspecciones</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right: form */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
              <Icon name="badge" className="text-primary" filled />
              Información personal
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field
                label="Nombre completo"
                value={form.name}
                editing={editing}
                onChange={(v) => setForm({ ...form, name: v })}
              />
              <Field
                label="Documento"
                value={form.documento}
                editing={editing}
                onChange={(v) => setForm({ ...form, documento: v })}
              />
              <Field
                label="Correo electrónico"
                type="email"
                value={form.email}
                editing={editing}
                onChange={(v) => setForm({ ...form, email: v })}
              />
              <Field
                label="Teléfono"
                type="tel"
                value={form.phone}
                editing={editing}
                onChange={(v) => setForm({ ...form, phone: v })}
              />
              <Field
                label="Fecha de nacimiento"
                type="date"
                value={form.fechaNacimiento}
                editing={editing}
                onChange={(v) => setForm({ ...form, fechaNacimiento: v })}
              />
              <Field
                label="Dirección"
                value={form.address}
                editing={editing}
                onChange={(v) => setForm({ ...form, address: v })}
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h3 className="text-headline-md text-on-surface mb-3 flex items-center gap-2">
              <Icon name="security" className="text-primary" filled />
              Seguridad
            </h3>
            <div className="space-y-2">
              <SecurityRow
                icon="password"
                title="Contraseña"
                value="Última actualización hace 32 días"
                action="Cambiar"
                onAction={() =>
                  toast.info('Te enviamos un correo con instrucciones', {
                    title: 'Cambio de contraseña',
                  })
                }
              />
              <SecurityRow
                icon="phonelink_lock"
                title="Autenticación en dos pasos"
                value="Activada · SMS al +58 (***) ***-4567"
                action="Configurar"
                onAction={() =>
                  toast.info('Abriendo configuración de 2FA…', {
                    title: 'Seguridad',
                  })
                }
                tone="success"
              />
              <SecurityRow
                icon="devices"
                title="Sesiones activas"
                value="2 dispositivos · Caracas, VE"
                action="Ver"
                onAction={() =>
                  toast.info(
                    'Móvil iOS · Caracas (esta sesión)\nNavegador Chrome · Caracas',
                    { title: '2 sesiones activas', duration: 4500 },
                  )
                }
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Field({ label, value, editing, onChange, type = 'text', className = '' }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="label">{label}</label>
      {editing ? (
        <input
          className="input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <p className="text-body-md text-on-surface font-semibold py-2.5 px-3 rounded-lg bg-surface-container-low truncate">
          {value || '—'}
        </p>
      )}
    </div>
  )
}

function SecurityRow({ icon, title, value, action, onAction, tone }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/50 bg-surface-container-low/50">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          tone === 'success'
            ? 'bg-success-container text-on-success-container'
            : 'bg-primary-fixed text-primary'
        }`}
      >
        <Icon name={icon} filled />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-on-surface truncate">{title}</p>
        <p className="text-caption text-on-surface-variant truncate">{value}</p>
      </div>
      <button onClick={onAction} className="btn-soft py-1.5 px-3 shrink-0">
        {action}
      </button>
    </div>
  )
}
