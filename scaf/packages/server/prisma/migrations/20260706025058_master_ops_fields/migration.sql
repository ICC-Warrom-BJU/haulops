-- AlterTable
ALTER TABLE "Operator" ADD COLUMN     "kontakDaruratHubungan" TEXT,
ADD COLUMN     "kontakDaruratNama" TEXT,
ADD COLUMN     "kontakDaruratTelepon" TEXT,
ADD COLUMN     "nid" TEXT,
ADD COLUMN     "simJenis" TEXT,
ADD COLUMN     "simMasaBerlaku" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PitStockpileDistance" (
    "id" TEXT NOT NULL,
    "pitId" TEXT NOT NULL,
    "stockpileId" TEXT NOT NULL,
    "jarakKm" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PitStockpileDistance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelayBudget" (
    "id" TEXT NOT NULL,
    "delayTypeId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "budgetMenit" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelayBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PitStockpileDistance_pitId_stockpileId_key" ON "PitStockpileDistance"("pitId", "stockpileId");

-- CreateIndex
CREATE UNIQUE INDEX "DelayBudget_delayTypeId_bulan_key" ON "DelayBudget"("delayTypeId", "bulan");

-- AddForeignKey
ALTER TABLE "PitStockpileDistance" ADD CONSTRAINT "PitStockpileDistance_pitId_fkey" FOREIGN KEY ("pitId") REFERENCES "LokasiPit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PitStockpileDistance" ADD CONSTRAINT "PitStockpileDistance_stockpileId_fkey" FOREIGN KEY ("stockpileId") REFERENCES "LokasiStockpile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelayBudget" ADD CONSTRAINT "DelayBudget_delayTypeId_fkey" FOREIGN KEY ("delayTypeId") REFERENCES "DelayType"("id") ON DELETE CASCADE ON UPDATE CASCADE;
