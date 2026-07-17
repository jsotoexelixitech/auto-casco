/**
 * Validaciones y máscaras reutilizables — formularios Auto Casco (VE)
 */

const LETTERS_ONLY = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]/g
const CEDULA_LETTERS = /[VEP]/
const RIF_LETTERS = /[JGCVEP]/

/** @returns {{ valid: boolean, message?: string }} */
export function validateResult(valid, message) {
  return valid ? { valid: true } : { valid: false, message }
}

// ── Cédula V|E|P-1234567 (7-8 dígitos) ───────────────────────────────────────

export function formatCedulaVe(value = '') {
  const raw = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw) return ''

  let letter = ''
  let digits = ''
  for (const ch of raw) {
    if (!letter && CEDULA_LETTERS.test(ch)) {
      letter = ch
      continue
    }
    if (letter && /\d/.test(ch) && digits.length < 8) {
      digits += ch
    }
  }

  if (!letter) return digits.slice(0, 8)
  if (!digits) return letter
  return `${letter}-${digits}`
}

export function normalizeCedulaVe(value = '') {
  const raw = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw) return ''

  let letter = 'V'
  let digits = ''

  if (CEDULA_LETTERS.test(raw[0]) && raw.length > 1) {
    letter = raw[0]
    digits = raw.slice(1)
  } else if (CEDULA_LETTERS.test(raw[0]) && raw.length === 1) {
    return raw[0]
  } else if (/^\d+$/.test(raw)) {
    digits = raw
  } else {
    return formatCedulaVe(value)
  }

  digits = digits.replace(/\D/g, '').slice(0, 8)
  if (!digits) return letter.length === 1 && /^[VEP]$/.test(raw) ? letter : ''
  return `${letter}-${digits}`
}

export function validateCedulaVe(value = '') {
  const v = normalizeCedulaVe(value)
  if (!v) return validateResult(false, 'Ingresa la cédula (ej. V-12345678)')
  if (!/^[VEP]-\d{7,8}$/.test(v)) {
    return validateResult(
      false,
      'Formato inválido. Use V-, E- o P- seguido de 7 u 8 dígitos (ej. V-1234567)',
    )
  }
  return validateResult(true)
}

// ── RIF J|G|C|V|E|P-12345678-9 (8 dígitos + verificador) ───────────────────

export function formatRifVe(value = '') {
  const raw = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw) return ''

  let letter = ''
  let digits = ''
  for (const ch of raw) {
    if (!letter && RIF_LETTERS.test(ch)) {
      letter = ch
      continue
    }
    if (letter && /\d/.test(ch) && digits.length < 9) {
      digits += ch
    }
  }

  if (!letter) return digits.slice(0, 9)
  if (!digits) return letter

  const body = digits.slice(0, 8)
  const check = digits.slice(8, 9)
  if (!check) return `${letter}-${body}`
  return `${letter}-${body}-${check}`
}

export function normalizeRifVe(value = '') {
  const raw = String(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!raw) return ''

  let letter = ''
  let digits = ''

  if (RIF_LETTERS.test(raw[0])) {
    letter = raw[0]
    digits = raw.slice(1)
  } else if (/^\d+$/.test(raw)) {
    digits = raw
  } else {
    return formatRifVe(value)
  }

  digits = digits.replace(/\D/g, '').slice(0, 9)

  if (!letter) return digits.slice(0, 9)
  if (!digits) return letter

  // OCR suele devolver 9 dígitos seguidos: los 8 primeros son el cuerpo y el último el verificador
  if (digits.length === 9) {
    return `${letter}-${digits.slice(0, 8)}-${digits.slice(8)}`
  }

  const body = digits.slice(0, 8)
  const check = digits.slice(8, 9)
  if (!check) return `${letter}-${body}`
  return `${letter}-${body}-${check}`
}

export function validateRifVe(value = '') {
  const v = normalizeRifVe(value)
  if (!v) return validateResult(false, 'Ingresa el RIF (ej. J-12345678-9)')
  if (!/^[JGCVEP]-\d{8}-\d$/.test(v)) {
    return validateResult(
      false,
      'Formato inválido. Debe ser letra + 8 dígitos + verificador (ej. J-12345678-9)',
    )
  }
  return validateResult(true)
}

