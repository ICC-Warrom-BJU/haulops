-- AlterTable
ALTER TABLE "BBMLog" ADD COLUMN     "fuelStationId" TEXT;

-- CreateTable
CREATE TABLE "FuelStation" (
    "id" TEXT NOT NULL,
    "kode" TEXT,
    "nama" TEXT NOT NULL,
    "branchId" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FuelStation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "FuelStation" ADD CONSTRAINT "FuelStation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BBMLog" ADD CONSTRAINT "BBMLog_fuelStationId_fkey" FOREIGN KEY ("fuelStationId") REFERENCES "FuelStation"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
