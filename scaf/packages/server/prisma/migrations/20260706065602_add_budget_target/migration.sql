/*
  Warnings:

  - You are about to drop the `TargetProduksi` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TargetProduksi" DROP CONSTRAINT "TargetProduksi_branchId_fkey";

-- DropForeignKey
ALTER TABLE "TargetProduksi" DROP CONSTRAINT "TargetProduksi_materialId_fkey";

-- DropTable
DROP TABLE "TargetProduksi";

-- CreateTable
CREATE TABLE "TargetMaterialBulanan" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "targetRitase" INTEGER,
    "targetTon" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetMaterialBulanan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetBreakdownUnit" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "budgetJamPerHari" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetBreakdownUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetProduksiBranch" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "targetTon" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetProduksiBranch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetRatioBbm" (
    "id" TEXT NOT NULL,
    "tipeUnitId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "ratioLPerKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetRatioBbm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetRevenueTipeUnit" (
    "id" TEXT NOT NULL,
    "tipeUnitId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "targetRp" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetRevenueTipeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TargetMaterialBulanan_branchId_materialId_bulan_tahun_key" ON "TargetMaterialBulanan"("branchId", "materialId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetBreakdownUnit_unitId_bulan_tahun_key" ON "BudgetBreakdownUnit"("unitId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "TargetProduksiBranch_branchId_bulan_tahun_key" ON "TargetProduksiBranch"("branchId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetRatioBbm_tipeUnitId_bulan_tahun_key" ON "BudgetRatioBbm"("tipeUnitId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "TargetRevenueTipeUnit_tipeUnitId_bulan_tahun_key" ON "TargetRevenueTipeUnit"("tipeUnitId", "bulan", "tahun");

-- AddForeignKey
ALTER TABLE "TargetMaterialBulanan" ADD CONSTRAINT "TargetMaterialBulanan_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetMaterialBulanan" ADD CONSTRAINT "TargetMaterialBulanan_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetBreakdownUnit" ADD CONSTRAINT "BudgetBreakdownUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetProduksiBranch" ADD CONSTRAINT "TargetProduksiBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetRatioBbm" ADD CONSTRAINT "BudgetRatioBbm_tipeUnitId_fkey" FOREIGN KEY ("tipeUnitId") REFERENCES "TipeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetRevenueTipeUnit" ADD CONSTRAINT "TargetRevenueTipeUnit_tipeUnitId_fkey" FOREIGN KEY ("tipeUnitId") REFERENCES "TipeUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;