/** Normaliza salida OCR al formato de máscara del formulario */
export function normalizeDocumentoFromOcr(value, mode = 'cedula', tipoDoc) {
  if (mode === 'rif') {
    return normalizeRifVe(value)
  }
  const raw = String(value ?? '').trim()
  if (!raw) return ''
  const letter = tipoDoc && /^[VEP]$/i.test(String(tipoDoc)) ? String(tipoDoc).toUpperCase() : null
  if (letter && !/^[VEP]/i.test(raw)) {
    return normalizeCedulaVe(`${letter}-${raw.replace(/\D/g, '')}`)
  }
  return normalizeCedulaVe(raw)
}

/** Cédula o RIF según modo del formulario */
export function formatDocumentoVe(value, mode = 'cedula') {
  return mode === 'rif' ? formatRifVe(value) : formatCedulaVe(value)
}

export function normalizeDocumentoVe(value, mode = 'cedula') {
  return mode === 'rif' ? normalizeRifVe(value) : normalizeCedulaVe(value)
}

export function validateDocumentoVe(value, mode = 'cedula') {
  return mode === 'rif' ? validateRifVe(value) : validateCedulaVe(value)
}

// ── Nombres / apellidos (solo letras) ─────────────────────────────────────

export function formatPersonName(value = '') {
  return String(value).replace(LETTERS_ONLY, '')
}

export function normalizePersonName(value = '') {
  return formatPersonName(value).trim().replace(/\s+/g, ' ').toUpperCase()
}

export function validatePersonName(value = '', label = 'Este campo') {
  const v = normalizePersonName(value)
  if (!v) return validateResult(false, `${label} es requerido`)
  if (!/^[A-ZÁÉÍÓÚÜÑ\s]+$/.test(v)) {
    return validateResult(false, `${label} solo admite letras`)
  }
  return validateResult(true)
}

/** Caracteres permitidos en razón social: letras, números y puntuación empresarial. */
const RAZON_SOCIAL_ALLOWED = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,\-&'"/()#+]/g
const RAZON_SOCIAL_VALID = /^[A-ZÁÉÍÓÚÜÑ0-9\s.,\-&'"/()#+]+$/

// ── Razón social (empresa: puntos, comas, guiones, etc.) ──────────────────

export function formatRazonSocial(value = '') {
  return String(value).replace(RAZON_SOCIAL_ALLOWED, '')
}

export function normalizeRazonSocial(value = '') {
  return formatRazonSocial(value).trim().replace(/\s+/g, ' ').toUpperCase()
}

export function validateRazonSocial(value = '', label = 'Razón Social') {
  const v = normalizeRazonSocial(value)
  if (!v) return validateResult(false, `${label} es requerida`)
  if (v.length < 2) {
    return validateResult(false, `${label} es demasiado corta`)
  }
  if (!RAZON_SOCIAL_VALID.test(v)) {
    return validateResult(
      false,
      `${label} admite letras, números y signos como . , - & / ( )`,
    )
  }
  if (!/[A-ZÁÉÍÓÚÜÑ]/.test(v)) {
    return validateResult(false, `${label} debe incluir al menos una letra`)
  }
  return validateResult(true)
}

// ── Vehículo: ASCII sin acentos/ñ, mayúsculas al blur ─────────────────────

/** Marca, color, placa, serial: solo A-Z y 0-9 (y espacios). */
const VEHICLE_ASCII_STRIP = /[^A-Za-z0-9\s]/g
const VEHICLE_ASCII_VALID = /^[A-Z0-9\s]+$/

/** Modelo: lo anterior + guion y slash. */
const VEHICLE_MODELO_STRIP = /[^A-Za-z0-9\s\-/]/g
const VEHICLE_MODELO_VALID = /^[A-Z0-9\s\-/]+$/

export function formatVehicleAscii(value = '') {
  return String(value).replace(VEHICLE_ASCII_STRIP, '')
}

export function normalizeVehicleAscii(value = '') {
  return formatVehicleAscii(value).trim().replace(/\s+/g, ' ').toUpperCase()
}

export function validateVehicleAscii(value = '', label = 'Este campo') {
  const v = normalizeVehicleAscii(value)
  if (!v) return validateResult(false, `${label} es requerido`)
  if (!VEHICLE_ASCII_VALID.test(v)) {
    return validateResult(false, `${label} solo admite letras sin acento y números`)
  }
  return validateResult(true)
}

export function formatVehicleModelo(value = '') {
  return String(value).replace(VEHICLE_MODELO_STRIP, '')
}

export function normalizeVehicleModelo(value = '') {
  return formatVehicleModelo(value).trim().replace(/\s+/g, ' ').toUpperCase()
}

export function validateVehicleModelo(value = '', label = 'Modelo') {
  const v = normalizeVehicleModelo(value)
  if (!v) return validateResult(false, `${label} es requerido`)
  if (!VEHICLE_MODELO_VALID.test(v)) {
    return validateResult(false, `${label} solo admite letras, números, guion y /`)
  }
  return validateResult(true)
}

export function getMaxVehicleAnio() {
  return new Date().getFullYear() + 1
}

export function formatVehicleAnio(value = '') {
  return String(value).replace(/\D/g, '').slice(0, 4)
}

export function normalizeVehicleAnio(value = '') {
  return formatVehicleAnio(value)
}

export function validateVehicleAnio(value = '', label = 'Año') {
  const v = normalizeVehicleAnio(value)
  if (!v) return validateResult(false, `${label} es requerido`)
  if (!/^\d{4}$/.test(v)) {
    return validateResult(false, `${label} debe tener 4 dígitos`)
  }
  const n = Number(v)
  const max = getMaxVehicleAnio()
  if (n < 1900 || n > max) {
    return validateResult(false, `${label} debe ser entre 1900 y ${max}`)
  }
  return validateResult(true)
}

// ── Correo electrónico ────────────────────────────────────────────────────

export function formatEmail(value = '') {
  return String(value).replace(/\s/g, '')
}

export function normalizeEmail(value = '') {
  return formatEmail(value).trim().toLowerCase()
}

export function validateEmail(value = '') {
  const v = normalizeEmail(value)
  if (!v) return validateResult(false, 'Ingresa un correo electrónico')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return validateResult(false, 'Correo electrónico inválido')
  }
  return validateResult(true)
}

