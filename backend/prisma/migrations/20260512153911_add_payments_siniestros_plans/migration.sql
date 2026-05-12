/*
  Warnings:

  - You are about to drop the column `timeline` on the `Siniestro` table. All the data in the column will be lost.
  - You are about to drop the column `ubicacion` on the `Siniestro` table. All the data in the column will be lost.
  - Added the required column `vehicleId` to the `Siniestro` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "Plan" ALTER COLUMN "features" SET DEFAULT '[]';

-- AlterTable
ALTER TABLE "Policy" ADD COLUMN     "coberturas" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "planNombre" TEXT,
ADD COLUMN     "prima" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Siniestro" DROP COLUMN "timeline",
DROP COLUMN "ubicacion",
ADD COLUMN     "autoridad" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "avance" INTEGER NOT NULL DEFAULT 10,
ADD COLUMN     "heridos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hora" TEXT,
ADD COLUMN     "lugar" TEXT,
ADD COLUMN     "monto" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "vehicleId" TEXT NOT NULL,
ALTER COLUMN "tipo" SET DEFAULT 'Choque Frontal',
ALTER COLUMN "severidad" SET DEFAULT 'moderado',
ALTER COLUMN "estado" SET DEFAULT 'En Análisis';

-- AlterTable
ALTER TABLE "Vehicle" ADD COLUMN     "kilometraje" INTEGER,
ADD COLUMN     "puestos" INTEGER;

-- CreateTable
CREATE TABLE "PaymentMethod" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sub" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'credit_card',
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentMethod_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentMethod_userId_idx" ON "PaymentMethod"("userId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Siniestro_vehicleId_idx" ON "Siniestro"("vehicleId");

-- AddForeignKey
ALTER TABLE "PaymentMethod" ADD CONSTRAINT "PaymentMethod_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Siniestro" ADD CONSTRAINT "Siniestro_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
