import {
  buildContentValidationBlock,
  SequenceContentContext,
  shouldSkipVehicleIdentity,
} from '../sequence-content';

export const DAMAGE_TYPES = {
  NONE: 'Sin daño',
  SCRATCH: 'Rayón / Raspón',
  DENT: 'Abolladura',
  CRACK: 'Grieta / Fisura',
  BROKEN: 'Pieza rota / Fractura',
  PAINT_CHIP: 'Descascarado de pintura',
  CORROSION: 'Oxidación / Corrosión',
  MISSING: 'Pieza faltante',
  GLASS: 'Cristal quebrado / Astillado',
  DEFORMED: 'Deformación estructural',
} as const;

export interface VehiculoContext {
  marca?: string;
  modelo?: string;
  anio?: string | number;
  placa?: string;
  color?: string;
  serial?: string;
}

const JSON_VALIDACION_CONTENIDO = `"validacionContenido": {
    "esCorrecta": true|false,
    "confianza": 0.0-1.0,
    "elementoDetectado": "qué se ve realmente en la foto",
    "motivo": "por qué sí o no corresponde a la secuencia (máx. 120 caracteres)"
  }`;

const JSON_PIEZAS_BLOCK = `"piezas": {
    "NOMBRE_PIEZA": {
      "estado": "B|R|M|NE",
      "tipoDano": "tipo de daño o 'Sin daño'",
      "confianza": 0.0-1.0,
      "observacion": "descripción breve máximo 80 caracteres"
    }
  }`;

const ESTADOS_BLOCK = `ESTADOS VÁLIDOS:
- B (Bueno): Sin daño visible o desgaste mínimo normal.
- R (Regular): Rayón, abolladura leve, descascarado de pintura, grieta menor. Funcional pero afectado.
- M (Malo): Fractura, deformación estructural, oxidación profunda, cristal roto. Compromete funcionalidad.
- NE (No Existe): Pieza no presente en este vehículo o no visible en esta toma.`;

