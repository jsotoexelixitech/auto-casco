import { useState, useEffect } from 'react'
import clsx from 'clsx'
import { FIELD_HANDLERS } from '../../utils/fieldValidators'

/**
 * Input con máscara en tiempo real y validación al salir del campo (blur).
 * @param {keyof typeof FIELD_HANDLERS | 'documento'} fieldType
 * @param {'cedula'|'rif'} documentMode — solo si fieldType === 'documento'
 */
export default function ValidatedField({
  fieldType,
  documentMode = 'cedula',
  label,
  value,
  onChange,
  type,
  placeholder,
  className = '',
  mono = false,
  disabled = false,
  validateTrigger = 0,
  edited = false,
  required = true,
  maxLength,
}) {
  const [error, setError] = useState('')

  const handler =
    fieldType === 'documento'
      ? FIELD_HANDLERS[documentMode === 'rif' ? 'rif' : 'cedula']
      : FIELD_HANDLERS[fieldType]

  const runValidation = (rawValue = value) => {
    if (!handler) return { normalized: rawValue ?? '', result: { valid: true } }
    const normalized = handler.normalize(rawValue ?? '')
    if (!required && !normalized) {
      setError('')
      return { normalized, result: { valid: true } }
    }
    const result = handler.validate(normalized, label)
    setError(result.valid ? '' : result.message ?? '')
    return { normalized, result }
  }

  useEffect(() => {
    if (!validateTrigger || !handler) return
    runValidation(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al pulsar Siguiente
  }, [validateTrigger])

  if (!handler) {
    return null
  }

  const handleChange = (e) => {
    let next = handler.format(e.target.value)
    if (maxLength) next = next.slice(0, maxLength)
    onChange(next)
    if (error) setError('')
  }

  const handleBlur = () => {
    let { normalized } = runValidation(value ?? '')
    if (maxLength) normalized = normalized.slice(0, maxLength)
    if (normalized !== (value ?? '')) {
      onChange(normalized)
    }
  }

  return (
    <div className={clsx('min-w-0', className)}>
      <div className="flex items-center justify-between gap-2 mb-0">
        <label className={clsx('label mb-0', edited && 'text-amber-800')}>{label}</label>
        {edited && (
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide text-amber-800 bg-amber-100 border border-amber-200/80 px-1.5 py-0.5 rounded-md">
            Editado
          </span>
        )}
      </div>
      <input
        type={type ?? handler.inputType ?? (fieldType === 'email' ? 'email' : 'text')}
        inputMode={handler.inputMode}
        autoComplete={handler.autoComplete}
        value={value || ''}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder ?? handler.placeholder}
        disabled={disabled}
        maxLength={maxLength}
        max={handler.max?.()}
        aria-invalid={error ? true : undefined}
        className={clsx(
          'input mt-1',
          mono && 'font-mono',
          error && 'border-error focus:ring-error/30',
          !error && edited && 'border-amber-400 focus:ring-amber-400/30 bg-amber-50/40',
        )}
      />
      {error && (
        <p className="mt-1 text-xs text-error leading-snug" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
