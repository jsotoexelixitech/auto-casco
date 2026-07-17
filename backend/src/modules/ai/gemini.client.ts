import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GeminiPart {
  text?: string;
  inlineData?: { mimeType: string; data: string };
  fileData?: { mimeType: string; fileUri: string };
}

interface GeminiError extends Error {
  status?: number;
}

@Injectable()
export class GeminiClient {
  private readonly logger = new Logger(GeminiClient.name);
  private readonly apiKey: string;
  private readonly model: string;
  private readonly modelPro: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('gemini.apiKey') ?? '';
    this.model = this.config.get<string>('gemini.model') ?? 'gemini-2.5-flash';
    this.modelPro =
      this.config.get<string>('gemini.modelPro') ?? 'gemini-2.5-pro';
  }

  hasApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  imagePart(imageData: string): GeminiPart {
    if (imageData.startsWith('data:')) {
      return {
        inlineData: {
          mimeType: imageData.split(';')[0].split(':')[1],
          data: imageData.split(',')[1],
        },
      };
    }
    return { fileData: { mimeType: 'image/jpeg', fileUri: imageData } };
  }

  extractJson(text: string): Record<string, unknown> {
    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      // continue
    }

    const block = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (block) {
      try {
        return JSON.parse(block[1].trim()) as Record<string, unknown>;
      } catch {
        // continue
      }
    }

    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1)) as Record<string, unknown>;
      } catch {
        // continue
      }
    }

    throw new Error(`JSON no encontrado en respuesta: ${text.slice(0, 120)}`);
  }

  private async postOnce(
    parts: GeminiPart[],
    generationConfig: Record<string, unknown> = {},
    usePro = false,
  ): Promise<Record<string, unknown>> {
    const modelName = usePro ? this.modelPro : this.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.1,
          topP: 0.85,
          maxOutputTokens: 8192,
          ...generationConfig,
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE',
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const msg = err?.error?.message || 'Error desconocido';
      const e = new Error(`Gemini ${response.status}: ${msg}`) as GeminiError;
      e.status = response.status;
      throw e;
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string; thought?: boolean }> };
      }>;
    };
    const allParts = data?.candidates?.[0]?.content?.parts ?? [];
    const textPart =
      allParts.find((p) => p.text && !p.thought) ??
      allParts.find((p) => p.text);
    const text = textPart?.text;
    if (!text) throw new Error('Gemini no devolvió contenido');
    return this.extractJson(text);
  }

  async generateContent(
    parts: GeminiPart[],
    generationConfig: Record<string, unknown> = {},
    preferPro = false,
  ): Promise<Record<string, unknown>> {
    const models = preferPro ? [true, false] : [false];

    let lastErr: GeminiError | undefined;
    for (const usePro of models) {
      // Pro saturado (503/429): no insistir; pasar ya a Flash.
      const maxAttempts = usePro ? 1 : 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await this.postOnce(parts, generationConfig, usePro);
        } catch (err) {
          lastErr = err as GeminiError;
          const isTransient = lastErr.status === 503 || lastErr.status === 429;

          if (usePro && preferPro) {
            this.logger.warn(
              `Pro no disponible (${lastErr.status ?? 'error'}): ${lastErr.message} — usando Flash…`,
            );
            break;
          }

          if (isTransient && attempt < maxAttempts) {
            this.logger.warn(
              `${lastErr.message} — reintentando en 3s (Flash)…`,
            );
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          break;
        }
      }
    }
    throw lastErr ?? new Error('Error desconocido en Gemini');
  }

  async generateStructuredJson(
    parts: GeminiPart[],
    responseSchema: object,
    systemInstruction?: string,
    preferPro = true,
  ): Promise<Record<string, unknown>> {
    const models = preferPro ? [true, false] : [false];

    let lastErr: GeminiError | undefined;
    for (const usePro of models) {
      // Pro saturado (503/429): un solo intento y fallback inmediato a Flash.
      const maxAttempts = usePro ? 1 : 2;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await this.postStructuredOnce(
            parts,
            responseSchema,
            systemInstruction,
            usePro,
          );
        } catch (err) {
          lastErr = err as GeminiError;
          const isTransient = lastErr.status === 503 || lastErr.status === 429;

          if (usePro && preferPro) {
            this.logger.warn(
              `Pro no disponible (${lastErr.status ?? 'error'}): ${lastErr.message} — usando Flash…`,
            );
            break;
          }

          if (isTransient && attempt < maxAttempts) {
            this.logger.warn(
              `${lastErr.message} — reintentando en 3s (Flash)…`,
            );
            await new Promise((r) => setTimeout(r, 3000));
            continue;
          }
          break;
        }
      }
    }
    throw lastErr ?? new Error('Error desconocido en Gemini');
  }

  private async postStructuredOnce(
    parts: GeminiPart[],
    responseSchema: object,
    systemInstruction: string | undefined,
    usePro = false,
  ): Promise<Record<string, unknown>> {
    const modelName = usePro ? this.modelPro : this.model;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`;

    const payload: Record<string, unknown> = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema,
      },
    };

    if (systemInstruction) {
      payload.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const err = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      const msg = err?.error?.message || response.statusText;
      const e = new Error(`Gemini ${response.status}: ${msg}`) as GeminiError;
      e.status = response.status;
      throw e;
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('Gemini no devolvió texto');

    try {
      return JSON.parse(text) as Record<string, unknown>;
    } catch {
      throw new Error('La respuesta de Gemini no es un JSON válido');
    }
  }
}
