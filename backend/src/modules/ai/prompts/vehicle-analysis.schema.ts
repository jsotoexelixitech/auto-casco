const Type = {
  STRING: 'STRING',
  NUMBER: 'NUMBER',
  OBJECT: 'OBJECT',
  ARRAY: 'ARRAY',
  BOOLEAN: 'BOOLEAN',
} as const;

const PIEZA_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    estado: { type: Type.STRING, enum: ['B', 'R', 'M', 'NE'] },
    tipoDano: { type: Type.STRING },
    confianza: { type: Type.NUMBER },
    observacion: { type: Type.STRING },
  },
  required: ['estado', 'tipoDano', 'confianza', 'observacion'],
};

const VALIDACION_CONTENIDO_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    esCorrecta: { type: Type.BOOLEAN },
    confianza: { type: Type.NUMBER },
    elementoDetectado: { type: Type.STRING },
    motivo: { type: Type.STRING },
  },
  required: ['esCorrecta', 'confianza', 'elementoDetectado', 'motivo'],
};

const VERIFICACION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    resultado: {
      type: Type.STRING,
      enum: ['mismo', 'otro', 'incierto'],
      description:
        'mismo=solo si coincide marca/modelo/color/placa con el registro; otro=vehículo claramente distinto; incierto=foto insuficiente',
    },
    confianza: { type: Type.NUMBER },
    motivo: { type: Type.STRING },
    placaDetectada: {
      type: Type.STRING,
      description: 'Placa visible o cadena vacía si no se ve',
    },
    coincidePlaca: { type: Type.BOOLEAN },
    marcaDetectada: {
      type: Type.STRING,
      description: 'Marca visible en la foto (ej. Toyota, Chevrolet)',
    },
    modeloDetectado: {
      type: Type.STRING,
      description: 'Modelo o línea visible (ej. Corolla, Spark)',
    },
    colorDetectado: {
      type: Type.STRING,
      description: 'Color principal de la carrocería',
    },
    carroceriaDetectada: {
      type: Type.STRING,
      description: 'sedan, hatchback, suv, pickup, coupe, van, etc.',
    },
    serialDetectado: {
      type: Type.STRING,
      description: 'Serial/VIN/impronta leído sin espacios ni guiones, o vacío',
    },
    coincideSerial: { type: Type.BOOLEAN },
  },
  required: [
    'resultado',
    'confianza',
    'motivo',
    'marcaDetectada',
    'modeloDetectado',
    'colorDetectado',
  ],
};

/**
 * Gemini no soporta additionalProperties; las piezas se declaran explícitamente.
 */
export function buildVehicleAnalysisSchema(piezas: string[], diagramZone?: string): object {
  const isSerial = diagramZone === 'serial';
  const verificacionSchema = {
    ...VERIFICACION_SCHEMA,
    required: isSerial
      ? ['resultado', 'confianza', 'motivo', 'serialDetectado']
      : VERIFICACION_SCHEMA.required,
  };
  const piezaProperties: Record<string, typeof PIEZA_SCHEMA> = {};
  for (const pieza of piezas) {
    piezaProperties[pieza] = PIEZA_SCHEMA;
  }

  return {
    type: Type.OBJECT,
    properties: {
      validacionContenido: VALIDACION_CONTENIDO_SCHEMA,
      verificacionVehiculo: verificacionSchema,
      piezas: {
        type: Type.OBJECT,
        properties: piezaProperties,
        required: piezas.length > 0 ? piezas : undefined,
      },
      resumenGeneral: { type: Type.STRING },
      alertas: { type: Type.ARRAY, items: { type: Type.STRING } },
      placaDetectada: { type: Type.STRING },
      coincideModelo: { type: Type.BOOLEAN },
      motivoNoCoincide: { type: Type.STRING },
    },
    required: ['validacionContenido', 'verificacionVehiculo', 'piezas', 'resumenGeneral', 'alertas'],
  };
}

export const VEHICLE_ANALYSIS_SYSTEM = `Eres un perito de seguros vehiculares en Venezuela.
ORDEN DE PRIORIDAD:
1) validacionContenido: la foto DEBE mostrar lo solicitado en la secuencia (serial, tablero, caucho de repuesto, vista frontal, etc.).
2) verificacionVehiculo: solo en fotos exteriores panorámicas — confirmar mismo vehículo del registro.
3) Evaluar daños en piezas solo si los pasos anteriores son válidos.
Rechaza fotos de zona incorrecta aunque sean del mismo automóvil.`;
