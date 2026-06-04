/**
 * AI Document OCR Service — La Mundial de Seguros
 * Extrae datos de documentos oficiales venezolanos mediante Gemini Vision.
 */

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_MODEL_PRO = 'gemini-2.5-pro';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const GEMINI_API_URL_PRO = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_PRO}:generateContent`;

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// ─── Tipos ───
const Type = {
  STRING: 'STRING',
  OBJECT: 'OBJECT',
};

// ─── Prompts y Esquemas (Basados en RCV) ───
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

const SCHEMAS = {
  cedula: {
    type: Type.OBJECT,
    properties: {
      documentoTipo: DOC_TYPE_PROP,
      nombre: { type: Type.STRING, description: 'Primer nombre del titular' },
      apellido: { type: Type.STRING, description: 'Primer apellido del titular' },
      identificacion: {
        type: Type.STRING,
        description: 'Numero de cedula, solo digitos sin V- ni puntos',
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
      }
    },
    required: ['documentoTipo'],
  },

  rif: {
    type: Type.OBJECT,
    properties: {
      documentoTipo: DOC_TYPE_PROP,
      rif: {
        type: Type.STRING,
        description: 'RIF en formato J-XXXXXXXX-X o V-XXXXXXX-X',
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

const PROMPTS = {
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

const SYSTEM_INSTRUCTION =
  'Eres un extractor OCR estricto de documentos venezolanos oficiales. ' +
  'Devuelve EXCLUSIVAMENTE un JSON con los campos pedidos. Si un campo no es legible, usa null.';

/**
 * Función que convierte una imagen base64 (data:image/...) al formato de Gemini.
 */
function imagePart(imageData) {
  if (imageData.startsWith('data:')) {
    return {
      inlineData: {
        mimeType: imageData.split(';')[0].split(':')[1],
        data: imageData.split(',')[1],
      },
    };
  }
  return { inlineData: { mimeType: 'image/jpeg', data: imageData } };
}

/**
 * Llama a la API de Gemini
 */
export async function extractDocumentOcr(imageData, docType) {
  if (!API_KEY) {
    throw new Error("No hay API KEY de Gemini configurada.");
  }

  if (!SCHEMAS[docType]) {
    throw new Error(`Tipo de documento no soportado: ${docType}`);
  }

  // Usamos el modelo PRO por defecto para OCR de documentos ya que es más preciso
  const url = `${GEMINI_API_URL_PRO}?key=${API_KEY}`;
  
  const payload = {
    contents: [
      {
        parts: [
          { text: PROMPTS[docType] },
          imagePart(imageData)
        ]
      }
    ],
    systemInstruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }]
    },
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: SCHEMAS[docType]
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Error en API de Gemini: ${errorBody?.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  
  if (!text) {
    throw new Error("Gemini no devolvió texto.");
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    throw new Error("La respuesta de Gemini no es un JSON válido.");
  }
}
