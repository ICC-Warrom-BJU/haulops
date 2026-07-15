-- CreateTable
CREATE TABLE "OperatorStatusType" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "warna" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorStatusType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperatorDailyStatus" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "statusTypeId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperatorDailyStatus_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OperatorStatusType_kode_key" ON "OperatorStatusType"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "OperatorDailyStatus_operatorId_tanggal_key" ON "OperatorDailyStatus"("operatorId", "tanggal");

-- AddForeignKey
ALTER TABLE "OperatorDailyStatus" ADD CONSTRAINT "OperatorDailyStatus_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperatorDailyStatus" ADD CONSTRAINT "OperatorDailyStatus_statusTypeId_fkey" FOREIGN KEY ("statusTypeId") REFERENCES "OperatorStatusType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
