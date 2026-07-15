import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

const listQuery = z.object({
  shiftId: z.string().optional(),
  unitId: z.string().optional(),
  operatorBbmId: z.string().optional(),
});

const createSchema = z.object({
  shiftId: z.string().min(1),
  unitId: z.string().min(1),
  operatorBbmId: z.string().min(1),
  liter: z.number().min(0),
  odoKm: z.number().min(0).optional(),
  hm: z.number().min(0).optional(),
  fuelStationId: z.string().optional(),
  fuelTypeId: z.string().optional(),
  lokasi: z.string().optional(),
  jamPengisian: z.coerce.date().optional(),
  keterangan: z.string().optional(),
  jenis: z.string().min(1).default('solar'),
});

const updateSchema = z.object({
  liter: z.number().min(0).optional(),
  odoKm: z.number().min(0).optional(),
  hm: z.number().min(0).optional(),
  fuelStationId: z.string().optional(),
  fuelTypeId: z.string().optional(),
  lokasi: z.string().optional(),
  jamPengisian: z.coerce.date().optional(),
  keterangan: z.string().optional(),
});

const bbmInclude = { shift: true, unit: { include: { tipe: true } }, operatorBbm: true, fuelStation: true, fuelType: true } as const;

export const bbmRouter = Router();

bbmRouter.get('/', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = {};
  if (parsed.data.shiftId) where.shiftId = parsed.data.shiftId;
  if (parsed.data.unitId) where.unitId = parsed.data.unitId;
  if (parsed.data.operatorBbmId) where.operatorBbmId = parsed.data.operatorBbmId;

  const data = await prisma.bBMLog.findMany({
    where,
    include: bbmInclude,
    orderBy: { createdAt: 'desc' },
  });

  sendData(res, data, { total: data.length });
});

// Validasi + create satu record BBM (dipakai POST / dan POST /import).
type BbmInput = z.infer<typeof createSchema>;
async function createBbmRecord(input: BbmInput) {
  const shift = await prisma.shift.findUnique({ where: { id: input.shiftId } });
  if (!shift) return { error: 'Shift tidak ditemukan.' as const };

  const unit = await prisma.unit.findUnique({ where: { id: input.unitId } });
  if (!unit || unit.branchId !== shift.branchId || !unit.aktif) return { error: 'Unit tidak valid untuk shift ini.' as const };

  const operator = await prisma.user.findUnique({ where: { id: input.operatorBbmId } });
  if (!operator) return { error: 'Operator BBM tidak ditemukan.' as const };

  // Lokasi diambil dari master Fuel Station bila fuelStationId diisi (denormalisasi nama).
  let lokasi = input.lokasi;
  if (input.fuelStationId) {
    const station = await prisma.fuelStation.findUnique({ where: { id: input.fuelStationId } });
    if (station) lokasi = station.nama;
  }

  const record = await prisma.bBMLog.create({
    data: {
      shiftId: input.shiftId,
      unitId: input.unitId,
      operatorBbmId: input.operatorBbmId,
      fuelStationId: input.fuelStationId,
      fuelTypeId: input.fuelTypeId,
      liter: input.liter,
      odoKm: input.odoKm,
      hm: input.hm,
      jamPengisian: input.jamPengisian ?? new Date(),
      lokasi: lokasi ?? 'Pool',
      keterangan: input.keterangan,
    },
    include: bbmInclude,
  });
  return { record };
}

bbmRouter.post('/', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const result = await createBbmRecord(parsed.data);
  if ('error' in result) return sendNotFound(res, result.error);
  sendData(res, result.record);
});

bbmRouter.post('/import', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  if (!items.length) return sendValidationError(res, { issues: [{ path: [], message: 'Request harus array data BBM.' }] } as any);

  const created: any[] = [];
  for (const item of items) {
    const parsed = createSchema.safeParse(item);
    if (!parsed.success) continue;
    const result = await createBbmRecord(parsed.data);
    if ('record' in result) created.push(result.record);
  }

  sendData(res, created, { total: created.length });
});

bbmRouter.put('/:id', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const existing = await prisma.bBMLog.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Record BBM tidak ditemukan.');

  const record = await prisma.bBMLog.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: bbmInclude,
  });
  sendData(res, record);
});

bbmRouter.delete('/:id', requireRole('supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const existing = await prisma.bBMLog.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Record BBM tidak ditemukan.');

  await prisma.bBMLog.delete({ where: { id: req.params.id } });
  sendData(res, { id: existing.id, message: 'Record BBM dihapus.' });
});

bbmRouter.get('/previous/:unitId', async (req, res) => {
  const unit = await prisma.unit.findUnique({
    where: { id: req.params.unitId },
  });
  if (!unit) return sendNotFound(res, 'Unit tidak ditemukan.');

  const previous = await prisma.bBMLog.findFirst({
    where: { unitId: unit.id },
    include: { shift: true, operatorBbm: true },
    orderBy: { createdAt: 'desc' },
  });

  sendData(res, { unitId: unit.id, previous });
});

bbmRouter.get('/report', async (_req, res) => {
  const logs = await prisma.bBMLog.findMany({
    include: { unit: true },
  });

  const reportMap = new Map<string, { unitId: string; totalLiter: number; entries: number }>();
  for (const log of logs) {
    const entry = reportMap.get(log.unitId) ?? { unitId: log.unitId, totalLiter: 0, entries: 0 };
    entry.totalLiter += log.liter;
    entry.entries += 1;
    reportMap.set(log.unitId, entry);
  }

  sendData(res, Array.from(reportMap.values()), { total: reportMap.size });
});
