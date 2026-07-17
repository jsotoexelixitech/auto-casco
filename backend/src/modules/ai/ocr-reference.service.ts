import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { GeminiPart } from './gemini.client';
import { SupportedDocType } from './prompts/document-ocr.prompt';

/** Mapeo docType API → archivo de referencia visual (solo layout, sin datos de salida). */
const REFERENCE_FILES: Record<SupportedDocType, string> = {
  cedula: 'cedula-de-identidad.png',
  certificado: 'certificado-circulacion.png',
  rif: 'rif.png',
};

const MIME_BY_EXT: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

export const OCR_REFERENCE_LAYOUT_PREAMBLE =
  'IMAGEN DE REFERENCIA — SOLO GUÍA DE ESTRUCTURA Y UBICACIÓN DE CAMPOS. ' +
  'Esta imagen muestra el formato típico del documento venezolano. ' +
  'PROHIBIDO extraer, copiar o devolver cualquier dato (nombres, números, fechas, placas, RIF) de esta referencia. ' +
  'Úsala únicamente para identificar dónde están los campos en el documento real.';

export const OCR_USER_DOCUMENT_PREAMBLE =
  'DOCUMENTO A PROCESAR — Extrae los datos EXCLUSIVAMENTE de esta imagen. ' +
  'Si un campo no es legible, devuelve null. NUNCA uses datos de la imagen de referencia.';

@Injectable()
export class OcrReferenceService implements OnModuleInit {
  private readonly logger = new Logger(OcrReferenceService.name);
  private enabled = false;
  private docsDir = '';
  private readonly cache = new Map<SupportedDocType, GeminiPart>();

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.enabled =
      this.config.get<string>('ocr.referenceEnabled') === 'true' ||
      this.config.get<boolean>('ocr.referenceEnabled') === true;

    const dir = this.config.get<string>('ocr.referenceDocsDir') ?? './examples/docs';
    this.docsDir = resolve(process.cwd(), dir);

    if (!this.enabled) {
      this.logger.log('Referencias OCR desactivadas (OCR_REFERENCE_ENABLED≠true)');
      return;
    }

    if (!existsSync(this.docsDir)) {
      this.logger.warn(
        `Referencias OCR: directorio no encontrado (${this.docsDir}) — se omitirán`,
      );
      this.enabled = false;
      return;
    }

    let loaded = 0;
    for (const [docType, filename] of Object.entries(REFERENCE_FILES)) {
      const filePath = join(this.docsDir, filename);
      if (!existsSync(filePath)) {
        this.logger.warn(`Referencia OCR faltante: ${filename} (${docType})`);
        continue;
      }
      try {
        const part = this.loadImagePart(filePath);
        this.cache.set(docType as SupportedDocType, part);
        loaded++;
      } catch (err) {
        this.logger.warn(
          `No se pudo cargar referencia ${filename}: ${(err as Error).message}`,
        );
      }
    }

    this.logger.log(
      `Referencias OCR activas: ${loaded}/${Object.keys(REFERENCE_FILES).length} en ${this.docsDir}`,
    );
  }

  isEnabled(): boolean {
    return this.enabled && this.cache.size > 0;
  }

  /**
   * Partes Gemini previas al documento del usuario (referencia visual + instrucciones).
   * Nunca incluye datos extraíbles — solo la imagen de layout.
   */
  buildReferenceParts(docType: SupportedDocType): GeminiPart[] {
    const refImage = this.cache.get(docType);
    if (!refImage) return [];

    return [
      { text: OCR_REFERENCE_LAYOUT_PREAMBLE },
      { text: `[Referencia visual — tipo: ${docType}]` },
      refImage,
    ];
  }

  private loadImagePart(filePath: string): GeminiPart {
    const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
    const mimeType = MIME_BY_EXT[ext] ?? 'image/png';
    const data = readFileSync(filePath).toString('base64');
    return { inlineData: { mimeType, data } };
  }
}
