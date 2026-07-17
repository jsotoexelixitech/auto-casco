import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiClient } from './gemini.client';
import { OcrReferenceService } from './ocr-reference.service';

@Module({
  controllers: [AiController],
  providers: [AiService, GeminiClient, OcrReferenceService],
  exports: [AiService],
})
export class AiModule {}