// ── Teléfono Venezuela 0 + (2|4) + reglas + máscara 9999-9999999 ───────────

function phoneDigitAllowed(existingDigits, newDigit) {
  const next = existingDigits + newDigit
  const len = next.length

  if (len === 1) return newDigit === '0'
  if (len === 2) return newDigit === '2' || newDigit === '4'
  if (len === 3) {
    if (next[1] === '2') return newDigit >= '1' && newDigit <= '9'
    if (next[1] === '4') return newDigit === '1' || newDigit === '2'
    return false
  }
  if (len === 4) {
    if (next[1] === '2') return newDigit >= '2' && newDigit <= '9'
    if (next[1] === '4') return newDigit === '2' || newDigit === '4' || newDigit === '6'
    return false
  }
  if (len >= 5 && len <= 11) return /\d/.test(newDigit)
  return false
}

function filterPhoneDigits(input) {
  const digitsOnly = String(input).replace(/\D/g, '')
  let out = ''
  for (const d of digitsOnly) {
    if (phoneDigitAllowed(out, d)) out += d
    if (out.length >= 11) break
  }
  return out
}

export function formatPhoneVe(value = '') {
  const digits = filterPhoneDigits(value)
  if (digits.length <= 4) return digits
  return `${digits.slice(0, 4)}-${digits.slice(4)}`
}

export function normalizePhoneVe(value = '') {
  return formatPhoneVe(value)
}

export function validatePhoneVe(value = '') {
  const digits = filterPhoneDigits(value)
  if (!digits) return validateResult(false, 'Ingresa el teléfono móvil')
  if (digits.length !== 11) {
    return validateResult(false, 'El teléfono debe tener 11 dígitos (ej. 0414-1234567)')
  }
  return validateResult(true)
}

// ── Fecha de nacimiento (mínimo 18 años cumplidos) ─────────────────────────

export function normalizeBirthDate(value = '') {
  return String(value).trim().slice(0, 10)
}

/** Fecha máxima seleccionable: hoy menos `minAge` años (input type="date") */
export function maxBirthDateForMinAge(minAge = 18) {
  const d = new Date()
  d.setFullYear(d.getFullYear() - minAge)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function validateBirthDateMinAge(value = '', minAge = 18) {
  const v = normalizeBirthDate(value)
  if (!v) return validateResult(false, 'Ingresa la fecha de nacimiento')

  const birth = new Date(`${v}T12:00:00`)
  if (Number.isNaN(birth.getTime())) {
    return validateResult(false, 'Fecha de nacimiento inválida')
  }

  const today = new Date()
  const ref = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12)

  if (birth > ref) {
    return validateResult(false, 'La fecha de nacimiento no puede ser futura')
  }

  let age = ref.getFullYear() - birth.getFullYear()
  const monthDiff = ref.getMonth() - birth.getMonth()
  const dayDiff = ref.getDate() - birth.getDate()
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1
  }

  if (age < minAge) {
    return validateResult(false, `Debes tener al menos ${minAge} años cumplidos`)
  }

  return validateResult(true)
}

