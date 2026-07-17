import { useEffect, useState } from 'react'
import clsx from 'clsx'
import Icon from '../../components/ui/Icon'
import { useToast } from '../../context/ToastContext'
import { formatDamageText } from '../../utils/fieldValidators'
import { validateDamageDraft, validateStep4Fields } from './step4Validation'

const DAMAGE_TYPES = [
  { id: 'rayón', label: 'Rayón' },
  { id: 'abolladura', label: 'Abolladura' },
  { id: 'rotura', label: 'Rotura' },
  { id: 'pintura', label: 'Pérdida de pintura' },
  { id: 'cristal', label: 'Cristal dañado' },
  { id: 'otro', label: 'Otro' },
]

const EMPTY_DRAFT = {
  tipo: 'rayón',
  tipoOtro: '',
  severidad: 'leve',
  ubicacion: '',
  descripcion: '',
}

function getTipoLabel(damage) {
  if (damage.tipo === 'otro') return damage.tipoOtro?.trim() || 'Otro'
  return DAMAGE_TYPES.find((t) => t.id === damage.tipo)?.label || damage.tipo
}

const SEVERITY = [
  { id: 'leve', label: 'Leve', tone: 'success' },
  { id: 'moderado', label: 'Moderado', tone: 'warning' },
  { id: 'grave', label: 'Grave', tone: 'error' },
]