export function buildAnalysisPrompt(
  piezas: string[],
  secuencia: string,
  vehiculo?: VehiculoContext,
  diagramZone?: string,
  descripcion?: string,
): string {
  const contentCtx: SequenceContentContext = {
    nombre: secuencia,
    descripcion,
    piezas,
    diagramZone,
  };
  const contentBlock = buildContentValidationBlock(contentCtx);

  const vehiculoDetalle = vehiculo
    ? [
        vehiculo.marca && `Marca: ${vehiculo.marca}`,
        vehiculo.modelo && `Modelo: ${vehiculo.modelo}`,
        vehiculo.anio != null && vehiculo.anio !== '' && `Año: ${vehiculo.anio}`,
        vehiculo.placa && `Placa: ${vehiculo.placa}`,
        vehiculo.color && `Color: ${vehiculo.color}`,
        vehiculo.serial && `Serial/VIN: ${vehiculo.serial}`,
      ]
        .filter(Boolean)
        .join('\n- ')
    : '';

  const registroBlock = vehiculoDetalle
    ? `\nDATOS DEL VEHÍCULO REGISTRADO EN ESTA INSPECCIÓN:\n- ${vehiculoDetalle}\n`
    : '';

  if (diagramZone === 'serial') {
    const serialReg = vehiculo?.serial
      ? String(vehiculo.serial).toUpperCase().replace(/[^A-Z0-9]/g, '')
      : '';

    return `Eres un sistema de IA especializado en inspección vehicular para seguros de casco automotor en Venezuela.

SECUENCIA: ${secuencia} — IMPRONTA / SERIAL DE CARROCERÍA
PIEZAS A EVALUAR: ${piezas.join(', ')}
${registroBlock}
${contentBlock}

PASO 1 — VERIFICACIÓN POR SERIAL (solo si validacionContenido.esCorrecta=true):
- Lee el serial/VIN/impronta visible. NO confundir con placa de circulación.
- Compara con el serial del carnet${serialReg ? `: ${serialReg}` : ''}.
- "mismo": serial coincide (total o parcial ≥6 caracteres).
- "otro": serial distinto al registrado.
- "incierto": serial ilegible.
- marcaDetectada, modeloDetectado, colorDetectado: usar "" (no aplican).

PASO 2 — Solo si contenido y serial son válidos, evalúa cada pieza:
${ESTADOS_BLOCK}

JSON:
{
  ${JSON_VALIDACION_CONTENIDO},
  "verificacionVehiculo": {
    "resultado": "mismo|otro|incierto",
    "confianza": 0.0-1.0,
    "motivo": "...",
    "placaDetectada": "",
    "coincidePlaca": null,
    "marcaDetectada": "",
    "modeloDetectado": "",
    "colorDetectado": "",
    "carroceriaDetectada": "",
    "serialDetectado": "serial sin espacios o vacío",
    "coincideSerial": true|false|null
  },
  ${JSON_PIEZAS_BLOCK},
  "resumenGeneral": "...",
  "alertas": [],
  "placaDetectada": "",
  "coincideModelo": true,
  "motivoNoCoincide": null
}`;
  }

  if (shouldSkipVehicleIdentity(diagramZone)) {
    return `Eres un sistema de IA especializado en inspección vehicular para seguros de casco automotor en Venezuela.

SECUENCIA: ${secuencia}
${descripcion ? `DESCRIPCIÓN: ${descripcion}\n` : ''}PIEZAS A EVALUAR: ${piezas.join(', ')}
${registroBlock}
${contentBlock}

PASO 1 — En esta secuencia NO evalúes marca/modelo/color/placa del vehículo (no suelen verse; p. ej. techo, interior, tablero).
Si validacionContenido.esCorrecta=true, usa verificacionVehiculo.resultado="mismo".
NO marques "otro" ni "incierto" por falta de placa o emblemas.

PASO 2 — Solo si el contenido es correcto, evalúa cada pieza:
${ESTADOS_BLOCK}

JSON:
{
  ${JSON_VALIDACION_CONTENIDO},
  "verificacionVehiculo": {
    "resultado": "mismo|otro|incierto",
    "confianza": 0.0-1.0,
    "motivo": "motivo si incierto",
    "placaDetectada": "",
    "coincidePlaca": null,
    "marcaDetectada": "",
    "modeloDetectado": "",
    "colorDetectado": "",
    "carroceriaDetectada": "",
    "serialDetectado": "",
    "coincideSerial": null
  },
  ${JSON_PIEZAS_BLOCK},
  "resumenGeneral": "...",
  "alertas": [],
  "placaDetectada": "",
  "coincideModelo": true,
  "motivoNoCoincide": null
}`;
  }

  const vehiculoDesc = vehiculo
    ? [vehiculo.marca, vehiculo.modelo, vehiculo.anio != null ? String(vehiculo.anio) : '']
        .filter(Boolean)
        .join(' ')
        .trim() || 'vehículo particular'
    : 'vehículo particular';

  return `Eres un sistema de IA especializado en inspección vehicular para seguros de casco automotor en Venezuela (SUDESEG).

VEHÍCULO: ${vehiculoDesc}
${registroBlock}
SECUENCIA: ${secuencia}
${descripcion ? `DESCRIPCIÓN: ${descripcion}\n` : ''}PIEZAS A EVALUAR: ${piezas.join(', ')}

${contentBlock}

PASO 1 — VERIFICACIÓN DE IDENTIDAD DEL VEHÍCULO (solo si validacionContenido.esCorrecta=true):
- "mismo": marca Y modelo compatibles con el registro; color/placa no contradicen.
- "otro": marca/modelo/color/placa incompatible.
- "incierto": no se puede confirmar identidad.

PASO 2 — Solo si contenido e identidad son válidos, evalúa cada pieza:
${ESTADOS_BLOCK}

JSON:
{
  ${JSON_VALIDACION_CONTENIDO},
  "verificacionVehiculo": {
    "resultado": "mismo|otro|incierto",
    "confianza": 0.0-1.0,
    "motivo": "...",
    "placaDetectada": "placa si visible o vacío",
    "coincidePlaca": true|false|null,
    "marcaDetectada": "marca visible o vacío",
    "modeloDetectado": "modelo visible o vacío",
    "colorDetectado": "color visible o vacío",
    "carroceriaDetectada": "sedan|hatchback|suv|pickup|otro|vacío",
    "serialDetectado": "",
    "coincideSerial": null
  },
  ${JSON_PIEZAS_BLOCK},
  "resumenGeneral": "...",
  "alertas": [],
  "placaDetectada": "",
  "coincideModelo": true,
  "motivoNoCoincide": null
}`;
}

export interface PhotoSequenceRef {
  id: string;
  nombre: string;
  descripcion: string;
}

export function buildIdentifySequencePrompt(
  sequences: PhotoSequenceRef[],
  vehiculo?: VehiculoContext,
): string {
  const vehiculoDesc = vehiculo
    ? `${vehiculo.marca || ''} ${vehiculo.modelo || ''} ${vehiculo.anio || ''}`.trim()
    : 'vehículo particular';

  const seqList = sequences
    .map(
      (s) =>
        `• ID: "${s.id}" | Zona: "${s.nombre}" | Descripción: "${s.descripcion}"`,
    )
    .join('\n');

  return `Eres un experto en inspección vehicular para seguros de auto en Venezuela.
Se te muestra una fotografía de un ${vehiculoDesc}.

ZONAS DE INSPECCIÓN DISPONIBLES:
${seqList}

TAREA: Identifica a cuál de estas zonas/secuencias pertenece la fotografía mostrada.
Analiza: ángulo de la toma, partes visibles del vehículo, perspectiva y contexto.

Responde ÚNICAMENTE en JSON válido:
{
  "id": "id_exacto_de_la_zona_que_mejor_corresponde",
  "nombre": "nombre de la zona",
  "confianza": 0.0-1.0,
  "razon": "breve explicación en español de máximo 100 caracteres"
}`;
}
