-- Correlative Int IDs (autoincrement). Replaces cuid String PKs.
DROP TABLE IF EXISTS "Siniestro" CASCADE;
DROP TABLE IF EXISTS "PaymentMethod" CASCADE;
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "Inspection" CASCADE;
DROP TABLE IF EXISTS "Policy" CASCADE;
DROP TABLE IF EXISTS "Plan" CASCADE;
DROP TABLE IF EXISTS "Vehicle" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "legacyId" TEXT,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'asegurado',
    "title" TEXT,
    "avatar" TEXT,
    "color" TEXT,
    "phone" TEXT,
    "documento" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" SERIAL NOT NULL,
    "legacyId" TEXT,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "version" TEXT,
    "anio" INTEGER NOT NULL,
    "color" TEXT,
    "tipo" TEXT,
    "puestos" INTEGER,
    "serial" TEXT,
    "image" TEXT,
    "kilometraje" INTEGER,
    "ownerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" SERIAL NOT NULL,
    "legacyId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioDia" DOUBLE PRECISION NOT NULL,
    "icon" TEXT,
    "features" TEXT NOT NULL DEFAULT '[]',
    "recomendado" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" SERIAL NOT NULL,
    "legacyId" TEXT,
    "numero" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "planNombre" TEXT,
    "modalidad" TEXT NOT NULL DEFAULT 'dias',
    "diasContratados" INTEGER NOT NULL DEFAULT 0,
    "diasRestantes" INTEGER NOT NULL DEFAULT 0,
    "saldoDisponible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prima" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "coberturas" TEXT NOT NULL DEFAULT '[]',
    "urlPoliza" TEXT,
    "cnRecibo" TEXT,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "vehicleId" INTEGER NOT NULL,
    "holderId" INTEGER NOT NULL,
    "planId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Policy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" SERIAL NOT NULL,
    "legacyId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'inicial',
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "vehicleId" INTEGER NOT NULL,
    "peritoId" INTEGER,
    "ubicacion" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "fotos" TEXT NOT NULL DEFAULT '[]',
    "danios" TEXT NOT NULL DEFAULT '[]',
    "video360Url" TEXT,
    "observaciones" TEXT,
    "fechaCaptura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inspection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" SERIAL NOT NULL,
    "legacyId" TEXT,
    "policyId" INTEGER,
    "userId" INTEGER,
    "concepto" TEXT NOT NULL,
    "metodo" TEXT NOT NULL DEFAULT 'Saldo',
    "monto" DOUBLE PRECISION NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Completado',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sub" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'credit_card',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Siniestro" (
    "id" SERIAL NOT NULL,
    "legacyId" TEXT,
    "numero" TEXT NOT NULL,
    "policyId" INTEGER NOT NULL,
    "vehicleId" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'Choque Frontal',
    "severidad" TEXT NOT NULL DEFAULT 'moderado',
    "estado" TEXT NOT NULL DEFAULT 'En Análisis',
    "descripcion" TEXT,
    "lugar" TEXT,
    "hora" TEXT,
    "heridos" BOOLEAN NOT NULL DEFAULT false,
    "autoridad" BOOLEAN NOT NULL DEFAULT false,
    "monto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avance" INTEGER NOT NULL DEFAULT 10,
    "fechaEvento" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Siniestro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_legacyId_key" ON "User"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_legacyId_key" ON "Vehicle"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_placa_key" ON "Vehicle"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_serial_key" ON "Vehicle"("serial");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- CreateIndex
CREATE INDEX "Vehicle_placa_idx" ON "Vehicle"("placa");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_legacyId_key" ON "Plan"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_legacyId_key" ON "Policy"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_numero_key" ON "Policy"("numero");

-- CreateIndex
CREATE INDEX "Policy_holderId_idx" ON "Policy"("holderId");

-- CreateIndex
CREATE INDEX "Policy_vehicleId_idx" ON "Policy"("vehicleId");

-- CreateIndex
CREATE INDEX "Policy_estado_idx" ON "Policy"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_legacyId_key" ON "Inspection"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Inspection_numero_key" ON "Inspection"("numero");

-- CreateIndex
CREATE INDEX "Inspection_vehicleId_idx" ON "Inspection"("vehicleId");

-- CreateIndex
CREATE INDEX "Inspection_peritoId_idx" ON "Inspection"("peritoId");

-- CreateIndex
CREATE INDEX "Inspection_estado_idx" ON "Inspection"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_legacyId_key" ON "Payment"("legacyId");

-- CreateIndex
CREATE INDEX "Payment_policyId_idx" ON "Payment"("policyId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_estado_idx" ON "Payment"("estado");

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Siniestro_legacyId_key" ON "Siniestro"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Siniestro_numero_key" ON "Siniestro"("numero");

-- CreateIndex
CREATE INDEX "Siniestro_policyId_idx" ON "Siniestro"("policyId");

-- CreateIndex
CREATE INDEX "Siniestro_vehicleId_idx" ON "Siniestro"("vehicleId");

-- CreateIndex
CREATE INDEX "Siniestro_estado_idx" ON "Siniestro"("estado");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Policy" ADD CONSTRAINT "Policy_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inspection" ADD CONSTRAINT "Inspection_peritoId_fkey" FOREIGN KEY ("peritoId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siniestro" ADD CONSTRAINT "Siniestro_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siniestro" ADD CONSTRAINT "Siniestro_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

