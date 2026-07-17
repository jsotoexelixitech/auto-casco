import { SupportedDocType } from './prompts/document-ocr.prompt';

export const OCR_ILLEGIBLE_MESSAGE =
  'El documento no es válido o es poco legible. Verifica que sea el documento correcto, ' +
  'con buena iluminación y sin reflejos, e intenta cargarlo nuevamente.';

const DOC_TYPE_LABELS: Record<SupportedDocType, string> = {
  cedula: 'cédula de identidad',
  certificado: 'carnet de circulación',
  rif: 'RIF',
};

const EXPECTED_DOCUMENTO_TIPO: Record<SupportedDocType, string[]> = {
  cedula: ['cedula'],
  certificado: ['certificado'],
  rif: ['rif'],
};

const MEANINGFUL_FIELDS: Record<SupportedDocType, string[]> = {
  cedula: ['nombre', 'apellido', 'identificacion', 'fechaNacimiento', 'sexo', 'estadoCivil'],
  certificado: ['placa', 'marca', 'modelo', 'anio', 'serial', 'color', 'tipo', 'puestos'],
  rif: ['rif', 'razonSocial'],
};

function isEmpty(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === 'string') {
    const t = value.trim().toLowerCase();
    return t === '' || t === 'null' || t === 'undefined' || t === 'n/a';
  }
  return false;
}

function countFilled(data: Record<string, unknown>, fields: string[]): number {
  return fields.filter((f) => !isEmpty(data[f])).length;
}

export interface OcrValidationResult {
  valid: boolean;
  message?: string;
}

export function validateOcrResult(
  docType: SupportedDocType,
  data: Record<string, unknown>,
): OcrValidationResult {
  const documentoTipo = String(data.documentoTipo ?? '')
    .trim()
    .toLowerCase();

  if (!documentoTipo || documentoTipo === 'desconocido') {
    return { valid: false, message: OCR_ILLEGIBLE_MESSAGE };
  }

  const expected = EXPECTED_DOCUMENTO_TIPO[docType];
  if (!expected.includes(documentoTipo)) {
    return {
      valid: false,
      message:
        `El archivo no corresponde a un ${DOC_TYPE_LABELS[docType]}. ` +
        'Carga el documento correcto o intenta con una foto más clara.',
    };
  }

  const filled = countFilled(data, MEANINGFUL_FIELDS[docType]);

  if (filled === 0) {
    return { valid: false, message: OCR_ILLEGIBLE_MESSAGE };
  }

  if (docType === 'cedula') {
    const hasId = !isEmpty(data.identificacion);
    const hasFullName =
      !isEmpty(data.nombre) && !isEmpty(data.apellido);
    if (!hasId && !hasFullName) {
      return { valid: false, message: OCR_ILLEGIBLE_MESSAGE };
    }
    if (!hasId && filled < 2) {
      return { valid: false, message: OCR_ILLEGIBLE_MESSAGE };
    }
  }

  if (docType === 'rif') {
    const hasRif = !isEmpty(data.rif);
    const hasRazon = !isEmpty(data.razonSocial);
    if (!hasRif && !hasRazon) {
      return { valid: false, message: OCR_ILLEGIBLE_MESSAGE };
    }
    if (hasRif && String(data.rif).replace(/\D/g, '').length < 9) {
      return { valid: false, message: OCR_ILLEGIBLE_MESSAGE };
    }
  }

  if (docType === 'certificado') {
    const critical = ['placa', 'marca', 'modelo', 'serial'];
    const criticalFilled = countFilled(data, critical);
    if (criticalFilled < 2) {
      return { valid: false, message: OCR_ILLEGIBLE_MESSAGE };
    }
  }

  return { valid: true };
}
