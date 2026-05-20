/**
 * dataNormalizers.js
 * Pure functions that transform API responses into the frontend domain shape.
 * Extracted from DataContext to keep the context lean and these functions testable.
 */

export function normalizePolicies(list) {
  return list.map((p) => ({
    ...p,
    dbId: p.id,
    id: p.numero ?? p.id,
    numero: p.numero ?? p.id,
    plan: p.plan ?? p.planNombre ?? 'Estándar',
    modalidad: p.modalidad === 'dias' ? 'Por Días' : p.modalidad,
    vigenciaDesde: p.vigenciaDesde ?? p.fechaInicio?.slice(0, 10) ?? '',
    vigenciaHasta: p.vigenciaHasta ?? p.fechaFin?.slice(0, 10) ?? '',
    saldo: p.saldo ?? p.saldoDisponible ?? 0,
    coberturas: Array.isArray(p.coberturas) ? p.coberturas : [],
  }))
}

export function normalizePagos(list) {
  return list.map((p) => ({
    id: p.id,
    fecha: p.fecha?.slice(0, 10) ?? p.createdAt?.slice(0, 10) ?? '',
    concepto: p.concepto,
    metodo: p.metodo,
    monto: p.monto,
    estado: p.estado,
  }))
}

export function normalizePago(p) {
  return {
    id: p.id,
    fecha: p.fecha?.slice(0, 10) ?? new Date().toISOString().slice(0, 10),
    concepto: p.concepto,
    metodo: p.metodo,
    monto: p.monto,
    estado: p.estado,
  }
}

export function normalizeMethods(list) {
  return list.map(normalizeMethod)
}

export function normalizeMethod(m) {
  return {
    id: m.id,
    type: m.type,
    label: m.label,
    sub: m.sub,
    icon: m.icon ?? 'credit_card',
    primary: m.isPrimary ?? m.primary ?? false,
    isPrimary: m.isPrimary ?? m.primary ?? false,
  }
}
