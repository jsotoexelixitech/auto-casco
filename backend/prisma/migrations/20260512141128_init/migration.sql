-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "version" TEXT,
    "anio" INTEGER NOT NULL,
    "color" TEXT,
    "tipo" TEXT,
    "serial" TEXT,
    "image" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioDia" REAL NOT NULL,
    "icon" TEXT,
    "features" TEXT NOT NULL,
    "recomendado" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT,
    "numero" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Activa',
    "modalidad" TEXT NOT NULL DEFAULT 'dias',
    "diasContratados" INTEGER NOT NULL DEFAULT 0,
    "diasRestantes" INTEGER NOT NULL DEFAULT 0,
    "saldoDisponible" REAL NOT NULL DEFAULT 0,
    "fechaInicio" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" DATETIME,
    "vehicleId" TEXT NOT NULL,
    "holderId" TEXT NOT NULL,
    "planId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Policy_holderId_fkey" FOREIGN KEY ("holderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Policy_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Inspection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT,
    "numero" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'inicial',
    "estado" TEXT NOT NULL DEFAULT 'borrador',
    "vehicleId" TEXT NOT NULL,
    "peritoId" TEXT,
    "ubicacion" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "fotos" TEXT NOT NULL DEFAULT '[]',
    "danios" TEXT NOT NULL DEFAULT '[]',
    "video360Url" TEXT,
    "observaciones" TEXT,
    "fechaCaptura" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaAprobacion" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Inspection_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Inspection_peritoId_fkey" FOREIGN KEY ("peritoId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT,
    "policyId" TEXT,
    "concepto" TEXT NOT NULL,
    "metodo" TEXT NOT NULL DEFAULT 'Saldo',
    "monto" REAL NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'Completado',
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Payment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Siniestro" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "legacyId" TEXT,
    "numero" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'colision',
    "severidad" TEXT NOT NULL DEFAULT 'leve',
    "estado" TEXT NOT NULL DEFAULT 'Reportado',
    "descripcion" TEXT,
    "ubicacion" TEXT,
    "fechaEvento" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timeline" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Siniestro_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
CREATE INDEX "Payment_estado_idx" ON "Payment"("estado");

-- CreateIndex
CREATE UNIQUE INDEX "Siniestro_legacyId_key" ON "Siniestro"("legacyId");

-- CreateIndex
CREATE UNIQUE INDEX "Siniestro_numero_key" ON "Siniestro"("numero");

-- CreateIndex
CREATE INDEX "Siniestro_policyId_idx" ON "Siniestro"("policyId");

-- CreateIndex
CREATE INDEX "Siniestro_estado_idx" ON "Siniestro"("estado");
