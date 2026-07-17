export interface ValidacionContenido {
  esCorrecta?: boolean;
  confianza?: number;
  elementoDetectado?: string;
  motivo?: string;
}

export interface SequenceContentContext {
  nombre: string;
  descripcion?: string;
  piezas: string[];
  diagramZone?: string;
  sequenceId?: string;
}

/** Zonas donde NO se valida marca/modelo/color/placa (solo contenido + reglas específicas). */
export const SKIP_VEHICLE_IDENTITY_ZONES = new Set([
  'serial',
  'interior',
  'dashboard',
  'trunk',
  'damages',
  'roof',
]);

const ZONE_HINTS: Record<
  string,
  { esperado: string; rechaza: string; ejemplosIncorrectos: string }
> = {
  front: {
    esperado: 'Vista frontal panorámica del vehículo con capó, parachoques y faros delanteros',
    rechaza: 'interior, tablero, serial, caucho de repuesto, solo una rueda o puerta aislada',
    ejemplosIncorrectos: 'foto del tablero, serial, maletero con repuesto, solo asiento',
  },
  'front-right': {
    esperado: 'Vista diagonal frontal-derecha del vehículo (frente + lateral derecho)',
    rechaza: 'interior, tablero, serial, repuesto, solo trasera',
    ejemplosIncorrectos: 'foto trasera, interior, impronta',
  },
  'front-left': {
    esperado: 'Vista diagonal frontal-izquierda del vehículo',
    rechaza: 'interior, tablero, serial, repuesto, solo trasera',
    ejemplosIncorrectos: 'foto trasera, tablero, placa de circulación en primer plano',
  },
  rear: {
    esperado: 'Vista trasera del vehículo con maletero/baúl y placa trasera visible',
    rechaza: 'interior, frontal, serial, repuesto, solo lateral',
    ejemplosIncorrectos: 'foto frontal, tablero, caucho de repuesto',
  },
  'rear-right': {
    esperado: 'Vista diagonal trasera-derecha del vehículo',
    rechaza: 'interior, frontal, serial, repuesto',
    ejemplosIncorrectos: 'foto del tablero, impronta, puerta sola sin contexto',
  },
  'rear-left': {
    esperado: 'Vista diagonal trasera-izquierda del vehículo',
    rechaza: 'interior, frontal, serial, repuesto',
    ejemplosIncorrectos: 'foto frontal, interior, serial',
  },
  serial: {
    esperado:
      'Serial de carrocería: impronta, placa VIN metálica o número troquelado en el chasis',
    rechaza:
      'placa de circulación del vehículo, tablero, asiento, puerta, rueda, motor, vista exterior',
    ejemplosIncorrectos:
      'foto de la placa de circulación, tablero, asiento, puerta, llanta',
  },
  interior: {
    esperado:
      'Interior del vehículo: cinturones, airbags, alarma o elementos de seguridad visibles',
    rechaza: 'exterior del auto, placa, serial, tablero con odómetro como único foco, repuesto',
    ejemplosIncorrectos: 'foto exterior, placa, impronta, caucho de repuesto',
  },
  dashboard: {
    esperado: 'Tablero de instrumentos con odómetro/kilometraje legible',
    rechaza: 'solo asiento, solo puerta, exterior, placa, serial, maletero con repuesto',
    ejemplosIncorrectos: 'foto de un asiento, puerta externa, placa, serial',
  },
  trunk: {
    esperado:
      'Compartimento de herramientas/repuesto: caucho de auxilio, gato, llave de rueda, triángulo',
    rechaza: 'puerta externa, lateral del carro, tablero, asiento, motor, placa, serial',
    ejemplosIncorrectos: 'foto de una puerta, tablero, asiento, vista lateral exterior',
  },
  damages: {
    esperado: 'Primer plano de un daño visible en el vehículo (rayón, abolladura, rotura)',
    rechaza: 'foto genérica del exterior sin daño señalado, interior sin daño, documentos',
    ejemplosIncorrectos: 'foto panorámica sin daño visible, tablero, placa',
  },
  roof: {
    esperado:
      'Vista del techo del vehículo desde ángulo elevado o superior (sin exigir placa ni emblemas)',
    rechaza: 'interior, tablero, serial, solo puerta o rueda, placa de circulación en primer plano',
    ejemplosIncorrectos: 'foto del tablero, interior, impronta, placa de circulación',
  },
};

function normalizeToken(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function buildContentValidationBlock(ctx: SequenceContentContext): string {
  const zone = ctx.diagramZone || 'front';
  const hints = ZONE_HINTS[zone] || ZONE_HINTS.front;
  const desc = ctx.descripcion ? ` — ${ctx.descripcion}` : '';

  return `PASO 0 — VALIDACIÓN DE CONTENIDO DE LA FOTO (obligatorio, evalúa PRIMERO):
Secuencia solicitada: "${ctx.nombre}"${desc}
Elementos/piezas esperados: ${ctx.piezas.join(', ')}

¿La imagen muestra REALMENTE lo pedido en esta secuencia?
- Esperado: ${hints.esperado}
- NO es válida si muestra: ${hints.rechaza}
- Ejemplos de fotos INCORRECTAS para esta secuencia: ${hints.ejemplosIncorrectos}

En validacionContenido:
- esCorrecta=true SOLO si la foto corresponde claramente a esta secuencia.
- esCorrecta=false si es otra zona o elemento (ej: subir placa cuando piden serial, asiento cuando piden tablero, puerta cuando piden caucho de repuesto).
- En secuencias de techo (roof): NO rechaces por ausencia de placa, emblemas o insignias de marca/modelo; normalmente no son visibles desde arriba.
- elementoDetectado: describe brevemente qué se ve realmente en la foto.
- motivo: explica por qué sí o no corresponde (máx. 120 caracteres).`;
}

export function enforceContentValidation(
  validacion: ValidacionContenido | undefined,
  ctx: SequenceContentContext,
): ValidacionContenido {
  const out: ValidacionContenido = { ...(validacion ?? {}) };
  const hints = ZONE_HINTS[ctx.diagramZone || 'front'] || ZONE_HINTS.front;

  const elemento = normalizeToken(out.elementoDetectado);
  const confianza = out.confianza ?? 0.5;

  if (ctx.diagramZone === 'serial' && elemento) {
    const parecePlacaCirculacion =
      (elemento.includes('placa') || elemento.includes('matricula')) &&
      !elemento.includes('vin') &&
      !elemento.includes('serial') &&
      !elemento.includes('impronta') &&
      !elemento.includes('chasis');
    if (parecePlacaCirculacion) {
      out.esCorrecta = false;
      out.confianza = Math.max(confianza, 0.9);
      out.motivo =
        'La imagen parece ser una placa de circulación, no el serial/impronta de carrocería.';
      return out;
    }
  }

  if (out.esCorrecta === false) {
    out.motivo =
      out.motivo ||
      `La foto no corresponde a "${ctx.nombre}". Se esperaba: ${hints.esperado}.`;
    return out;
  }

  if (out.esCorrecta !== true || confianza < 0.7) {
    out.esCorrecta = false;
    out.motivo =
      out.motivo ||
      `No se pudo confirmar que la foto sea de "${ctx.nombre}". ${hints.esperado}.`;
    if (confianza < 0.55) {
      out.motivo =
        out.motivo +
        ' Toma una foto más clara enfocada en lo solicitado.';
    }
    return out;
  }

  return out;
}

export function shouldSkipVehicleIdentity(diagramZone?: string): boolean {
  return diagramZone ? SKIP_VEHICLE_IDENTITY_ZONES.has(diagramZone) : false;
}
