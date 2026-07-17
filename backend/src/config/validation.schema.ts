import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(3001),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('1d'),
  BCRYPT_ROUNDS: Joi.number().min(8).max(15).default(12),
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  THROTTLE_TTL: Joi.number().default(60),
  THROTTLE_LIMIT: Joi.number().default(120),
  SWAGGER_PATH: Joi.string().default('api/docs'),
  GEMINI_API_KEY: Joi.string().allow('').optional(),
  GEMINI_MODEL: Joi.string().default('gemini-2.5-flash'),
  GEMINI_MODEL_PRO: Joi.string().default('gemini-2.5-pro'),
  AI_THROTTLE_LIMIT: Joi.number().default(20),
  AI_THROTTLE_TTL: Joi.number().default(60),
  OCR_REFERENCE_ENABLED: Joi.string().valid('true', 'false').default('true'),
  OCR_REFERENCE_DOCS_DIR: Joi.string().default('./examples/docs'),
  NEXUS_API_URL: Joi.string().allow('').optional(),
  NEXUS_API_KEY: Joi.string().allow('').optional(),
  NEXUS_NOTIFY_URL: Joi.string().allow('').optional(),
  NEXUS_PAGOS_CANAL: Joi.string().default('27'),
});
