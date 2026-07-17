import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AiService } from './ai.service';
import {
  AnalyzePhotoDto,
  ExtractDocumentDto,
  IdentifySequenceDto,
} from './dto/ai.dto';

@ApiTags('AI')
@ApiBearerAuth('JWT-auth')
@Controller('ai')
export class AiController {
  constructor(private readonly service: AiService) {}

  @Post('analyze-photo')
  @Throttle({
    default: {
      limit: Number(process.env.AI_THROTTLE_LIMIT ?? 20),
      ttl: Number(process.env.AI_THROTTLE_TTL ?? 60) * 1000,
    },
  })
  @ApiOperation({
    summary: 'Analizar foto de vehículo con Gemini Vision',
    description:
      'Clasifica el estado de cada pieza (B/R/M/NE) según la secuencia fotográfica.',
  })
  analyzePhoto(@Body() dto: AnalyzePhotoDto) {
    return this.service.analyzePhoto(dto);
  }

  @Post('extract-document')
  @Throttle({
    default: {
      limit: Number(process.env.AI_THROTTLE_LIMIT ?? 20),
      ttl: Number(process.env.AI_THROTTLE_TTL ?? 60) * 1000,
    },
  })
  @ApiOperation({
    summary: 'OCR de documento venezolano (cédula, carnet, RIF)',
  })
  extractDocument(@Body() dto: ExtractDocumentDto) {
    return this.service.extractDocument(dto);
  }

  @Post('identify-sequence')
  @Throttle({
    default: {
      limit: Number(process.env.AI_THROTTLE_LIMIT ?? 20),
      ttl: Number(process.env.AI_THROTTLE_TTL ?? 60) * 1000,
    },
  })
  @ApiOperation({
    summary: 'Identificar zona/secuencia fotográfica de una imagen',
  })
  identifySequence(@Body() dto: IdentifySequenceDto) {
    return this.service.identifySequence(dto);
  }
}
