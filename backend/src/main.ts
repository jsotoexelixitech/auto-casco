import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
    bodyParser: false,
  });
  const logger = new Logger('Bootstrap');
  const config = app.get(ConfigService);

  // Fotos en base64 pueden superar el límite por defecto (~100kb)
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  // ─── Security ────────────────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: false, // Swagger UI necesita inline scripts
      crossOriginEmbedderPolicy: false,
    }),
  );

  // ─── CORS ────────────────────────────────────────────────────────────
  app.enableCors({
    origin: config.get<string[]>('cors.origin'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // ─── Global path prefix + version ────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ─── Global validation pipe ──────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ─── Global filter + interceptors ────────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get(Reflector)),
    new TransformInterceptor(),
  );

  // ─── Swagger ─────────────────────────────────────────────────────────
  const swaggerPath = config.get<string>('swagger.path') ?? 'api/docs';
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auto Casco API')
    .setDescription(
      'API REST de Auto Casco · La Mundial de Seguros. ' +
        'Autenticación JWT (Bearer). Usa /auth/login con un usuario demo para obtener el token.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Autenticación y sesión')
    .addTag('Users', 'Gestión de usuarios')
    .addTag('Vehicles', 'Vehículos')
    .addTag('Policies', 'Pólizas')
    .addTag('Inspections', 'Inspecciones')
    .addTag('Payments', 'Pagos y métodos de pago')
    .addTag('Siniestros', 'Siniestros / reclamos')
    .addTag('Plans', 'Planes de cobertura')
    .addTag('AI', 'Análisis IA — fotos y OCR')
    .addTag('Health', 'Estado del servicio')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ─── Start ───────────────────────────────────────────────────────────
  const port = config.get<number>('port') ?? 3001;
  const host = process.env.HOST ?? '0.0.0.0';
  await app.listen(port, host);
  logger.log(`🚀 API listening on http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger docs at  http://localhost:${port}/${swaggerPath}`);
  if (host === '0.0.0.0') {
    logger.log(`🌐 Red local: http://<tu-ip>:${port}/api/v1`);
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Failed to start server:', err);
  process.exit(1);
});
