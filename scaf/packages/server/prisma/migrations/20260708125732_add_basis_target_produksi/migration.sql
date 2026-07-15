-- CreateTable
CREATE TABLE "BasisTargetProduksi" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tipeUnitId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "ewhPerUnitJam" DOUBLE PRECISION NOT NULL,
    "jumlahUnitPlan" INTEGER NOT NULL,
    "produktivitasTonPerJam" DOUBLE PRECISION NOT NULL,
    "berlakuDari" TIMESTAMP(3) NOT NULL,
    "berlakuSampai" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BasisTargetProduksi_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BasisTargetProduksi" ADD CONSTRAINT "BasisTargetProduksi_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasisTargetProduksi" ADD CONSTRAINT "BasisTargetProduksi_tipeUnitId_fkey" FOREIGN KEY ("tipeUnitId") REFERENCES "TipeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BasisTargetProduksi" ADD CONSTRAINT "BasisTargetProduksi_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
