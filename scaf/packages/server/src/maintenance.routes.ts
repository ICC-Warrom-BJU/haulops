import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

const listQuery = z.object({
  shiftId: z.string().optional(),
  unitId: z.string().optional(),
  status: z.enum(['open', 'closed']).optional(),
});

const createSchema = z.object({
  shiftId: z.string().min(1),
  unitId: z.string().min(1),
  operatorId: z.string().optional(),
  jenis: z.enum(['breakdown', 'pm', 'full-day', 'standby']).default('breakdown'),
  status: z.enum(['open', 'closed']).default('open'),
  jamMulai: z.coerce.date().optional(),
  jamSelesai: z.coerce.date().optional(),
  durasiMenit: z.number().int().min(0).optional(),
  partDiganti: z.string().optional(),
  catatan: z.string().optional(),
});

const updateSchema = z.object({
  jenis: z.enum(['breakdown', 'pm', 'full-day', 'standby']).optional(),
  status: z.enum(['open', 'closed']).optional(),
  jamMulai: z.coerce.date().optional(),
  jamSelesai: z.coerce.date().optional(),
  durasiMenit: z.number().int().min(0).optional(),
  partDiganti: z.string().optional(),
  catatan: z.string().optional(),
});

// durasiJam: dari jam mulai/selesai bila ada, else dari durasiMenit.
function computeDurasiJam(jamMulai?: Date, jamSelesai?: Date, durasiMenit?: number): number | undefined {
  if (jamMulai && jamSelesai) return Math.max(0, (jamSelesai.getTime() - jamMulai.getTime()) / 3600000);
  if (durasiMenit !== undefined) return durasiMenit / 60;
  return undefined;
}

export const maintenanceRouter = Router();

maintenanceRouter.get('/', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = {};
  if (parsed.data.shiftId) where.shiftId = parsed.data.shiftId;
  if (parsed.data.unitId) where.unitId = parsed.data.unitId;
  if (parsed.data.status) where.status = parsed.data.status;

  const data = await prisma.maintenance.findMany({
    where,
    include: { shift: true, unit: { include: { tipe: true } } },
    orderBy: { createdAt: 'desc' },
  });

  sendData(res, data, { total: data.length });
});

maintenanceRouter.post('/', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const shift = await prisma.shift.findUnique({
    where: { id: parsed.data.shiftId },
  });
  if (!shift) return sendNotFound(res, 'Shift tidak ditemukan.');

  const unit = await prisma.unit.findUnique({
    where: { id: parsed.data.unitId },
    include: { tipe: true },
  });
  if (!unit || unit.branchId !== shift.branchId || !unit.aktif) {
    return sendNotFound(res, 'Unit tidak valid untuk shift ini.');
  }

  // Business rule: satu record maintenance per unit per shift.
  const existing = await prisma.maintenance.findUnique({
    where: { shiftId_unitId: { shiftId: parsed.data.shiftId, unitId: parsed.data.unitId } },
  });
  if (existing) {
    return res.status(409).json({
      error: {
        code: 'MAINTENANCE_EXISTS',
        message: 'Sudah ada record maintenance untuk unit ini pada shift tersebut.',
      },
    });
  }

  const record = await prisma.maintenance.create({
    data: {
      shiftId: parsed.data.shiftId,
      unitId: parsed.data.unitId,
      jenis: parsed.data.jenis,
      status: parsed.data.status,
      // jamMulai wajib di schema; default ke waktu pencatatan.
      jamMulai: parsed.data.jamMulai ?? new Date(),
      jamSelesai: parsed.data.jamSelesai,
      durasiJam: computeDurasiJam(parsed.data.jamMulai, parsed.data.jamSelesai, parsed.data.durasiMenit) ?? 0,
      budgetJam: unit.budgetBreakdownJam ?? 3,
      partDiganti: parsed.data.partDiganti,
      keterangan: parsed.data.catatan,
    },
    include: { shift: true, unit: { include: { tipe: true } } },
  });

  sendData(res, record);
});

maintenanceRouter.put('/:id', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const maintenance = await prisma.maintenance.findUnique({
    where: { id: req.params.id },
    include: { shift: true, unit: true },
  });
  if (!maintenance) return sendNotFound(res, 'Maintenance tidak ditemukan.');

  const { durasiMenit, catatan, jamMulai, jamSelesai, ...rest } = parsed.data;
  const updateData: any = { ...rest };
  if (jamMulai !== undefined) updateData.jamMulai = jamMulai;
  if (jamSelesai !== undefined) updateData.jamSelesai = jamSelesai;
  if (catatan !== undefined) updateData.keterangan = catatan;

  // Recompute durasiJam bila jam atau durasi berubah.
  const effMulai = jamMulai ?? maintenance.jamMulai ?? undefined;
  const effSelesai = jamSelesai ?? maintenance.jamSelesai ?? undefined;
  const durasi = computeDurasiJam(effMulai, effSelesai, durasiMenit);
  if (durasi !== undefined) updateData.durasiJam = durasi;

  const updatedMaintenance = await prisma.maintenance.update({
    where: { id: req.params.id },
    data: updateData,
    include: { shift: true, unit: { include: { tipe: true } } },
  });

  sendData(res, updatedMaintenance);
});

maintenanceRouter.delete('/:id', requireRole('supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const maintenance = await prisma.maintenance.findUnique({ where: { id: req.params.id } });
  if (!maintenance) return sendNotFound(res, 'Maintenance tidak ditemukan.');

  await prisma.maintenance.delete({ where: { id: req.params.id } });
  sendData(res, { id: maintenance.id, message: 'Maintenance dihapus.' });
});

maintenanceRouter.get('/issues', async (_req, res) => {
  const data = await prisma.maintenance.findMany({
    where: { status: 'open' },
    include: { shift: true, unit: true },
  });
  sendData(res, data, { total: data.length });
});

maintenanceRouter.get('/ready', async (_req, res) => {
  const data = await prisma.unit.findMany({
    where: { aktif: true, status: 'ready' },
    include: { tipe: true, branch: true },
  });
  sendData(res, data, { total: data.length });
});
