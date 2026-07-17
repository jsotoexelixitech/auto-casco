const Type = {
  STRING: 'STRING',
  OBJECT: 'OBJECT',
} as const;

const DOC_TYPE_PROP = {
  type: Type.STRING,
  enum: ['cedula', 'licencia', 'certificado', 'rif', 'desconocido'],
  description:
    'Tipo de documento DETECTADO en la imagen. ' +
    'Devuelve "cedula" si ves "CEDULA DE IDENTIDAD". ' +
    'Devuelve "licencia" si dice "Licencia para Conducir" (INTT). ' +
    'Devuelve "certificado" si dice "CERTIFICADO DE CIRCULACION" o "TITULO DE PROPIEDAD" (INTT). ' +
    'Devuelve "rif" si dice "REGISTRO UNICO DE INFORMACION FISCAL" (SENIAT). ' +
    'Devuelve "desconocido" si no es ninguno.',
};

export const DOCUMENT_OCR_SCHEMAS: Record<string, object> = {
  cedula: {
    type: Type.OBJECT,
    properties: {
      documentoTipo: DOC_TYPE_PROP,
      nombre: { type: Type.STRING, description: 'Primer nombre del titular' },
      apellido: { type: Type.STRING, description: 'Primer apellido del titular' },
      identificacion: {
        type: Type.STRING,
        description: 'Numero de cedula sin letra ni guion: solo 7 u 8 digitos',
      },
      tipoDoc: {
        type: Type.STRING,
        enum: ['V', 'E', 'P'],
        description: 'V=venezolano, E=extranjero, P=pasaporte',
      },
      fechaNacimiento: {
        type: Type.STRING,
        description: 'Fecha de nacimiento en formato YYYY-MM-DD',
      },
      sexo: {
        type: Type.STRING,
        enum: ['Masculino', 'Femenino'],
      },
      estadoCivil: {
        type: Type.STRING,
        enum: ['Soltero(a)', 'Casado(a)', 'Divorciado(a)', 'Viudo(a)'],
      },
    },
    required: ['documentoTipo'],
  },
  certificado: {
    type: Type.OBJECT,
    properties: {
      documentoTipo: DOC_TYPE_PROP,
      placa: {
        type: Type.STRING,
        description: 'Placa del vehiculo, sin espacios ni guiones',
      },
      marca: { type: Type.STRING, description: 'Marca o fabricante del vehiculo' },
      modelo: {
        type: Type.STRING,
        description: 'Codigo completo del modelo',
      },
      anio: {
        type: Type.STRING,
        description: 'Año del vehiculo en 4 digitos',
      },
      serial: {
        type: Type.STRING,
        description: 'Serial de carroceria (VIN)',
      },
      color: {
        type: Type.STRING,
        description: 'Color principal de la carroceria capitalizado',
      },
      tipo: {
        type: Type.STRING,
        description: 'Tipo de vehículo (ej. AUTOMOVIL, CAMIONETA, RUSTICO)',
      },
      puestos: {
        type: Type.STRING,
        description: 'Número de puestos (ej. 5)',
      },
    },
    required: ['documentoTipo'],
  },
  rif: {
    type: Type.OBJECT,
    properties: {
      documentoTipo: DOC_TYPE_PROP,
      rif: {
        type: Type.STRING,
        description: 'RIF canonico J-12345678-9 (8 digitos + guion + 1 digito verificador)',
      },
      razonSocial: {
        type: Type.STRING,
        description: 'Razon social o nombre completo del contribuyente',
      },
    },
    required: ['documentoTipo'],
  },
};

const VALIDATION_PREAMBLE =
  'PASO 1 (OBLIGATORIO): Identifica el HEADER del documento y devuelve documentoTipo. ' +
  'PASO 2: Si y SOLO SI documentoTipo coincide con el tipo solicitado, extrae los demas campos. ' +
  'NUNCA inventes datos. ';

export const DOCUMENT_OCR_PROMPTS: Record<string, string> = {
  cedula:
    VALIDATION_PREAMBLE +
    'Tipo solicitado: CEDULA DE IDENTIDAD VENEZOLANA. ' +
    'Si la persona aparece como "VENEZOLANO" usa tipoDoc="V"; si dice "EXTRANJERO" usa "E". ' +
    'Para estadoCivil: la cedula muestra una letra (S, C, D, V); ' +
    'mapea S->"Soltero(a)", C->"Casado(a)", D->"Divorciado(a)", V->"Viudo(a)".',
  certificado:
    VALIDATION_PREAMBLE +
    'Tipo solicitado: CERTIFICADO DE CIRCULACION (RUST) o TITULO DE PROPIEDAD del vehiculo (INTT). ' +
    'La placa debe ir sin espacios ni guiones. ' +
    'ANO DEL VEHICULO: lee el ano desde la esquina INFERIOR DERECHA (ej. "2025/2025"). ' +
    'MODELO: lee el codigo de modelo (ej. "BR200-2 / 22"). Devuelve el codigo COMPLETO sin el sufijo de año.',
  rif:
    VALIDATION_PREAMBLE +
    'Tipo solicitado: REGISTRO UNICO DE INFORMACION FISCAL (RIF) venezolano. ' +
    'Mantiene el formato canonico con guiones (ej. J-12345678-9).',
};

export const DOCUMENT_OCR_SYSTEM_INSTRUCTION =
  'Eres un extractor OCR estricto de documentos venezolanos oficiales. ' +
  'Devuelve EXCLUSIVAMENTE un JSON con los campos pedidos. Si un campo no es legible, usa null. ' +
  'Cuando se proporcione una imagen de REFERENCIA, úsala solo para entender la estructura y ubicación de los campos. ' +
  'NUNCA copies datos de la referencia: nombres, cédulas, placas, RIF, fechas ni ningún valor visible en ella. ' +
  'Todos los datos del JSON deben provenir ÚNICAMENTE de la imagen del documento del usuario.';

export type SupportedDocType = 'cedula' | 'certificado' | 'rif';

export function isSupportedDocType(docType: string): docType is SupportedDocType {
  return docType in DOCUMENT_OCR_SCHEMAS;
}
