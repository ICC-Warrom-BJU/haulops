import { Prisma } from '@prisma/client';
import { shiftDurationHours } from './dashboard-utils.js';

// ============================================================================
// Analytic core — layer komputasi murni (tanpa Express/HTTP), dipakai bersama
// oleh dashboard-daily.routes.ts (dashboard existing) dan analytic.routes.ts
// (endpoint raw data). Semua fungsi di sini pure: input array shift (sudah
// di-include relasinya) -> angka, tidak menyentuh req/res/prisma langsung.
// ============================================================================

// ---- Include shape shift dipakai semua konsumen agregator ----
export const shiftInclude = {
  units: true,
  rits: { include: { unit: { include: { tipe: true } } } },
  delays: { include: { delayType: true, unit: true } },
  maintenances: { include: { unit: true } },
  bbmLogs: { include: { unit: { include: { tipe: true } } } },
} as const;

export type ShiftAgg = Prisma.ShiftGetPayload<{ include: typeof shiftInclude }>;
export type RateRow = Prisma.RateGetPayload<Record<string, never>>;
export type BasisRow = Prisma.BasisTargetProduksiGetPayload<Record<string, never>>;

// ---- Agregator murni (dipakai untuk slice harian maupun MTD) ----

export function computeAvailability(shifts: ShiftAgg[]) {
  let scheduledMin = 0;
  let paDeductMin = 0;
  let uaDeductMin = 0;
  for (const shift of shifts) {
    const durMin = shiftDurationHours(shift.jamMulai, shift.jamSelesai) * 60;
    scheduledMin += durMin * shift.units.length;
    for (const m of shift.maintenances) {
      if (m.jenis === 'breakdown' || m.jenis === 'pm') paDeductMin += m.durasiJam * 60;
    }
    for (const d of shift.delays) {
      if (d.delayType.kenaPA) paDeductMin += d.durasiMenit;
      else uaDeductMin += d.durasiMenit;
    }
  }
  const availableMin = Math.max(0, scheduledMin - paDeductMin);
  const workingMin = Math.max(0, availableMin - uaDeductMin);
  return {
    scheduledMin,
    availableMin,
    workingMin,
    paPct: scheduledMin > 0 ? (availableMin / scheduledMin) * 100 : 0,
    uaPct: availableMin > 0 ? (workingMin / availableMin) * 100 : 0,
  };
}

export function computeBreakdown(shifts: ShiftAgg[]) {
  let count = 0;
  let hours = 0;
  for (const shift of shifts) {
    for (const m of shift.maintenances) {
      if (m.jenis === 'breakdown') {
        count += 1;
        hours += m.durasiJam;
      }
    }
  }
  return { count, hours };
}

export function sumDelayByType(shifts: ShiftAgg[], delayTypeId: string) {
  let sum = 0;
  for (const shift of shifts) {
    for (const d of shift.delays) {
      if (d.delayTypeId === delayTypeId) sum += d.durasiMenit;
    }
  }
  return sum;
}

export function sumDelayAll(shifts: ShiftAgg[]) {
  let sum = 0;
  for (const shift of shifts) for (const d of shift.delays) sum += d.durasiMenit;
  return sum;
}

export function aggregateProduction(shifts: ShiftAgg[]) {
  const map = new Map<string, { ritase: number; ton: number }>();
  for (const shift of shifts) {
    for (const r of shift.rits) {
      const cur = map.get(r.material) ?? { ritase: 0, ton: 0 };
      cur.ritase += r.jumlahRit;
      cur.ton += r.nettoTon ?? r.estimasiTon ?? 0;
      map.set(r.material, cur);
    }
  }
  return map;
}

// Resolusi rate berlaku per rit: spesifik (pit+stockpile cocok persis) lebih
// diutamakan dari generik (pit/stockpile null); bila berkonflik, berlakuDari
// paling baru menang. Tidak ada yang cocok -> null (dihitung "unpriced").
export function resolveRate(
  rit: ShiftAgg['rits'][number],
  shiftTanggal: string,
  rateRows: RateRow[],
  kodeToMaterialId: Map<string, string>,
): number | null {
  const materialId = kodeToMaterialId.get(rit.material);
  if (!materialId) return null;
  const tipeUnitId = rit.unit.tipeId;
  const pool = rateRows.filter((r) => {
    if (r.tipeUnitId !== tipeUnitId || r.materialId !== materialId) return false;
    const dari = r.berlakuDari.toISOString().slice(0, 10);
    const sampai = r.berlakuSampai ? r.berlakuSampai.toISOString().slice(0, 10) : null;
    return dari <= shiftTanggal && (sampai === null || sampai >= shiftTanggal);
  });
  const byNewest = (a: RateRow, b: RateRow) => b.berlakuDari.getTime() - a.berlakuDari.getTime();
  const specific = pool
    .filter((r) => r.pitId === (rit.pitId ?? null) && r.stockpileId === (rit.stockpileId ?? null))
    .sort(byNewest)[0];
  const generic = pool.filter((r) => r.pitId === null && r.stockpileId === null).sort(byNewest)[0];
  return (specific ?? generic ?? null)?.rateRpPerTon ?? null;
}

