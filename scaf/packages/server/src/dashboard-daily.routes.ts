import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import prisma from './prisma/client.js';
import {
  tanggalToBulanTahun,
  tanggalToDelayBudgetBulan,
  monthStartToDate,
  proRate,
  dayOfMonth,
  delayStatus,
  targetStatus,
  worstStatus,
  type BudgetStatus,
} from './dashboard-utils.js';
import {
  shiftInclude,
  computeAvailability,
  computeBreakdown,
  sumDelayByType,
  sumDelayAll,
  aggregateProduction,
  aggregateRevenue,
  aggregateBbm,
  computeUnitRanking,
} from './analytic-core.js';

export const dashboardDailyRouter = Router();

const dailyQuery = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  branchId: z.string().min(1),
});

const compareQuery = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

function fetchShiftsForBranch(branchId: string, gte: string, lte: string) {
  return prisma.shift.findMany({
    where: { branchId, tanggal: { gte, lte } },
    include: shiftInclude,
  });
}

// ==================== GET /daily ====================
dashboardDailyRouter.get('/daily', async (req, res) => {
  const parsed = dailyQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { tanggal, branchId } = parsed.data;

  const branch = await prisma.branch.findUnique({ where: { id: branchId } });
  if (!branch) return sendNotFound(res, 'Branch tidak ditemukan.');

  const { bulan, tahun } = tanggalToBulanTahun(tanggal);
  const delayBulan = tanggalToDelayBudgetBulan(tanggal);
  const { gte, lte } = monthStartToDate(tanggal);

  const monthShifts = await fetchShiftsForBranch(branchId, gte, lte);
  const dailyShifts = monthShifts.filter((s) => s.tanggal === tanggal);

  const [
    delayTypes,
    delayBudgets,
    materials,
    tipeUnits,
    targetMaterialRows,
    budgetBreakdowns,
    targetRevenueRows,
    targetRevenueTipeRows,
    budgetRatioRows,
    rateRows,
    fleetUnits,
    targetAvailabilityRows,
  ] = await Promise.all([
    prisma.delayType.findMany({ where: { aktif: true } }),
    prisma.delayBudget.findMany({ where: { bulan: delayBulan } }),
    prisma.material.findMany(),
    prisma.tipeUnit.findMany(),
    prisma.targetMaterialBulanan.findMany({ where: { branchId, bulan, tahun } }),
    prisma.budgetBreakdownUnit.findMany({ where: { bulan, tahun } }),
    prisma.targetRevenue.findMany({ where: { branchId, bulan, tahun } }),
    prisma.targetRevenueTipeUnit.findMany({ where: { bulan, tahun } }),
    prisma.budgetRatioBbm.findMany({ where: { bulan, tahun } }),
    prisma.rate.findMany({ where: { branchId } }),
    prisma.unit.findMany({ where: { branchId, aktif: true } }),
    prisma.targetAvailabilityBranch.findMany({ where: { branchId, bulan, tahun } }),
  ]);
  const targetAvailability = targetAvailabilityRows[0] ?? null;

  const kodeToMaterialId = new Map(materials.map((m) => [m.kode, m.id]));
  const tipeUnitsById = new Map(tipeUnits.map((t) => [t.id, t]));

  // ---- PA/UA ----
  const paUaDaily = computeAvailability(dailyShifts);
  const paUaMtd = computeAvailability(monthShifts);

  // ---- Breakdown ----
  const breakdownDaily = computeBreakdown(dailyShifts);
  const breakdownMtd = computeBreakdown(monthShifts);
  const budgetByUnit = new Map(budgetBreakdowns.map((b) => [b.unitId, b.budgetJamPerHari]));
  const unitIdsThisMonth = new Set(monthShifts.flatMap((s) => s.units.map((u) => u.unitId)));
  let budgetDailyTotal = 0;
  for (const unitId of unitIdsThisMonth) budgetDailyTotal += budgetByUnit.get(unitId) ?? 0;
  const budgetMtdTotal = budgetDailyTotal * dayOfMonth(tanggal);

  // ---- Delay vs budget ----
  const budgetByType = new Map(delayBudgets.map((b) => [b.delayTypeId, b.budgetMenit]));
  const delay = delayTypes.map((dt) => {
    const mtdActual = sumDelayByType(monthShifts, dt.id);
    const dailyActual = sumDelayByType(dailyShifts, dt.id);
    const mtdTarget = budgetByType.get(dt.id) ?? 0;
    const dailyTarget = proRate(mtdTarget, tanggal);
    return {
      delayTypeId: dt.id,
      kode: dt.kode,
      nama: dt.nama,
      kenaPA: dt.kenaPA,
      daily: { actualMin: dailyActual, targetMin: Math.round(dailyTarget) },
      mtd: { actualMin: mtdActual, targetMin: mtdTarget },
      status: delayStatus(mtdActual, mtdTarget),
    };
  });

  // ---- Produksi per material ----
  const dailyProd = aggregateProduction(dailyShifts);
  const mtdProd = aggregateProduction(monthShifts);
  const targetByMaterial = new Map(targetMaterialRows.map((t) => [t.materialId, t]));
  const materialKeys = new Set([...dailyProd.keys(), ...mtdProd.keys()]);
  const production = Array.from(materialKeys).map((kodeKey) => {
    const materialId = kodeToMaterialId.get(kodeKey);
    const material = materials.find((m) => m.kode === kodeKey);
    const target = materialId ? targetByMaterial.get(materialId) : undefined;
    const mtdTargetRitase = target?.targetRitase ?? null;
    const mtdTargetTon = target?.targetTon ?? null;
    const d = dailyProd.get(kodeKey) ?? { ritase: 0, ton: 0 };
    const m = mtdProd.get(kodeKey) ?? { ritase: 0, ton: 0 };
    return {
      materialId: materialId ?? kodeKey,
      kode: kodeKey,
      nama: material?.nama ?? kodeKey,
      daily: {
        ritase: d.ritase,
        ton: d.ton,
        targetRitase: mtdTargetRitase != null ? proRate(mtdTargetRitase, tanggal) : null,
        targetTon: mtdTargetTon != null ? proRate(mtdTargetTon, tanggal) : null,
      },
      mtd: { ritase: m.ritase, ton: m.ton, targetRitase: mtdTargetRitase, targetTon: mtdTargetTon },
      status: targetStatus(m.ton, mtdTargetTon),
    };
  });

  // ---- Revenue ----
  const dailyRev = aggregateRevenue(dailyShifts, rateRows, kodeToMaterialId);
  const mtdRev = aggregateRevenue(monthShifts, rateRows, kodeToMaterialId);
  const targetRevenueMtd = targetRevenueRows[0]?.targetRp ?? 0;
  const targetRevTipeByTipe = new Map(targetRevenueTipeRows.map((t) => [t.tipeUnitId, t.targetRp]));
  const revenueTipeKeys = new Set([...dailyRev.perTipe.keys(), ...mtdRev.perTipe.keys(), ...targetRevTipeByTipe.keys()]);
  const perTipeUnit = Array.from(revenueTipeKeys).map((tipeUnitId) => {
    const mtdTarget = targetRevTipeByTipe.get(tipeUnitId) ?? 0;
    return {
      tipeUnitId,
      kode: tipeUnitsById.get(tipeUnitId)?.kode ?? tipeUnitId,
      daily: { actualRp: dailyRev.perTipe.get(tipeUnitId) ?? 0, targetRp: proRate(mtdTarget, tanggal) },
      mtd: { actualRp: mtdRev.perTipe.get(tipeUnitId) ?? 0, targetRp: mtdTarget },
    };
  });
  const revenue = {
    daily: { actualRp: dailyRev.totalRp, targetRp: proRate(targetRevenueMtd, tanggal), unpricedRitCount: dailyRev.unpriced },
    mtd: { actualRp: mtdRev.totalRp, targetRp: targetRevenueMtd, unpricedRitCount: mtdRev.unpriced },
    perTipeUnit,
    status: targetStatus(mtdRev.totalRp, targetRevenueMtd || null),
  };

  // ---- BBM ratio per tipe unit (harian saja — rasio, bukan kumulatif) ----
  const { literByTipe, kmByTipe } = aggregateBbm(dailyShifts);
  const budgetRatioByTipe = new Map(budgetRatioRows.map((b) => [b.tipeUnitId, b.ratioLPerKm]));
  const bbmTipeIds = new Set([...literByTipe.keys(), ...kmByTipe.keys(), ...budgetRatioByTipe.keys()]);
  const bbm = Array.from(bbmTipeIds).map((tipeUnitId) => {
    const liter = literByTipe.get(tipeUnitId) ?? 0;
    const km = kmByTipe.get(tipeUnitId) ?? 0;
    const ratio = km > 0 ? liter / km : null;
    const budgetRatio = budgetRatioByTipe.get(tipeUnitId) ?? null;
    return {
      tipeUnitId,
      kode: tipeUnitsById.get(tipeUnitId)?.kode ?? tipeUnitId,
      liter,
      km,
      ratio,
      budgetRatio,
      status: ratio == null || budgetRatio == null ? ('good' as BudgetStatus) : delayStatus(ratio, budgetRatio),
    };
  });

  // ---- Fleet & unit ranking ----
  const fleet = {
    total: fleetUnits.length,
    ready: fleetUnits.filter((u) => u.status === 'ready').length,
    breakdown: fleetUnits.filter((u) => u.status === 'breakdown').length,
    pm: fleetUnits.filter((u) => u.status === 'pm').length,
  };
  const unitRanking = computeUnitRanking(dailyShifts);

  const paStatus = targetStatus(paUaMtd.paPct, targetAvailability?.targetPaPct ?? null);
  const uaStatus = targetStatus(paUaMtd.uaPct, targetAvailability?.targetUaPct ?? null);

  const overallStatus = worstStatus([
    paStatus,
    uaStatus,
    delayStatus(breakdownMtd.hours, budgetMtdTotal),
    ...delay.map((d) => d.status),
    ...production.map((p) => p.status),
    revenue.status,
  ]);

  sendData(res, {
    tanggal,
    branch: { id: branch.id, kode: branch.kode, nama: branch.nama, skemaTimbangan: branch.skemaTimbangan },
    pa: {
      daily: { pct: paUaDaily.paPct, availableMin: paUaDaily.availableMin, scheduledMin: paUaDaily.scheduledMin, targetPct: targetAvailability?.targetPaPct ?? null },
      mtd: { pct: paUaMtd.paPct, availableMin: paUaMtd.availableMin, scheduledMin: paUaMtd.scheduledMin, targetPct: targetAvailability?.targetPaPct ?? null },
      status: paStatus,
    },
    ua: {
      daily: { pct: paUaDaily.uaPct, workingMin: paUaDaily.workingMin, availableMin: paUaDaily.availableMin, targetPct: targetAvailability?.targetUaPct ?? null },
      mtd: { pct: paUaMtd.uaPct, workingMin: paUaMtd.workingMin, availableMin: paUaMtd.availableMin, targetPct: targetAvailability?.targetUaPct ?? null },
      status: uaStatus,
    },
    breakdown: {
      daily: breakdownDaily,
      mtd: breakdownMtd,
      budgetJamPerHariTotal: budgetDailyTotal,
      budgetJamPerHariTotalMtd: budgetMtdTotal,
      status: delayStatus(breakdownMtd.hours, budgetMtdTotal),
    },
    delay,
    production,
    revenue,
    bbm,
    fleet,
    unitRanking,
    status: overallStatus,
  });
});

