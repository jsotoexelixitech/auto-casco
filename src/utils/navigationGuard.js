/**
 * Permite saltar el guard de “salir de inspección” (p. ej. al confirmar cerrar sesión).
 * El bypass es temporal para no dejar el guard desactivado de forma permanente.
 */
let bypassLeaveGuard = false
let clearTimer = null

export function allowUnsavedLeave() {
  bypassLeaveGuard = true
  if (clearTimer) clearTimeout(clearTimer)
  clearTimer = setTimeout(() => {
    bypassLeaveGuard = false
    clearTimer = null
  }, 3000)
}

export function shouldBypassLeaveGuard() {
  return bypassLeaveGuard
}

export function clearLeaveGuardBypass() {
  if (clearTimer) {
    clearTimeout(clearTimer)
    clearTimer = null
  }
  bypassLeaveGuard = false
}