// ── Texto libre (descripciones de daños, observaciones, ubicación) ─────────

export const DAMAGE_TEXT_INVALID_CHARS_MESSAGE =
  'Solo se permiten letras, números, espacios y signos de puntuación básicos (. , ; : - ( ) / \' " ¿ ? ¡ !).'

const DAMAGE_TEXT_DISALLOWED = /[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ0-9\s.,;:\-()/''"¿?¡!\n\r]/g

export function formatDamageText(value = '') {
  return String(value).replace(DAMAGE_TEXT_DISALLOWED, '')
}

export function hasInvalidDamageTextChars(value = '') {
  return formatDamageText(value) !== String(value ?? '')
}

export function validateDamageText(value = '', { required = false, label = 'Este campo' } = {}) {
  const raw = String(value ?? '')

  if (!raw.trim()) {
    if (required) return validateResult(false, `${label} es requerido`)
    return validateResult(true)
  }

  if (hasInvalidDamageTextChars(raw)) {
    return validateResult(false, DAMAGE_TEXT_INVALID_CHARS_MESSAGE)
  }

  return validateResult(true)
}

// ── Registro de handlers por tipo de campo (UI) ───────────────────────────

export const FIELD_HANDLERS = {
  cedula: {
    format: formatCedulaVe,
    normalize: normalizeCedulaVe,
    validate: validateCedulaVe,
    placeholder: 'V-12345678',
    inputMode: 'text',
    autoComplete: 'off',
  },
  rif: {
    format: formatRifVe,
    normalize: normalizeRifVe,
    validate: validateRifVe,
    placeholder: 'J-12345678-9',
    inputMode: 'text',
    autoComplete: 'off',
  },
  personName: {
    format: formatPersonName,
    normalize: normalizePersonName,
    validate: (v, label) => validatePersonName(v, label),
    placeholder: '',
    inputMode: 'text',
    autoComplete: 'given-name',
  },
  razonSocial: {
    format: formatRazonSocial,
    normalize: normalizeRazonSocial,
    validate: (v, label) => validateRazonSocial(v, label),
    placeholder: 'Ej. TU EMPRESA, C.A.',
    inputMode: 'text',
    autoComplete: 'organization',
  },
  vehicleAscii: {
    format: formatVehicleAscii,
    normalize: normalizeVehicleAscii,
    validate: (v, label) => validateVehicleAscii(v, label),
    placeholder: '',
    inputMode: 'text',
    autoComplete: 'off',
  },
  vehicleModelo: {
    format: formatVehicleModelo,
    normalize: normalizeVehicleModelo,
    validate: (v, label) => validateVehicleModelo(v, label),
    placeholder: 'Ej. HFC1037KF1G / T6',
    inputMode: 'text',
    autoComplete: 'off',
  },
  vehicleAnio: {
    format: formatVehicleAnio,
    normalize: normalizeVehicleAnio,
    validate: (v, label) => validateVehicleAnio(v, label),
    placeholder: 'Ej. 2024',
    inputMode: 'numeric',
    autoComplete: 'off',
  },
  email: {
    format: formatEmail,
    normalize: normalizeEmail,
    validate: validateEmail,
    placeholder: 'ejemplo@correo.com',
    inputMode: 'email',
    autoComplete: 'email',
  },
  phoneVe: {
    format: formatPhoneVe,
    normalize: normalizePhoneVe,
    validate: validatePhoneVe,
    placeholder: '0414-1234567',
    inputMode: 'tel',
    autoComplete: 'tel',
  },
  birthDate: {
    format: normalizeBirthDate,
    normalize: normalizeBirthDate,
    validate: validateBirthDateMinAge,
    placeholder: '',
    inputMode: 'none',
    autoComplete: 'bday',
    inputType: 'date',
    max: () => maxBirthDateForMinAge(18),
  },
  damageText: {
    format: formatDamageText,
    normalize: formatDamageText,
    validate: (v, label) => validateDamageText(v, { label }),
    placeholder: '',
    inputMode: 'text',
    autoComplete: 'off',
  },
}
