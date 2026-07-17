export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  database: {
    url: process.env.DATABASE_URL!,
  },
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || 'http://localhost:5173')
      .split(',')
      .map((s) => s.trim()),
  },
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL ?? '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT ?? '120', 10),
  },
  swagger: {
    path: process.env.SWAGGER_PATH || 'api/docs',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    modelPro: process.env.GEMINI_MODEL_PRO || 'gemini-2.5-pro',
  },
  ai: {
    throttleLimit: parseInt(process.env.AI_THROTTLE_LIMIT ?? '20', 10),
    throttleTtl: parseInt(process.env.AI_THROTTLE_TTL ?? '60', 10),
  },
  ocr: {
    referenceEnabled: process.env.OCR_REFERENCE_ENABLED === 'true',
    referenceDocsDir: process.env.OCR_REFERENCE_DOCS_DIR ?? './examples/docs',
  },
  nexus: {
    apiUrl: (process.env.NEXUS_API_URL || '').replace(/\/$/, ''),
    apiKey: process.env.NEXUS_API_KEY || '',
    /** URL pública que Pagos llamará (notify). En local: túnel → Nest. */
    notifyUrl: process.env.NEXUS_NOTIFY_URL || '',
    canal: process.env.NEXUS_PAGOS_CANAL || '27',
  },
});
