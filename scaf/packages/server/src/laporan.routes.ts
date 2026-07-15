import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendValidationError } from './http.js';
import prisma from './prisma/client.js';

const reportQuery = z.object({ tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), bulan: z.string().regex(/^\d{4}-\d{2}$/).optional() });

function serializeCsv(rows: Array<Array<string | number | null>>) {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const value = cell == null ? '' : String(cell);
          return `"${value.replace(/"/g, '""')}"`;
        })
        .join(','),
    )
    .join('\n');
}

export const laporanRouter = Router();

laporanRouter.get('/daily', async (req, res) => {
  const parsed = reportQuery.pick({ tanggal: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const tanggal = parsed.data.tanggal ?? new Date().toISOString().slice(0, 10);
  const dailyShifts = await prisma.shift.findMany({
    where: { tanggal: tanggal },
    include: {
      branch: true,
      rits: true,
      delays: true,
      maintenances: true,
      bbmLogs: true,
    },
  });

  const data = dailyShifts.map((shift) => {
    return {
      shiftId: shift.id,
      tanggal: shift.tanggal,
      branchId: shift.branchId,
      tipe: shift.tipe,
      ritCount: shift.rits.length,
      totalTonase: shift.rits.reduce((sum, item) => sum + (item.nettoTon ?? item.estimasiTon ?? 0), 0),
      totalDelayMinutes: shift.delays.reduce((sum, item) => sum + item.durasiMenit, 0),
      maintenanceCount: shift.maintenances.length,
      totalBBMLiter: shift.bbmLogs.reduce((sum, item) => sum + item.liter, 0),
    };
  });

  sendData(res, data, { total: data.length });
});

laporanRouter.get('/delay-summary', async (_req, res) => {
  const summary = await prisma.delayType.findMany({
    include: { delays: true },
  });

  const data = summary.map((type) => {
    const total = type.delays.reduce((sum, item) => sum + item.durasiMenit, 0);
    return { delayType: type.kode, nama: type.nama, totalDurasiMenit: total, budgetMenit: type.budgetMenit };
  });

  sendData(res, data, { total: data.length });
});

laporanRouter.get('/bbm', async (_req, res) => {
  const logs = await prisma.bBMLog.findMany({
    include: { unit: true },
  });

  const data = new Map<string, { unitId: string; totalLiter: number; entries: number }>();
  for (const log of logs) {
    const current = data.get(log.unitId) ?? { unitId: log.unitId, totalLiter: 0, entries: 0 };
    current.totalLiter += log.liter;
    current.entries += 1;
    data.set(log.unitId, current);
  }

  sendData(res, Array.from(data.values()), { total: data.size });
});

laporanRouter.get('/maintenance', async (_req, res) => {
  const maintenances = await prisma.maintenance.findMany();

  const grouped = new Map<string, { jenis: string; count: number; open: number; closed: number }>();
  for (const item of maintenances) {
    const current = grouped.get(item.jenis) ?? { jenis: item.jenis, count: 0, open: 0, closed: 0 };
    current.count += 1;
    if (item.status === 'open') current.open += 1;
    else current.closed += 1;
    grouped.set(item.jenis, current);
  }

  sendData(res, Array.from(grouped.values()), { total: grouped.size });
});

laporanRouter.get('/bulanan', async (req, res) => {
  const parsed = reportQuery.pick({ bulan: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const month = parsed.data.bulan ?? new Date().toISOString().slice(0, 7);
  const monthlyShifts = await prisma.shift.findMany({
    where: { tanggal: { startsWith: month } },
    include: {
      rits: true,
      delays: true,
      maintenances: true,
    },
  });

  const totalRit = monthlyShifts.reduce((sum, shift) => sum + shift.rits.length, 0);
  const totalTonase = monthlyShifts.reduce((sum, shift) => sum + shift.rits.reduce((sumRit, item) => sumRit + (item.nettoTon ?? item.estimasiTon ?? 0), 0), 0);
  const totalDelayMinutes = monthlyShifts.reduce((sum, shift) => sum + shift.delays.reduce((sumDelay, item) => sumDelay + item.durasiMenit, 0), 0);
  const maintenanceCount = monthlyShifts.reduce((sum, shift) => sum + shift.maintenances.length, 0);

  sendData(res, {
    bulan: month,
    shifts: monthlyShifts.length,
    totalRit,
    totalTonase,
    delayMinutes: totalDelayMinutes,
    maintenanceCount,
  });
});

laporanRouter.get('/export', async (req, res) => {
  const parsed = reportQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  if (parsed.data.tanggal) {
    const tanggal = parsed.data.tanggal;
    const dailyShifts = await prisma.shift.findMany({
      where: { tanggal: tanggal },
      include: {
        rits: true,
        delays: true,
        maintenances: true,
        bbmLogs: true,
      },
    });

    const rows = dailyShifts.map((shift) => {
      return [
        shift.id,
        shift.tanggal,
        shift.branchId,
        shift.tipe,
        shift.rits.length,
        shift.rits.reduce((sum, item) => sum + (item.nettoTon ?? item.estimasiTon ?? 0), 0),
        shift.delays.reduce((sum, item) => sum + item.durasiMenit, 0),
        shift.maintenances.length,
        shift.bbmLogs.reduce((sum, item) => sum + item.liter, 0),
      ];
    });

    const csv = serializeCsv([
      ['shiftId', 'tanggal', 'branchId', 'tipe', 'ritCount', 'totalTonase', 'totalDelayMinutes', 'maintenanceCount', 'totalBBMLiter'],
      ...rows,
    ]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan-export-daily.csv"');
    return res.send(csv);
  }

  const month = parsed.data.bulan ?? new Date().toISOString().slice(0, 7);
  const monthlyShifts = await prisma.shift.findMany({
    where: { tanggal: { startsWith: month } },
    include: { rits: true },
  });

  const rows = monthlyShifts.map((shift) => {
    return [
      shift.id,
      shift.tanggal,
      shift.branchId,
      shift.tipe,
      shift.rits.length,
      shift.rits.reduce((sum, item) => sum + (item.nettoTon ?? item.estimasiTon ?? 0), 0),
    ];
  });

  const csv = serializeCsv([
    ['shiftId', 'tanggal', 'branchId', 'tipe', 'ritCount', 'totalTonase'],
    ...rows,
  ]);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="laporan-export-monthly.csv"');
  res.send(csv);
});
