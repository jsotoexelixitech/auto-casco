import { BadRequestException } from '@nestjs/common';

/**
 * Convierte param de ruta / body a ID correlativo (Int).
 * Acepta número o string numérico ("12").
 */
export function toCorrelativeId(value: string | number | undefined | null): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isInteger(n) || n <= 0) return null;
  return n;
}

export function requireCorrelativeId(
  value: string | number | undefined | null,
  label = 'ID',
): number {
  const n = toCorrelativeId(value);
  if (n == null) throw new BadRequestException(`${label} inválido`);
  return n;
}
