---
name: nestjs-backend
description: Backend NestJS para Auto Casco — arquitectura modular, Prisma + SQLite/Postgres, JWT, Swagger, validación y seguridad. Úsalo cuando se trabaje en el carpeta `backend/`, se mencionen endpoints, módulos, DTOs, guards, Prisma, migraciones, seeds, autenticación JWT o documentación Swagger del API de Auto Casco.
---

# Backend NestJS — Auto Casco de La Mundial

Arquitectura y convenciones para el API que da soporte al frontend React del proyecto Auto Casco.

## Stack obligatorio

- **NestJS 10** (TypeScript estricto)
- **Prisma ORM** — SQLite en dev, Postgres en producción (mismo schema)
- **Passport JWT** + **bcrypt** (12 rounds)
- **class-validator + class-transformer** para DTOs
- **@nestjs/swagger** — todos los endpoints documentados
- **helmet + @nestjs/throttler + CORS**
- **@nestjs/config + joi** para variables de entorno

## Estructura de carpetas

```
backend/
├── prisma/
│   ├── schema.prisma            # única fuente de verdad de modelos
│   └── seed.ts                  # usuarios demo del frontend
├── src/
│   ├── main.ts                  # bootstrap (Helmet, CORS, Swagger, pipes)
│   ├── app.module.ts            # composición raíz
│   ├── config/                  # configuration() + joi validation
│   ├── prisma/                  # PrismaService global
│   ├── common/
│   │   ├── decorators/          # @Public, @CurrentUser, @Roles
│   │   ├── filters/             # HttpExceptionFilter unificado
│   │   ├── guards/              # RolesGuard
│   │   └── interceptors/        # TransformInterceptor
│   └── modules/
│       ├── auth/                # login, register, me, refresh
│       ├── users/
│       ├── vehicles/
│       ├── policies/
│       ├── inspections/
│       └── health/
└── .env.example
```

## Reglas duras

1. **Nada de lógica en controllers.** Controllers delegan a services; services usan PrismaService.
2. **Todos los endpoints son protegidos por defecto** (guard JWT global). Marca los públicos con `@Public()`.
3. **Roles**: `admin | perito | asegurado | intermediario`. Usa `@Roles('admin', 'perito')` con `RolesGuard`.
4. **DTOs obligatorios** con `class-validator` y `@ApiProperty`. Nunca usar `any` ni el body crudo de Express.
5. **Passwords** se guardan con bcrypt (12 rounds). Nunca devolver `passwordHash`; siempre excluir en `select` de Prisma o mapear a DTO.
6. **IDs**: `cuid()` de Prisma. Mantén compatibilidad con los IDs del frontend (`u-001`, `veh-001`) usando un campo `legacyId` opcional.
7. **Respuestas exitosas** siguen el formato del `TransformInterceptor`:
   ```json
   { "success": true, "data": ..., "timestamp": "ISO" }
   ```
8. **Errores** vienen del `HttpExceptionFilter` con `success:false, error:{code, message}`.

## Cómo crear un nuevo módulo

```
nest g resource modules/<name> --no-spec
```

Luego:
- Crea DTOs en `dto/` con `@ApiProperty`
- Inyecta `PrismaService` en el service
- Documenta todos los endpoints con `@ApiTags`, `@ApiOperation`, `@ApiResponse`
- Si el recurso es público (ej. /health), añade `@Public()` al controller

## Autenticación

- **POST /auth/login** → email + password → `{ accessToken, user }`
- **POST /auth/register** → registro de asegurado (default role)
- **GET /auth/me** → datos del usuario autenticado
- **POST /auth/refresh** → renovar token (opcional)

`JwtAuthGuard` está registrado como global en `AppModule`. Solo necesitas `@Public()` para abrir endpoints.

## Variables de entorno (`.env`)

```env
NODE_ENV=development
PORT=3001
DATABASE_URL="file:./dev.db"          # SQLite local
JWT_SECRET=cambia-esto-en-prod
JWT_EXPIRES_IN=1d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
THROTTLE_TTL=60
THROTTLE_LIMIT=120
```

Todas se validan al boot con Joi (fallo rápido si falta alguna).

## Comandos esenciales

```bash
npm install
npx prisma generate             # genera el cliente tipado
npx prisma migrate dev --name init   # aplica migración
npm run seed                    # carga usuarios demo
npm run start:dev               # nodemon + swagger en /api/docs
```

## Convenciones de naming

- Archivos: `kebab-case.ts` (`auth.service.ts`, `login.dto.ts`)
- Clases: `PascalCase` (`AuthService`, `LoginDto`)
- Rutas REST en plural (`/users`, `/policies`, `/inspections`)
- Path prefix global: `api/v1` (configurado en `main.ts`)

## Seguridad — checklist por endpoint

- [ ] DTO de entrada validado (class-validator)
- [ ] DTO de salida tipado (sin `passwordHash` ni datos sensibles)
- [ ] `@ApiOperation` + `@ApiResponse` documentan códigos 200/400/401/403/404/500
- [ ] Si requiere rol específico → `@Roles(...)` + `RolesGuard`
- [ ] Si requiere ownership → validar en service contra `req.user.id`
- [ ] Errores nunca exponen stack ni queries de Prisma al cliente

## Integración con el frontend

El frontend Vite vive en el root del repo y consume el API en `http://localhost:3001/api/v1`. El campo `VITE_API_URL` en el `.env` del frontend apunta al backend. No exponer datos sensibles en respuestas; siempre devolver lo mínimo necesario para el UI.
