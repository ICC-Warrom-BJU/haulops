-- CreateTable
CREATE TABLE "TargetAvailabilityBranch" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "targetPaPct" DOUBLE PRECISION NOT NULL,
    "targetUaPct" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetAvailabilityBranch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TargetAvailabilityBranch_branchId_bulan_tahun_key" ON "TargetAvailabilityBranch"("branchId", "bulan", "tahun");

-- AddForeignKey
ALTER TABLE "TargetAvailabilityBranch" ADD CONSTRAINT "TargetAvailabilityBranch_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