export default function Step4Damages({ state, validateTrigger = 0 }) {
  const {
    danios, setDanios,
    descripcionDanios, setDescripcionDanios,
    observacionesRiesgo, setObservacionesRiesgo,
  } = state
  const toast = useToast()
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [descripcionError, setDescripcionError] = useState('')
  const [observacionesError, setObservacionesError] = useState('')
  const [draftErrors, setDraftErrors] = useState({})
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT })

  const validateDraft = () => validateDamageDraft(draft)

  const cancelAddDamage = () => {
    setDraft({ ...EMPTY_DRAFT })
    setDraftErrors({})
    setEditingId(null)
    setShowAdd(false)
  }

  const startAddDamage = () => {
    setDraft({ ...EMPTY_DRAFT })
    setDraftErrors({})
    setEditingId(null)
    setShowAdd(true)
  }

  const startEditDamage = (damage) => {
    setEditingId(damage.id)
    setDraft({
      tipo: damage.tipo === 'otro' ? 'otro' : damage.tipo,
      tipoOtro: damage.tipo === 'otro' ? (damage.tipoOtro || '') : '',
      severidad: damage.severidad,
      ubicacion: damage.ubicacion || '',
      descripcion: damage.descripcion || '',
    })
    setDraftErrors({})
    setShowAdd(true)
  }

  const clearDraftError = (field) => {
    setDraftErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  useEffect(() => {
    if (!validateTrigger) return
    const { errors } = validateStep4Fields({ descripcionDanios, observacionesRiesgo })
    setDescripcionError(errors.descripcionDanios || '')
    setObservacionesError(errors.observacionesRiesgo || '')
  }, [validateTrigger, descripcionDanios, observacionesRiesgo])

  const saveDamage = () => {
    const errors = validateDraft()
    if (Object.keys(errors).length > 0) {
      setDraftErrors(errors)
      toast.error('Debes completar todos los campos requeridos antes de registrar el daño.', {
        title: 'Formulario incompleto',
      })
      return
    }

    if (editingId) {
      setDanios(
        danios.map((d) =>
          d.id === editingId
            ? { ...d, ...draft, id: d.id, fecha: d.fecha }
            : d,
        ),
      )
      toast.success('Daño actualizado')
    } else {
      setDanios([
        ...danios,
        { ...draft, id: `dam-${Date.now()}`, fecha: new Date().toISOString() },
      ])
      toast.success('Daño registrado')
    }

    cancelAddDamage()
  }

  const removeDamage = (id) => {
    setDanios(danios.filter((d) => d.id !== id))
    if (editingId === id) cancelAddDamage()
  }

  const handleDescripcionChange = (value) => {
    const formatted = formatDamageText(value)
    setDescripcionDanios(formatted)
    if (formatted.trim()) setDescripcionError('')
  }

  const handleObservacionesChange = (value) => {
    const formatted = formatDamageText(value)
    setObservacionesRiesgo(formatted)
    if (formatted.trim() || !observacionesError) return
    setObservacionesError('')
  }

  const updateDraftField = (field, value) => {
    const formatted = formatDamageText(value)
    setDraft({ ...draft, [field]: formatted })
    if (formatted.trim()) clearDraftError(field)
  }

  return (
    <div className="w-full max-w-7xl mx-auto flex flex-col gap-4 lg:gap-6">
      <div className="flex items-start gap-3 p-3 sm:p-4 rounded-xl border"
        style={{ backgroundColor: '#EEF0FA', borderColor: 'rgba(15,26,90,0.15)' }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: '#D8DCF2', color: '#0F1A5A' }}>
          <Icon name="info" className="text-[22px]" filled />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: '#0F1A5A' }}>Reporta daños visibles en tu vehículo</p>
          <p className="text-caption text-on-surface-variant mt-0.5 leading-snug">
            Agrega los daños que observes. La IA los complementará con el análisis de las fotos para generar el informe final.
          </p>
        </div>
      </div>

      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-outline-variant/50 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Icon name="report" className="text-error text-[24px]" filled />
            <h3 className="text-headline-md text-on-surface truncate">Daños identificados</h3>
          </div>
          <button onClick={startAddDamage} className="btn-accent shrink-0">
            <Icon name="add" /> <span className="hidden sm:inline">Agregar</span>
          </button>
        </div>

        {danios.length === 0 && !showAdd && (
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full bg-success-container text-on-success-container flex items-center justify-center mx-auto mb-2">
              <Icon name="task_alt" className="text-[28px]" filled />
            </div>
            <p className="font-bold text-on-surface">Sin daños registrados</p>
            <p className="text-caption text-on-surface-variant">
              Agrega un daño si fue detectado durante la inspección.
            </p>
          </div>
        )}

        {danios.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {danios.map((d) => (
              <div
                key={d.id}
                className={clsx(
                  'border rounded-xl p-3 bg-surface-container-low/40',
                  editingId === d.id
                    ? 'border-primary/50 ring-1 ring-primary/20'
                    : 'border-outline-variant/50',
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div
                      className={clsx(
                        'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                        d.severidad === 'leve' &&
                          'bg-success-container text-on-success-container',
                        d.severidad === 'moderado' &&
                          'bg-warning-container text-on-warning-container',
                        d.severidad === 'grave' &&
                          'bg-error-container text-on-error-container',
                      )}
                    >
                      <Icon name="report" filled />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-on-surface capitalize truncate">{getTipoLabel(d)}</p>
                      <p className="text-caption text-on-surface-variant capitalize truncate">
                        {d.severidad} · {d.ubicacion}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditDamage(d)}
                      aria-label="Actualizar daño"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-primary hover:bg-primary/10 transition"
                    >
                      <Icon name="edit" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeDamage(d.id)}
                      aria-label="Eliminar daño"
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/60 transition"
                    >
                      <Icon name="delete" />
                    </button>
                  </div>
                </div>
                {d.descripcion && (
                  <p className="text-caption text-on-surface mt-2 line-clamp-2">
                    {d.descripcion}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {showAdd && (
          <div className="border-2 border-primary/30 bg-primary-fixed/20 rounded-xl p-3 sm:p-4 mt-3 animate-fade-in">
            <h4 className="font-bold text-primary mb-2">
              {editingId ? 'Actualizar daño' : 'Nuevo daño'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="label">Tipo</label>
                <div className="flex flex-wrap gap-1.5">
                  {DAMAGE_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setDraft({
                          ...draft,
                          tipo: t.id,
                          tipoOtro: t.id === 'otro' ? draft.tipoOtro : '',
                        })
                        if (t.id !== 'otro') clearDraftError('tipoOtro')
                      }}
                      className={clsx(
                        'px-3 min-h-[40px] rounded-full text-label-md font-semibold border transition',
                        draft.tipo === t.id
                          ? 'bg-primary text-on-primary border-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary',
                      )}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
                {draft.tipo === 'otro' && (
                  <>
                    <input
                      className={clsx(
                        'input mt-2',
                        draftErrors.tipoOtro && 'border-error ring-1 ring-error/30',
                      )}
                      placeholder="Describe el tipo de daño…"
                      value={draft.tipoOtro}
                      onChange={(e) => updateDraftField('tipoOtro', e.target.value)}
                      aria-invalid={Boolean(draftErrors.tipoOtro)}
                    />
                    {draftErrors.tipoOtro && (
                      <p className="text-caption text-error mt-1.5 font-medium">{draftErrors.tipoOtro}</p>
                    )}
                  </>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Severidad</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SEVERITY.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setDraft({ ...draft, severidad: s.id })}
                      className={clsx(
                        'min-h-[44px] rounded-lg text-label-md border transition font-semibold',
                        draft.severidad === s.id && s.tone === 'success' &&
                          'bg-success text-on-success border-success',
                        draft.severidad === s.id && s.tone === 'warning' &&
                          'bg-warning text-on-warning border-warning',
                        draft.severidad === s.id && s.tone === 'error' &&
                          'bg-error text-on-error border-error',
                        draft.severidad !== s.id &&
                          'bg-white border-outline-variant text-on-surface-variant',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Ubicación en el vehículo</label>
                <input
                  className={clsx('input', draftErrors.ubicacion && 'border-error ring-1 ring-error/30')}
                  placeholder="Ej. Parachoques delantero izquierdo"
                  value={draft.ubicacion}
                  onChange={(e) => updateDraftField('ubicacion', e.target.value)}
                  aria-invalid={Boolean(draftErrors.ubicacion)}
                />
                {draftErrors.ubicacion && (
                  <p className="text-caption text-error mt-1.5 font-medium">{draftErrors.ubicacion}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className="label">Descripción</label>
                <textarea
                  className={clsx(
                    'input min-h-[72px] resize-none',
                    draftErrors.descripcion && 'border-error ring-1 ring-error/30',
                  )}
                  placeholder="Describe el daño…"
                  value={draft.descripcion}
                  onChange={(e) => updateDraftField('descripcion', e.target.value)}
                  aria-invalid={Boolean(draftErrors.descripcion)}
                />
                {draftErrors.descripcion && (
                  <p className="text-caption text-error mt-1.5 font-medium">{draftErrors.descripcion}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button type="button" onClick={cancelAddDamage} className="btn-soft flex-1">
                Cancelar
              </button>
              <button type="button" onClick={saveDamage} className="btn-primary flex-1">
                <Icon name="check" /> {editingId ? 'Actualizar' : 'Registrar'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="card p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-outline-variant/50">
          <Icon name="description" className="text-primary text-[22px]" filled />
          <h3 className="text-headline-md text-on-surface">Descripción y Observaciones</h3>
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <Icon name="edit_note" className="text-[18px] text-on-surface-variant" />
            Descripción de los Daños
            <span className="text-error font-bold">*</span>
          </label>
          <textarea
            className={clsx(
              'input min-h-[88px] resize-none',
              descripcionError && 'border-error ring-1 ring-error/30',
            )}
            placeholder="Describe detalladamente los daños observados en el vehículo…"
            value={descripcionDanios}
            onChange={(e) => handleDescripcionChange(e.target.value)}
            required
            aria-invalid={Boolean(descripcionError)}
            aria-describedby={descripcionError ? 'descripcion-danios-error' : undefined}
          />
          {descripcionError && (
            <p id="descripcion-danios-error" className="text-caption text-error mt-1.5 font-medium">
              {descripcionError}
            </p>
          )}
        </div>

        <div>
          <label className="label flex items-center gap-1.5">
            <Icon name="assignment" className="text-[18px] text-on-surface-variant" />
            Observaciones adicionales
          </label>
          <textarea
            className={clsx(
              'input min-h-[88px] resize-none',
              observacionesError && 'border-error ring-1 ring-error/30',
            )}
            placeholder="Observaciones adicionales sobre el estado del vehículo…"
            value={observacionesRiesgo}
            onChange={(e) => handleObservacionesChange(e.target.value)}
            aria-invalid={Boolean(observacionesError)}
            aria-describedby={observacionesError ? 'observaciones-riesgo-error' : undefined}
          />
          {observacionesError && (
            <p id="observaciones-riesgo-error" className="text-caption text-error mt-1.5 font-medium">
              {observacionesError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
