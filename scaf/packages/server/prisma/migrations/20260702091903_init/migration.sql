-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "skemaTimbangan" TEXT NOT NULL DEFAULT 'WITH_TIMBANGAN',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TipeUnit" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kapasitasTon" DOUBLE PRECISION NOT NULL,
    "budgetBreakdownJam" DOUBLE PRECISION,
    "budgetLton" DOUBLE PRECISION,
    "budgetLjam" DOUBLE PRECISION,
    "budgetKmL" DOUBLE PRECISION,
    "targetRevenue" DOUBLE PRECISION,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TipeUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Unit" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "polisi" TEXT,
    "noRangka" TEXT,
    "noMesin" TEXT,
    "tahun" INTEGER,
    "kapasitas" DOUBLE PRECISION,
    "tipeId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "budgetBreakdownJam" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "status" TEXT NOT NULL DEFAULT 'ready',
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operator" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" TEXT NOT NULL,
    "telepon" TEXT,
    "sim" TEXT,
    "tglLahir" TIMESTAMP(3),
    "tglBergabung" TIMESTAMP(3),
    "kontakDarurat" TEXT,
    "branchId" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "kategori" TEXT,
    "satuan" TEXT NOT NULL DEFAULT 'ton',
    "targetProduksiBulanan" DOUBLE PRECISION,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LokasiPit" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kodeArea" TEXT,
    "branchId" TEXT,
    "materialDominan" TEXT,
    "jarakKeROM" DOUBLE PRECISION,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LokasiPit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LokasiStockpile" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kode" TEXT,
    "branchId" TEXT,
    "kapasitasTon" DOUBLE PRECISION,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LokasiStockpile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rate" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tipeUnitId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "pitId" TEXT,
    "stockpileId" TEXT,
    "rateRpPerTon" DOUBLE PRECISION NOT NULL,
    "berlakuDari" TIMESTAMP(3) NOT NULL,
    "berlakuSampai" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NettoEstimasi" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "tipeUnitId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "nettoEstimasiTon" DOUBLE PRECISION NOT NULL,
    "faktorMuatan" DOUBLE PRECISION NOT NULL,
    "berlakuDari" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NettoEstimasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelayType" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "kategori" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'UNIT',
    "budgetMenit" INTEGER,
    "kenaPA" BOOLEAN NOT NULL DEFAULT true,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DelayType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusOperation" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "group" TEXT,
    "warna" TEXT,
    "isPA" BOOLEAN NOT NULL DEFAULT false,
    "isUA" BOOLEAN NOT NULL DEFAULT false,
    "isProd" BOOLEAN NOT NULL DEFAULT false,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusOperation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shift" (
    "id" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "jamMulai" TEXT NOT NULL,
    "jamSelesai" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "catatan" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closedAt" TIMESTAMP(3),
    "closedById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "rejectReason" TEXT,
    "ritase" INTEGER NOT NULL DEFAULT 0,
    "tonase" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftUnit" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "operatorId" TEXT,
    "material" TEXT,
    "statusAwal" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rit" (
    "id" TEXT NOT NULL,
    "noRit" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "operatorId" TEXT,
    "pitId" TEXT,
    "stockpileId" TEXT,
    "material" TEXT NOT NULL,
    "jumlahRit" INTEGER NOT NULL,
    "jarakKm" DOUBLE PRECISION,
    "grossKg" DOUBLE PRECISION,
    "tareKg" DOUBLE PRECISION,
    "nettoTon" DOUBLE PRECISION,
    "statusTimbangan" TEXT NOT NULL DEFAULT 'manual',
    "estimasiTon" DOUBLE PRECISION,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Delay" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "delayTypeId" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'UNIT',
    "unitId" TEXT,
    "jamMulai" TIMESTAMP(3) NOT NULL,
    "jamSelesai" TIMESTAMP(3),
    "durasiMenit" INTEGER NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Delay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Maintenance" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "jenis" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jamMulai" TIMESTAMP(3) NOT NULL,
    "jamSelesai" TIMESTAMP(3),
    "durasiJam" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "budgetJam" DOUBLE PRECISION NOT NULL DEFAULT 3,
    "keterangan" TEXT,
    "partDiganti" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Maintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BBMLog" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "operatorBbmId" TEXT NOT NULL,
    "jamPengisian" TIMESTAMP(3) NOT NULL,
    "lokasi" TEXT,
    "liter" DOUBLE PRECISION NOT NULL,
    "odoKm" DOUBLE PRECISION,
    "hm" DOUBLE PRECISION,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BBMLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActualStatus" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "statusOpId" TEXT NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActualStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Approval" (
    "id" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "aksi" TEXT NOT NULL,
    "catatan" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Approval_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EditRequest" (
    "id" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "recordId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "nilaiLama" TEXT NOT NULL,
    "nilaiBaru" TEXT NOT NULL,
    "alasan" TEXT NOT NULL,
    "dibuatById" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reviewedById" TEXT,
    "catatanReview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "EditRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetMaterialTarget" (
    "id" TEXT NOT NULL,
    "tipeUnitId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "targetRitase" INTEGER,
    "targetTon" DOUBLE PRECISION NOT NULL,
    "targetEWH" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetMaterialTarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetProduksi" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "targetTon" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetProduksi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TargetRevenue" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "bulan" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "targetRp" DOUBLE PRECISION NOT NULL,
    "keterangan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TargetRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operator',
    "branchId" TEXT,
    "avatarUrl" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Branch_kode_key" ON "Branch"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "TipeUnit_kode_key" ON "TipeUnit"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Unit_kode_key" ON "Unit"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Operator_nik_key" ON "Operator"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "Material_nama_key" ON "Material"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "Material_kode_key" ON "Material"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "NettoEstimasi_branchId_tipeUnitId_materialId_key" ON "NettoEstimasi"("branchId", "tipeUnitId", "materialId");

-- CreateIndex
CREATE UNIQUE INDEX "DelayType_kode_key" ON "DelayType"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "StatusOperation_kode_key" ON "StatusOperation"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftUnit_shiftId_unitId_key" ON "ShiftUnit"("shiftId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "Rit_noRit_key" ON "Rit"("noRit");

-- CreateIndex
CREATE UNIQUE INDEX "Maintenance_shiftId_unitId_key" ON "Maintenance"("shiftId", "unitId");

-- CreateIndex
CREATE UNIQUE INDEX "ActualStatus_unitId_tanggal_key" ON "ActualStatus"("unitId", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetMaterialTarget_tipeUnitId_materialId_bulan_tahun_key" ON "BudgetMaterialTarget"("tipeUnitId", "materialId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "TargetProduksi_branchId_materialId_bulan_tahun_key" ON "TargetProduksi"("branchId", "materialId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "TargetRevenue_branchId_bulan_tahun_key" ON "TargetRevenue"("branchId", "bulan", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_tipeId_fkey" FOREIGN KEY ("tipeId") REFERENCES "TipeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Unit" ADD CONSTRAINT "Unit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operator" ADD CONSTRAINT "Operator_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LokasiPit" ADD CONSTRAINT "LokasiPit_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LokasiStockpile" ADD CONSTRAINT "LokasiStockpile_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_tipeUnitId_fkey" FOREIGN KEY ("tipeUnitId") REFERENCES "TipeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rate" ADD CONSTRAINT "Rate_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettoEstimasi" ADD CONSTRAINT "NettoEstimasi_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettoEstimasi" ADD CONSTRAINT "NettoEstimasi_tipeUnitId_fkey" FOREIGN KEY ("tipeUnitId") REFERENCES "TipeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettoEstimasi" ADD CONSTRAINT "NettoEstimasi_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_closedById_fkey" FOREIGN KEY ("closedById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftUnit" ADD CONSTRAINT "ShiftUnit_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftUnit" ADD CONSTRAINT "ShiftUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftUnit" ADD CONSTRAINT "ShiftUnit_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rit" ADD CONSTRAINT "Rit_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rit" ADD CONSTRAINT "Rit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rit" ADD CONSTRAINT "Rit_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "Operator"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rit" ADD CONSTRAINT "Rit_pitId_fkey" FOREIGN KEY ("pitId") REFERENCES "LokasiPit"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rit" ADD CONSTRAINT "Rit_stockpileId_fkey" FOREIGN KEY ("stockpileId") REFERENCES "LokasiStockpile"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delay" ADD CONSTRAINT "Delay_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delay" ADD CONSTRAINT "Delay_delayTypeId_fkey" FOREIGN KEY ("delayTypeId") REFERENCES "DelayType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Delay" ADD CONSTRAINT "Delay_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Maintenance" ADD CONSTRAINT "Maintenance_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BBMLog" ADD CONSTRAINT "BBMLog_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BBMLog" ADD CONSTRAINT "BBMLog_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BBMLog" ADD CONSTRAINT "BBMLog_operatorBbmId_fkey" FOREIGN KEY ("operatorBbmId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualStatus" ADD CONSTRAINT "ActualStatus_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActualStatus" ADD CONSTRAINT "ActualStatus_statusOpId_fkey" FOREIGN KEY ("statusOpId") REFERENCES "StatusOperation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "Shift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Approval" ADD CONSTRAINT "Approval_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditRequest" ADD CONSTRAINT "EditRequest_dibuatById_fkey" FOREIGN KEY ("dibuatById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditRequest" ADD CONSTRAINT "EditRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetMaterialTarget" ADD CONSTRAINT "BudgetMaterialTarget_tipeUnitId_fkey" FOREIGN KEY ("tipeUnitId") REFERENCES "TipeUnit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetMaterialTarget" ADD CONSTRAINT "BudgetMaterialTarget_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetProduksi" ADD CONSTRAINT "TargetProduksi_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetProduksi" ADD CONSTRAINT "TargetProduksi_materialId_fkey" FOREIGN KEY ("materialId") REFERENCES "Material"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TargetRevenue" ADD CONSTRAINT "TargetRevenue_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
