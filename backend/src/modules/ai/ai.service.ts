import {
  BadRequestException,
  HttpException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiClient, GeminiPart } from './gemini.client';
import {
  AnalyzePhotoDto,
  ExtractDocumentDto,
  IdentifySequenceDto,
} from './dto/ai.dto';
import {
  DOCUMENT_OCR_PROMPTS,
  DOCUMENT_OCR_SCHEMAS,
  DOCUMENT_OCR_SYSTEM_INSTRUCTION,
  isSupportedDocType,
  SupportedDocType,
} from './prompts/document-ocr.prompt';
import {
  OCR_USER_DOCUMENT_PREAMBLE,
  OcrReferenceService,
} from './ocr-reference.service';
import {
  OCR_ILLEGIBLE_MESSAGE,
  validateOcrResult,
} from './ocr-result.validator';
import {
  buildAnalysisPrompt,
  buildIdentifySequencePrompt,
  DAMAGE_TYPES,
  VehiculoContext,
} from './prompts/vehicle-analysis.prompt';
import {
  buildVehicleAnalysisSchema,
  VEHICLE_ANALYSIS_SYSTEM,
} from './prompts/vehicle-analysis.schema';
import {
  enforceContentValidation,
  SequenceContentContext,
} from './sequence-content';
import {
  buildVehicleFingerprint,
  enforceVehicleVerification,
  softIgnorePlateStep1Mismatch,
} from './vehicle-verification';
import {
  isDemoImage,
  simulateVehicleAnalysis,
  VehicleAnalysisResult,
} from './simulate-analysis';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly isProduction: boolean;

  constructor(
    private readonly gemini: GeminiClient,
    private readonly config: ConfigService,
    private readonly ocrReference: OcrReferenceService,
  ) {
    this.isProduction = this.config.get<string>('env') === 'production';
  }

  async analyzePhoto(dto: AnalyzePhotoDto): Promise<VehicleAnalysisResult> {
    const { imageData, piezas, secuencia, secuenciaDescripcion, diagramZone, vehiculo } = dto;

    const contentCtx: SequenceContentContext = {
      nombre: secuencia,
      descripcion: secuenciaDescripcion,
      piezas,
      diagramZone,
    };

    if (isDemoImage(imageData) || !this.gemini.hasApiKey()) {
      if (this.isProduction && !this.gemini.hasApiKey()) {
        throw new ServiceUnavailableException(
          'Servicio de IA no configurado (GEMINI_API_KEY)',
        );
      }
      await this.simulateDelay();
      return simulateVehicleAnalysis(piezas, diagramZone, contentCtx);
    }

    try {
      const vehiculoCtx = this.pickVehiculo(vehiculo);
      const prompt = buildAnalysisPrompt(
        piezas,
        secuencia,
        vehiculoCtx,
        diagramZone,
        secuenciaDescripcion,
      );
      const schema = buildVehicleAnalysisSchema(piezas, diagramZone);
      const raw = await this.gemini.generateStructuredJson(
        [{ text: prompt }, this.gemini.imagePart(imageData)],
        schema,
        VEHICLE_ANALYSIS_SYSTEM,
        true,
      );

      const result = raw as unknown as VehicleAnalysisResult;
      if (!result.piezas) result.piezas = {};

      this.normalizeAnalysisResult(result, vehiculoCtx, diagramZone, contentCtx);

      for (const pieza of piezas) {
        if (!result.piezas[pieza]) {
          result.piezas[pieza] = {
            estado: 'B',
            tipoDano: DAMAGE_TYPES.NONE,
            confianza: 0.7,
            observacion: 'No detectado claramente',
          };
        }
      }

      return result;
    } catch (err) {
      this.logger.error('analyzePhoto failed', (err as Error).message);
      throw new ServiceUnavailableException(
        (err as Error).message || 'Error en análisis IA',
      );
    }
  }

  async extractDocument(
    dto: ExtractDocumentDto,
  ): Promise<Record<string, unknown>> {
    const { imageData, docType } = dto;

    if (!isSupportedDocType(docType)) {
      throw new BadRequestException(
        `Tipo de documento no soportado: ${docType}`,
      );
    }

    if (!this.gemini.hasApiKey()) {
      throw new ServiceUnavailableException(
        'Servicio de IA no configurado (GEMINI_API_KEY)',
      );
    }

    try {
      const parts = this.buildOcrParts(docType, imageData);

      if (this.ocrReference.isEnabled()) {
        this.logger.debug(`OCR con referencia visual de layout (${docType})`);
      }

      const result = await this.gemini.generateStructuredJson(
        parts,
        DOCUMENT_OCR_SCHEMAS[docType],
        DOCUMENT_OCR_SYSTEM_INSTRUCTION,
        true,
      );

      const validation = validateOcrResult(docType, result);
      if (!validation.valid) {
        throw new BadRequestException(
          validation.message ?? OCR_ILLEGIBLE_MESSAGE,
        );
      }

      return result;
    } catch (err) {
      if (err instanceof HttpException) {
        throw err;
      }
      this.logger.error('extractDocument failed', (err as Error).message);
      throw new ServiceUnavailableException(
        (err as Error).message || 'Error en OCR de documento',
      );
    }
  }

  async identifySequence(
    dto: IdentifySequenceDto,
  ): Promise<{
    id: string;
    nombre: string;
    confianza: number;
    razon: string;
  } | null> {
    const { imageData, sequences, vehiculo } = dto;

    if (isDemoImage(imageData) || !this.gemini.hasApiKey()) {
      return null;
    }

    const prompt = buildIdentifySequencePrompt(sequences, this.pickVehiculo(vehiculo));

    try {
      const result = await this.gemini.generateContent(
        [{ text: prompt }, this.gemini.imagePart(imageData)],
        { temperature: 0.05, maxOutputTokens: 300 },
        false,
      );

      const id = result.id as string;
      const valid = sequences.find((s) => s.id === id);
      if (!valid) return null;

      return {
        id,
        nombre: (result.nombre as string) || valid.nombre,
        confianza: (result.confianza as number) ?? 0.7,
        razon: (result.razon as string) || '',
      };
    } catch (err) {
      this.logger.warn('identifySequence failed', (err as Error).message);
      return null;
    }
  }

  private buildOcrParts(
    docType: SupportedDocType,
    imageData: string,
  ): GeminiPart[] {
    const referenceParts = this.ocrReference.buildReferenceParts(docType);

    return [
      ...referenceParts,
      { text: DOCUMENT_OCR_PROMPTS[docType] },
      { text: OCR_USER_DOCUMENT_PREAMBLE },
      this.gemini.imagePart(imageData),
    ];
  }

  private pickVehiculo(
    vehiculo?: Record<string, unknown>,
  ): VehiculoContext | undefined {
    if (!vehiculo) return undefined;
    const str = (key: string) =>
      vehiculo[key] != null && vehiculo[key] !== ''
        ? String(vehiculo[key])
        : undefined;
    const marca = str('marca');
    const modelo = str('modelo');
    const anio = str('anio');
    const placa = str('placa');
    const color = str('color');
    const serial = str('serial');
    if (!marca && !modelo && !anio && !placa && !color && !serial) {
      return undefined;
    }
    return { marca, modelo, anio, placa, color, serial };
  }

  private normalizeAnalysisResult(
    result: VehicleAnalysisResult,
    vehiculoCtx: VehiculoContext | undefined,
    diagramZone: string,
    contentCtx: SequenceContentContext,
  ): void {
    const content = enforceContentValidation(result.validacionContenido, contentCtx);
    result.validacionContenido = {
      esCorrecta: content.esCorrecta ?? false,
      confianza: content.confianza ?? 0.4,
      elementoDetectado: content.elementoDetectado ?? '',
      motivo: content.motivo ?? 'Validación de contenido incompleta',
    };

    this.normalizeVehicleVerification(result, vehiculoCtx, diagramZone, contentCtx);
  }

  private normalizeVehicleVerification(
    result: VehicleAnalysisResult,
    vehiculoCtx?: VehiculoContext,
    diagramZone?: string,
    contentCtx?: SequenceContentContext,
  ): void {
    if (result.validacionContenido?.esCorrecta === false) {
      result.verificacionVehiculo = {
        resultado: 'otro',
        confianza: 0.95,
        motivo: result.validacionContenido.motivo || 'Contenido de foto incorrecto',
        placaDetectada: null,
        coincidePlaca: null,
        marcaDetectada: null,
        modeloDetectado: null,
        colorDetectado: null,
        carroceriaDetectada: null,
        serialDetectado: null,
        coincideSerial: null,
      };
      result.coincideModelo = false;
      result.motivoNoCoincide = result.validacionContenido.motivo || null;
      return;
    }

    const ver = softIgnorePlateStep1Mismatch(
      enforceVehicleVerification(
        result.verificacionVehiculo,
        vehiculoCtx,
        diagramZone,
      ),
    );
    result.verificacionVehiculo = {
      resultado: ver.resultado ?? 'incierto',
      confianza: ver.confianza ?? 0.4,
      motivo: ver.motivo ?? 'Verificación incompleta',
      placaDetectada: ver.placaDetectada ?? null,
      coincidePlaca: ver.coincidePlaca ?? null,
      marcaDetectada: ver.marcaDetectada ?? null,
      modeloDetectado: ver.modeloDetectado ?? null,
      colorDetectado: ver.colorDetectado ?? null,
      carroceriaDetectada: ver.carroceriaDetectada ?? null,
      serialDetectado: ver.serialDetectado ?? null,
      coincideSerial: ver.coincideSerial ?? null,
    };

    const normalized = result.verificacionVehiculo;
    const esMismo = normalized.resultado === 'mismo';
    result.coincideModelo = esMismo;
    result.motivoNoCoincide = esMismo ? null : normalized.motivo || null;

    if (normalized.placaDetectada && !result.placaDetectada) {
      result.placaDetectada = normalized.placaDetectada;
    }

    result.vehicleFingerprint = buildVehicleFingerprint(normalized) ?? undefined;
  }

  private simulateDelay(): Promise<void> {
    const ms = 1000 + Math.random() * 600;
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
