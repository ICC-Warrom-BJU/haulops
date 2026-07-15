import { Router } from 'express';
import { sendData } from './http.js';
import prisma from './prisma/client.js';

export const dashboardRouter = Router();

dashboardRouter.get('/kpi', async (_req, res) => {
  const openShift = await prisma.shift.findFirst({
    where: { status: 'open' },
    include: { branch: true },
  });
  const pendingShifts = await prisma.shift.count({ where: { status: 'pending' } });
  const approvedShifts = await prisma.shift.count({ where: { status: 'approved' } });
  const branches = await prisma.branch.count();

  sendData(res, {
    activeShift: openShift ?? null,
    pendingShifts,
    approvedShifts,
    totalBranches: branches,
  });
});

dashboardRouter.get('/chart-tonase', async (_req, res) => {
  const shifts = await prisma.shift.findMany({
    take: 7,
    orderBy: { tanggal: 'desc' },
  });

  const data = shifts.map((shift) => ({
    tanggal: shift.tanggal,
    tonase: shift.tonase,
    ritase: shift.ritase,
  }));

  sendData(res, data, { total: data.length });
});

dashboardRouter.get('/delay-vs-budget', async (_req, res) => {
  const delayTypes = await prisma.delayType.findMany({
    include: { delays: true },
  });

  const summary = delayTypes.map((type) => {
    const totalDelay = type.delays.reduce((sum, item) => sum + item.durasiMenit, 0);
    return {
      delayType: type.kode,
      nama: type.nama,
      totalDelay,
      budgetMenit: type.budgetMenit ?? 0,
      variance: totalDelay - (type.budgetMenit ?? 0),
    };
  });

  sendData(res, summary, { total: summary.length });
});

dashboardRouter.get('/fleet-status', async (_req, res) => {
  const units = await prisma.unit.findMany({
    include: { tipe: true, branch: true },
  });

  const byUnit = units.map((unit) => ({
    unitId: unit.id,
    kode: unit.kode,
    branchId: unit.branchId,
    status: unit.status,
    aktif: unit.aktif,
  }));

  sendData(res, { fleet: byUnit, total: byUnit.length });
});

dashboardRouter.get('/alerts', async (_req, res) => {
  const delayTypes = await prisma.delayType.findMany({
    include: { delays: true },
  });

  const delayAlerts = delayTypes
    .map((type) => {
      const totalDelay = type.delays.reduce((sum, item) => sum + item.durasiMenit, 0);
      const budgetMenit = type.budgetMenit ?? 0;
      return { type: type.kode, nama: type.nama, overBudget: totalDelay > budgetMenit, totalDelay, budgetMenit };
    })
    .filter((item) => item.overBudget);

  const bbmAlerts = await prisma.bBMLog.findMany({
    where: { liter: { gt: 100 } },
    include: { unit: true },
  });

  sendData(res, { alerts: [...delayAlerts, ...bbmAlerts], total: delayAlerts.length + bbmAlerts.length });
});

dashboardRouter.get('/recent-rits', async (_req, res) => {
  const recent = await prisma.shift.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
  });

  const data = recent.map((shift) => ({
    shiftId: shift.id,
    tanggal: shift.tanggal,
    status: shift.status,
    ritase: shift.ritase,
  }));

  sendData(res, { recent: data, total: data.length });
});
