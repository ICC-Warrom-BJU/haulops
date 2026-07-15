import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import prisma from './prisma/client.js';
import {
  shiftInclude,
  computeAvailability,
  computeBreakdown,
  aggregateProduction,
  sumDelayByType,
  sumDelayAll,
  resolveBasis,
  computeDtBeroperasi,
} from './analytic-core.js';

export const analyticRouter = Router();

const dailyQuery = z.object({
  branchId: z.string().min(1),
  bulan: z.string().regex(/^\d{2}$/),
  tahun: z.coerce.number().int().min(2000).max(2100),
});

// ==================== GET /daily ====================
// Raw data harian sebulan penuh (Aktual + Target turunan) untuk satu branch.
// Belum diformat visual — ini layer komputasi yang dikonsumsi Dashboard Daily
// Report dan laporan lain.
analyticRouter.get('/daily', async (req, res) => {
  const parsed = dailyQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { branchId, bulan, tahun } = parsed.data;

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return sendNotFound(res, 'Branch tidak ditemukan.');

  const jumlahHari = new Date(tahun, Number(bulan), 0).getDate();
  const gte = `${tahun}-${bulan}-01`;
  const lte = `${tahun}-${bulan}-${String(jumlahHari).padStart(2, '0')}`;

  const [monthShifts, basisRows, delayTypes, delayBudgets] = await Promise.all([
    prisma.shift.findMany({ where: { branchId, tanggal: { gte, lte } }, include: shiftInclude }),
    prisma.basisTargetProduksi.findMany({
      where: { branchId },
      include: { tipeUnit: true, material: true },
    }),
    prisma.delayType.findMany({ where: { aktif: true }, orderBy: { urutan: 'asc' } }),
    prisma.delayBudget.findMany({ where: { bulan: `${tahun}-${bulan}` } }),
  ]);

  // Target delay harian = budget bulanan / jumlah hari (pro-rata rata lurus).
  const dailyDelayTargetByType = new Map(
    delayBudgets.map((b) => [b.delayTypeId, b.budgetMenit / jumlahHari]),
  );

  // Kombinasi (tipeUnit, material) unik yang punya basis — untuk resolusi harian.
  const combos = new Map<string, { tipeUnitId: string; materialId: string }>();
  for (const b of basisRows) {
    combos.set(`${b.tipeUnitId}::${b.materialId}`, { tipeUnitId: b.tipeUnitId, materialId: b.materialId });
  }

  const rows = Array.from({ length: jumlahHari }, (_, i) => {
    const hari = i + 1;
    const tanggal = `${tahun}-${bulan}-${String(hari).padStart(2, '0')}`;
    const dayShifts = monthShifts.filter((s) => s.tanggal === tanggal);

    // ---- Target Produksi turunan dari basis versioned yang berlaku hari itu ----
    let planTon = 0;
    let dtPlan = 0;
    const basisTerpakai: Array<{
      tipeUnitKode: string;
      materialKode: string;
      ewhPerUnitJam: number;
      jumlahUnitPlan: number;
      produktivitasTonPerJam: number;
      berlakuDari: string;
    }> = [];
    for (const combo of combos.values()) {
      const basis = resolveBasis(basisRows, combo.tipeUnitId, combo.materialId, tanggal);
      if (!basis) continue;
      planTon += basis.ewhPerUnitJam * basis.jumlahUnitPlan * basis.produktivitasTonPerJam;
      dtPlan += basis.jumlahUnitPlan;
      const withRel = basisRows.find((b) => b.id === basis.id)!;
      basisTerpakai.push({
        tipeUnitKode: withRel.tipeUnit.kode,
        materialKode: withRel.material.kode,
        ewhPerUnitJam: basis.ewhPerUnitJam,
        jumlahUnitPlan: basis.jumlahUnitPlan,
        produktivitasTonPerJam: basis.produktivitasTonPerJam,
        berlakuDari: basis.berlakuDari.toISOString().slice(0, 10),
      });
    }

    // ---- Aktual (semua turunan dari data operasional yang sudah ada) ----
    const avail = computeAvailability(dayShifts);
    const breakdown = computeBreakdown(dayShifts);
    const prod = aggregateProduction(dayShifts);
    const aktualTon = Array.from(prod.values()).reduce((sum, p) => sum + p.ton, 0);
    const dtAktual = computeDtBeroperasi(dayShifts);

    // ---- Delay per jenis + Total Standby selain BD (menit) ----
    const delays = delayTypes.map((dt) => ({
      delayTypeId: dt.id,
      kode: dt.kode,
      nama: dt.nama,
      kenaPA: dt.kenaPA,
      actualMin: sumDelayByType(dayShifts, dt.id),
      targetMin: Math.round(dailyDelayTargetByType.get(dt.id) ?? 0),
    }));
    const totalStandbyMin = {
      aktual: sumDelayAll(dayShifts),
      target: Math.round(delayBudgets.reduce((sum, b) => sum + b.budgetMenit, 0) / jumlahHari),
    };

    return {
      tanggal,
      hari,
      produksi: { planTon, aktualTon },
      dtBeroperasi: { plan: dtPlan, aktual: dtAktual },
      availability: {
        paPct: avail.paPct,
        uaPct: avail.uaPct,
        ewhJam: avail.workingMin / 60,
        jamTersediaJam: avail.scheduledMin / 60,
        breakdownJam: breakdown.hours,
      },
      delays,
      totalStandbyMin,
      basisTerpakai,
      // Sel "hari hilang data": ada Target tapi tak ada shift tercatat sama sekali.
      noData: dayShifts.length === 0 && planTon > 0,
    };
  });

  sendData(res, {
    branch: { id: branch.id, kode: branch.kode, nama: branch.nama },
    bulan,
    tahun,
    jumlahHari,
    rows,
  });
});