// ==================== GET /daily-compare ====================
dashboardDailyRouter.get('/daily-compare', async (req, res) => {
  const parsed = compareQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { tanggal } = parsed.data;

  const { bulan, tahun } = tanggalToBulanTahun(tanggal);
  const delayBulan = tanggalToDelayBudgetBulan(tanggal);
  const { gte, lte } = monthStartToDate(tanggal);

  const branches = await prisma.branch.findMany({ where: { aktif: true } });
  const branchIds = branches.map((b) => b.id);

  const [allShifts, delayBudgets, materials, targetProduksiRows, targetRevenueRows, budgetRatioRows, allRates, targetAvailabilityRows] = await Promise.all([
    prisma.shift.findMany({ where: { branchId: { in: branchIds }, tanggal: { gte, lte } }, include: shiftInclude }),
    prisma.delayBudget.findMany({ where: { bulan: delayBulan } }),
    prisma.material.findMany(),
    prisma.targetProduksiBranch.findMany({ where: { branchId: { in: branchIds }, bulan, tahun } }),
    prisma.targetRevenue.findMany({ where: { branchId: { in: branchIds }, bulan, tahun } }),
    prisma.budgetRatioBbm.findMany({ where: { bulan, tahun } }),
    prisma.rate.findMany({ where: { branchId: { in: branchIds } } }),
    prisma.targetAvailabilityBranch.findMany({ where: { branchId: { in: branchIds }, bulan, tahun } }),
  ]);

  const kodeToMaterialId = new Map(materials.map((m) => [m.kode, m.id]));
  const targetTonByBranch = new Map(targetProduksiRows.map((t) => [t.branchId, t.targetTon]));
  const targetRevenueByBranch = new Map(targetRevenueRows.map((t) => [t.branchId, t.targetRp]));
  const targetAvailabilityByBranch = new Map(targetAvailabilityRows.map((t) => [t.branchId, t]));
  const totalDelayBudgetMtd = delayBudgets.reduce((sum, b) => sum + b.budgetMenit, 0);
  const budgetRatioValues = budgetRatioRows.map((b) => b.ratioLPerKm);
  const avgBudgetRatio = budgetRatioValues.length ? budgetRatioValues.reduce((a, b) => a + b, 0) / budgetRatioValues.length : null;

  const rows = branches.map((branch) => {
    const branchShifts = allShifts.filter((s) => s.branchId === branch.id);
    const branchRates = allRates.filter((r) => r.branchId === branch.id);

    const paUa = computeAvailability(branchShifts);
    const breakdown = computeBreakdown(branchShifts);
    const delayMinMtd = sumDelayAll(branchShifts);
    const production = aggregateProduction(branchShifts);
    const ritaseMtd = Array.from(production.values()).reduce((sum, p) => sum + p.ritase, 0);
    const tonaseMtd = Array.from(production.values()).reduce((sum, p) => sum + p.ton, 0);
    const revenue = aggregateRevenue(branchShifts, branchRates, kodeToMaterialId);
    const { literByTipe, kmByTipe } = aggregateBbm(branchShifts);
    const totalLiter = Array.from(literByTipe.values()).reduce((a, b) => a + b, 0);
    const totalKm = Array.from(kmByTipe.values()).reduce((a, b) => a + b, 0);
    const bbmRatioAvg = totalKm > 0 ? totalLiter / totalKm : null;

    const targetTon = targetTonByBranch.get(branch.id) ?? null;
    const targetRevenue = targetRevenueByBranch.get(branch.id) ?? 0;
    const targetAvailability = targetAvailabilityByBranch.get(branch.id) ?? null;

    const status = worstStatus([
      targetStatus(paUa.paPct, targetAvailability?.targetPaPct ?? null),
      targetStatus(paUa.uaPct, targetAvailability?.targetUaPct ?? null),
      delayStatus(breakdown.hours, 0), // tanpa BudgetBreakdownUnit per-branch di sini, hanya sinyal breakdown>0
      delayStatus(delayMinMtd, totalDelayBudgetMtd),
      targetStatus(tonaseMtd, targetTon),
      targetStatus(revenue.totalRp, targetRevenue || null),
      bbmRatioAvg != null && avgBudgetRatio != null ? delayStatus(bbmRatioAvg, avgBudgetRatio) : 'good',
    ]);

    return {
      branchId: branch.id,
      kode: branch.kode,
      nama: branch.nama,
      paMtdPct: paUa.paPct,
      paTargetPct: targetAvailability?.targetPaPct ?? null,
      uaTargetPct: targetAvailability?.targetUaPct ?? null,
      uaMtdPct: paUa.uaPct,
      breakdownCountMtd: breakdown.count,
      delayMinMtd,
      ritaseMtd,
      tonaseMtd,
      revenueMtd: revenue.totalRp,
      revenueTargetMtd: targetRevenue,
      bbmRatioAvg,
      status,
    };
  });

  sendData(res, rows, { total: rows.length });
});
