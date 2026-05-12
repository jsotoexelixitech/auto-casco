# Auto Casco — Backend (NestJS)

API REST para **Auto Casco · La Mundial de Seguros**. Construido con **NestJS 10**, **Prisma ORM**, **JWT**, **Swagger** y prácticas de seguridad profesionales.

---

## Stack

| Capa              | Tecnología                                      |
| ----------------- | ----------------------------------------------- |
| Runtime           | Node.js 20+                                     |
| Framework         | NestJS 10 (TypeScript estricto)                 |
| ORM               | Prisma 5                                        |
| Base de datos     | **PostgreSQL 18** (dev y prod)                  |
| Auth              | Passport JWT + bcrypt (12 rounds)               |
| Validación        | class-validator + class-transformer             |
| Docs API          | Swagger / OpenAPI 3                             |
| Seguridad         | Helmet · CORS · Throttler · Joi env validation  |

---

## Quick start

### 1. Crear la base de datos en PostgreSQL

```sql
-- Conectado como superuser (postgres)
CREATE USER auto_casco_app WITH PASSWORD 'TU_PASSWORD_FUERTE' CREATEDB;
CREATE DATABASE auto_casco OWNER auto_casco_app ENCODING 'UTF8';
\c auto_casco
GRANT ALL ON SCHEMA public TO auto_casco_app;
```

> **Las credenciales de tu instancia local están documentadas en `backend/CREDENTIALS.md`**
> (archivo en `.gitignore`, no se sube al repo).

### 2. Instalar y arrancar

```bash
cd backend
npm install
cp .env.example .env             # ajusta DATABASE_URL con tus credenciales
npx prisma migrate dev --name init
npm run seed                     # crea usuarios demo + planes + póliza
npm run start:dev
```

Servidor en `http://localhost:3001`
- API base: `http://localhost:3001/api/v1`
- Swagger UI: **http://localhost:3001/api/docs**
- Health: `http://localhost:3001/api/v1/health`

---

## Usuarios demo (seed)

Todos comparten password: **`Demo1234!`**

| Email                              | Rol            | Nombre            |
| ---------------------------------- | -------------- | ----------------- |
| `admin@lamundial.com`              | admin          | Admin Sistema     |
| `miguel.azualde@lamundial.com`     | perito         | Miguel Azualde    |
| `joelmis.materano@exelixitech.com` | perito         | Joelmis Materano  |
| `carolina.rivas@gmail.com`         | asegurado      | Carolina Rivas    |
| `rodrigo.perez@gmail.com`          | asegurado      | Rodrigo Pérez     |

---

## Endpoints principales

### Auth (público)

| Método | Ruta              | Descripción                          |
| ------ | ----------------- | ------------------------------------ |
| POST   | `/auth/login`     | Login con email + password           |
| POST   | `/auth/register`  | Registro de nuevo asegurado          |
| GET    | `/auth/me`        | Datos del usuario autenticado        |

### Recursos (requieren JWT)

| Recurso         | Métodos                                   |
| --------------- | ----------------------------------------- |
| `/users`        | GET (admin), GET/:id, PATCH/:id, DELETE   |
| `/vehicles`     | CRUD completo (filtrado por ownership)    |
| `/policies`     | GET, GET/:id, POST, POST/:id/buy-days     |
| `/inspections`  | CRUD + POST /:id/approve (perito/admin)   |
| `/health`       | GET — público                             |

Toda llamada autenticada requiere header:
```
Authorization: Bearer <accessToken>
```

---

## Formato de respuestas

**Éxito:**
```json
{
  "success": true,
  "timestamp": "2026-05-12T13:45:00.000Z",
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "statusCode": 401,
  "timestamp": "2026-05-12T13:45:00.000Z",
  "path": "/api/v1/auth/me",
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token inválido o ausente"
  }
}
```

---

## Estructura

```
src/
├── main.ts                       # Bootstrap: Helmet, CORS, Swagger
├── app.module.ts                 # Composición raíz
├── config/                       # configuration() + Joi validation
├── prisma/                       # PrismaService global
├── common/
│   ├── decorators/               # @Public, @CurrentUser, @Roles
│   ├── filters/                  # HttpExceptionFilter unificado
│   ├── guards/                   # RolesGuard
│   └── interceptors/             # TransformInterceptor
└── modules/
    ├── auth/                     # login, register, me + JwtStrategy + JwtAuthGuard
    ├── users/
    ├── vehicles/
    ├── policies/
    ├── inspections/
    └── health/
```

---

## Scripts disponibles

```bash
npm run start:dev       # nodemon con reload
npm run start           # ejecución única
npm run build           # compila a dist/
npm run start:prod      # ejecuta dist/main.js
npm run prisma:migrate  # ejecuta migraciones
npm run prisma:studio   # GUI de Prisma
npm run seed            # carga datos demo
npm run db:reset        # reset total + reseed
```

---

## Seguridad — checklist activo

- [x] Passwords con bcrypt 12 rounds (configurable)
- [x] JWT con secret obligatorio (Joi falla si falta)
- [x] Validación estricta de DTOs (whitelist + forbidNonWhitelisted)
- [x] CORS restringido a orígenes específicos
- [x] Rate limiting global (120 req/min) + específico en `/auth/login` (10/min)
- [x] Helmet (CSP relajado solo para Swagger UI)
- [x] Filter global oculta stacks en errores
- [x] Guard JWT global por defecto; abrir con `@Public()`
- [x] RolesGuard para endpoints administrativos
- [x] PasswordHash nunca devuelto en respuestas

---

## Despliegue a producción

1. Provisiona PostgreSQL en tu hosting (RDS, Neon, Supabase, Railway, etc.)
2. Actualiza `DATABASE_URL` en `.env` de producción
3. **Rota `JWT_SECRET`** con un valor fuerte (`openssl rand -hex 64`)
4. Ejecuta:
   ```bash
   npm run build
   npx prisma migrate deploy   # aplica migraciones existentes
   npm run start:prod
   ```

---

## Integración con el frontend

El frontend Vite (root del repo) consume este API en `http://localhost:3001/api/v1`. Agrega al `.env` del frontend:
```
VITE_API_URL=http://localhost:3001/api/v1
```

---

© 2026 La Mundial de Seguros · MIT License