export function aggregateRevenue(shifts: ShiftAgg[], rateRows: RateRow[], kodeToMaterialId: Map<string, string>) {
  let totalRp = 0;
  let unpriced = 0;
  const perTipe = new Map<string, number>();
  for (const shift of shifts) {
    for (const r of shift.rits) {
      const ton = r.nettoTon ?? r.estimasiTon ?? 0;
      const rate = resolveRate(r, shift.tanggal, rateRows, kodeToMaterialId);
      if (rate == null) {
        unpriced += 1;
        continue;
      }
      const rp = ton * rate;
      totalRp += rp;
      perTipe.set(r.unit.tipeId, (perTipe.get(r.unit.tipeId) ?? 0) + rp);
    }
  }
  return { totalRp, unpriced, perTipe };
}

export function aggregateBbm(shifts: ShiftAgg[]) {
  const literByTipe = new Map<string, number>();
  const kmByTipe = new Map<string, number>();
  for (const shift of shifts) {
    for (const b of shift.bbmLogs) {
      literByTipe.set(b.unit.tipeId, (literByTipe.get(b.unit.tipeId) ?? 0) + b.liter);
    }
    for (const r of shift.rits) {
      kmByTipe.set(r.unit.tipeId, (kmByTipe.get(r.unit.tipeId) ?? 0) + (r.jarakKm ?? 0));
    }
  }
  return { literByTipe, kmByTipe };
}

export function computeUnitRanking(shifts: ShiftAgg[]) {
  const map = new Map<string, { kode: string; breakdownHours: number; delayMin: number }>();
  for (const shift of shifts) {
    for (const m of shift.maintenances) {
      if (m.jenis !== 'breakdown') continue;
      const cur = map.get(m.unitId) ?? { kode: m.unit.kode, breakdownHours: 0, delayMin: 0 };
      cur.breakdownHours += m.durasiJam;
      map.set(m.unitId, cur);
    }
    for (const d of shift.delays) {
      if (!d.unitId || !d.unit) continue; // FLEET-scope tidak diatribusikan ke satu unit
      const cur = map.get(d.unitId) ?? { kode: d.unit.kode, breakdownHours: 0, delayMin: 0 };
      cur.delayMin += d.durasiMenit;
      map.set(d.unitId, cur);
    }
  }
  return Array.from(map.entries())
    .map(([unitId, v]) => ({ unitId, ...v }))
    .sort((a, b) => b.breakdownHours * 60 + b.delayMin - (a.breakdownHours * 60 + a.delayMin))
    .slice(0, 10)
    .map((u, i) => ({ ...u, rank: i + 1 }));
}

// ---- Fungsi khusus modul Analytic ----

// Resolusi input dasar (versioned) untuk satu tipe unit + material pada tanggal
// tertentu. Mirror resolveRate: jendela berlakuDari..berlakuSampai, berlakuDari
// terbaru menang. Tidak ada yang cocok -> null (tak ada Target hari itu).
export function resolveBasis(
  basisRows: BasisRow[],
  tipeUnitId: string,
  materialId: string,
  tanggal: string,
): BasisRow | null {
  const pool = basisRows.filter((b) => {
    if (b.tipeUnitId !== tipeUnitId || b.materialId !== materialId) return false;
    const dari = b.berlakuDari.toISOString().slice(0, 10);
    const sampai = b.berlakuSampai ? b.berlakuSampai.toISOString().slice(0, 10) : null;
    return dari <= tanggal && (sampai === null || sampai >= tanggal);
  });
  return pool.sort((a, b) => b.berlakuDari.getTime() - a.berlakuDari.getTime())[0] ?? null;
}

// DT Beroperasi Aktual = unit yang punya >=1 Rit hari itu DAN tidak sedang
// Maintenance breakdown/pm hari itu. (schema Unit.status hanya snapshot saat ini,
// tak bisa dipakai historis — jejak historis ada di Maintenance.)
export function computeDtBeroperasi(shifts: ShiftAgg[]) {
  const unitWithRit = new Set<string>();
  const unitDownForMaintenance = new Set<string>();
  for (const shift of shifts) {
    for (const r of shift.rits) unitWithRit.add(r.unitId);
    for (const m of shift.maintenances) {
      if (m.jenis === 'breakdown' || m.jenis === 'pm') unitDownForMaintenance.add(m.unitId);
    }
  }
  let count = 0;
  for (const unitId of unitWithRit) {
    if (!unitDownForMaintenance.has(unitId)) count += 1;
  }
  return count;
}
