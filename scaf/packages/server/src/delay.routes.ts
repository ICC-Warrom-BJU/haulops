import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

const listQuery = z.object({
  shiftId: z.string().optional(),
  unitId: z.string().optional(),
  delayTypeId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const createSchema = z.object({
  shiftId: z.string().min(1),
  delayTypeId: z.string().min(1),
  unitId: z.string().optional(),
  unitIds: z.array(z.string()).optional(),
  jamMulai: z.coerce.date().optional(),
  jamSelesai: z.coerce.date().optional(),
  durasiMenit: z.number().int().min(0).default(0),
  catatan: z.string().optional(),
});

const updateSchema = z.object({
  delayTypeId: z.string().optional(),
  unitId: z.string().optional(),
  jamMulai: z.coerce.date().optional(),
  jamSelesai: z.coerce.date().optional(),
  durasiMenit: z.number().int().min(0).optional(),
  catatan: z.string().optional(),
});

export const delayRouter = Router();

delayRouter.get('/', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = {};
  if (parsed.data.shiftId) where.shiftId = parsed.data.shiftId;
  if (parsed.data.unitId) where.unitId = parsed.data.unitId;
  if (parsed.data.delayTypeId) where.delayTypeId = parsed.data.delayTypeId;
  if (parsed.data.dateFrom || parsed.data.dateTo) {
    where.shift = {
      tanggal: {
        ...(parsed.data.dateFrom ? { gte: parsed.data.dateFrom } : {}),
        ...(parsed.data.dateTo ? { lte: parsed.data.dateTo } : {}),
      },
    };
  }

  const data = await prisma.delay.findMany({
    where,
    include: { shift: true, delayType: true, unit: true },
    orderBy: { createdAt: 'desc' },
  });

  sendData(res, data, { total: data.length });
});

delayRouter.post('/', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const shift = await prisma.shift.findUnique({
    where: { id: parsed.data.shiftId },
  });
  if (!shift) return sendNotFound(res, 'Shift tidak ditemukan.');

  const delayType = await prisma.delayType.findUnique({
    where: { id: parsed.data.delayTypeId },
  });
  if (!delayType) return sendNotFound(res, 'Delay type tidak ditemukan.');

  const targetUnits = parsed.data.unitIds?.length ? parsed.data.unitIds : parsed.data.unitId ? [parsed.data.unitId] : [null];
  const created: any[] = [];

  for (const unitId of targetUnits) {
    if (unitId) {
      const unit = await prisma.unit.findUnique({
        where: { id: unitId },
      });
      if (!unit || unit.branchId !== shift.branchId || !unit.aktif) continue;
    }

    const record = await prisma.delay.create({
      data: {
        shiftId: parsed.data.shiftId,
        unitId: unitId,
        delayTypeId: parsed.data.delayTypeId,
        scope: unitId ? 'UNIT' : 'FLEET',
        // jamMulai wajib di schema; default ke waktu pencatatan bila tidak diisi.
        jamMulai: parsed.data.jamMulai ?? new Date(),
        jamSelesai: parsed.data.jamSelesai,
        durasiMenit: parsed.data.durasiMenit,
        keterangan: parsed.data.catatan,
      },
      include: { shift: true, delayType: true, unit: true },
    });

    created.push(record);
  }

  sendData(res, created, { total: created.length });
});

delayRouter.put('/:id', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const delay = await prisma.delay.findUnique({
    where: { id: req.params.id },
    include: { shift: true, delayType: true, unit: true },
  });
  if (!delay) return sendNotFound(res, 'Delay tidak ditemukan.');

  const { catatan, ...rest } = parsed.data;
  const updatedDelay = await prisma.delay.update({
    where: { id: req.params.id },
    data: {
      ...rest,
      ...(catatan !== undefined ? { keterangan: catatan } : {}),
    },
    include: { shift: true, delayType: true, unit: true },
  });

  sendData(res, updatedDelay);
});

delayRouter.delete('/:id', requireRole('supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const delay = await prisma.delay.findUnique({ where: { id: req.params.id } });
  if (!delay) return sendNotFound(res, 'Delay tidak ditemukan.');

  await prisma.delay.delete({ where: { id: req.params.id } });
  sendData(res, { id: delay.id, message: 'Delay dihapus.' });
});

delayRouter.get('/summary', async (_req, res) => {
  const delayTypes = await prisma.delayType.findMany({
    include: { delays: true },
  });

  const summary = delayTypes.map((type) => {
    const total = type.delays.reduce((sum, current) => sum + current.durasiMenit, 0);
    return { delayType: type, totalDurasiMenit: total };
  });

  sendData(res, summary, { total: summary.length });
});

delayRouter.get('/validation/:unitId/:tanggal', async (req, res) => {
  const unit = await prisma.unit.findUnique({
    where: { id: req.params.unitId },
  });
  if (!unit) return sendNotFound(res, 'Unit tidak ditemukan.');

  const tanggal = req.params.tanggal;
  const delays = await prisma.delay.findMany({
    where: {
      unitId: unit.id,
      shift: { tanggal: tanggal },
    },
  });

  const totalDelay = delays.reduce((sum, item) => sum + item.durasiMenit, 0);

  sendData(res, { unitId: unit.id, tanggal, totalDelay, limit: 1440, overLimit: totalDelay > 1440 });
});
