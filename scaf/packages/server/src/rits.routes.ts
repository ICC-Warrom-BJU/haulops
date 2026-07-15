import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

const listQuery = z.object({
  shiftId: z.string().optional(),
  unitId: z.string().optional(),
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(25),
});

const createSchema = z.object({
  shiftId: z.string().min(1),
  unitId: z.string().min(1),
  operatorId: z.string().optional(),
  pitId: z.string().optional(),
  stockpileId: z.string().optional(),
  material: z.string().min(1),
  jumlahRit: z.number().int().min(1).optional().default(1),
  jarakKm: z.number().min(0).optional(),
  grossKg: z.number().optional(),
  tareKg: z.number().optional(),
  catatan: z.string().optional(),
});

const updateSchema = createSchema.partial();

export const ritsRouter = Router();

// Jarak km: pakai nilai eksplisit bila ada, selain itu ambil dari matriks master
// (PitStockpileDistance) berdasarkan pasangan pit+stockpile. Null bila tak ada data.
async function resolveJarakKm(
  pitId: string | undefined,
  stockpileId: string | undefined,
  provided: number | undefined,
): Promise<number | null> {
  if (provided != null) return provided;
  if (!pitId || !stockpileId) return null;
  const dist = await prisma.pitStockpileDistance.findUnique({
    where: { pitId_stockpileId: { pitId, stockpileId } },
  });
  return dist?.jarakKm ?? null;
}

// Nomor rit collision-proof: pakai MAX urutan yang ada (bukan count) agar tahan
// terhadap gap penomoran. Rit yang sudah dibuat pada batch sebelumnya ikut terhitung
// karena di-query ulang tiap pemanggilan.
async function nextRitNo(branchId: string, tanggal: string, branchCode: string, datePart: string) {
  const existing = await prisma.rit.findMany({
    where: { shift: { branchId, tanggal } },
    select: { noRit: true },
  });
  const maxSeq = existing.reduce((max, r) => {
    const n = Number(/-(\d+)$/.exec(r.noRit)?.[1] ?? 0);
    return n > max ? n : max;
  }, 0);
  return `RIT-${branchCode}-${datePart}-${String(maxSeq + 1).padStart(3, '0')}`;
}

ritsRouter.get('/', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = {};
  if (parsed.data.shiftId) where.shiftId = parsed.data.shiftId;
  if (parsed.data.unitId) where.unitId = parsed.data.unitId;

  const [data, total] = await Promise.all([
    prisma.rit.findMany({
      where,
      include: { shift: true, unit: true, operator: true, pit: true, stockpile: true },
      skip: (parsed.data.page - 1) * parsed.data.limit,
      take: parsed.data.limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.rit.count({ where }),
  ]);

  sendData(res, data, { total, page: parsed.data.page, limit: parsed.data.limit });
});

ritsRouter.get('/:id', async (req, res) => {
  const rit = await prisma.rit.findUnique({
    where: { id: req.params.id },
    include: { shift: true, unit: true, operator: true, pit: true, stockpile: true },
  });
  if (!rit) return sendNotFound(res, 'Rit tidak ditemukan.');
  sendData(res, rit);
});

ritsRouter.post('/', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const shift = await prisma.shift.findUnique({
    where: { id: parsed.data.shiftId },
    include: { branch: true },
  });
  if (!shift) return res.status(400).json({ error: { code: 'INVALID_SHIFT', message: 'Shift tidak valid.' } });

  const unit = await prisma.unit.findUnique({
    where: { id: parsed.data.unitId },
    include: { tipe: true },
  });
  if (!unit || unit.branchId !== shift.branchId || !unit.aktif) {
    return res.status(400).json({ error: { code: 'INVALID_UNIT', message: 'Unit tidak valid atau tidak aktif untuk shift ini.' } });
  }

  // generate noRit: RIT-{BRANCH}-{YYYYMMDD}-{SEQ}
  const branchCode = shift.branch.kode.replace(/\s+/g, '-');
  const datePart = shift.tanggal.replace(/-/g, '');
  const noRit = await nextRitNo(shift.branchId, shift.tanggal, branchCode, datePart);

  const hasTimbangan = Boolean(parsed.data.grossKg && parsed.data.tareKg);
  const jarakKm = await resolveJarakKm(parsed.data.pitId, parsed.data.stockpileId, parsed.data.jarakKm);
  // gross-tare/kapasitas merepresentasikan ton PER rit — dikali jumlahRit karena
  // satu record bisa mewakili beberapa rit sekaligus (input batch).
  const kapasitasTon = unit.tipe?.kapasitasTon;
  const newRit = await prisma.rit.create({
    data: {
      noRit,
      shiftId: parsed.data.shiftId,
      unitId: parsed.data.unitId,
      operatorId: parsed.data.operatorId,
      pitId: parsed.data.pitId,
      stockpileId: parsed.data.stockpileId,
      material: parsed.data.material,
      jumlahRit: parsed.data.jumlahRit,
      jarakKm,
      grossKg: parsed.data.grossKg,
      tareKg: parsed.data.tareKg,
      nettoTon: hasTimbangan ? ((parsed.data.grossKg! - parsed.data.tareKg!) / 1000) * parsed.data.jumlahRit : null,
      estimasiTon: !hasTimbangan && kapasitasTon != null ? kapasitasTon * parsed.data.jumlahRit : null,
      statusTimbangan: hasTimbangan ? 'imported' : 'manual',
      catatan: parsed.data.catatan,
    },
    include: { shift: true, unit: true, operator: true, pit: true, stockpile: true },
  });

  res.status(201);
  sendData(res, newRit);
});

ritsRouter.post('/import', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [];
  if (!items.length) return sendValidationError(res, { issues: [{ path: [], message: 'Request harus array data rit.' }] } as any);

  const created: any[] = [];

  for (const item of items) {
    try {
      const parsed = createSchema.parse(item);
      const shift = await prisma.shift.findUnique({
        where: { id: parsed.shiftId },
        include: { branch: true },
      });
      if (!shift) continue;

      const unit = await prisma.unit.findUnique({
        where: { id: parsed.unitId },
        include: { tipe: true },
      });
      if (!unit || unit.branchId !== shift.branchId || !unit.aktif) continue;

      // generate noRit for this item (max-based; item sebelumnya sudah persist)
      const branchCode = shift.branch.kode.replace(/\s+/g, '-');
      const datePart = shift.tanggal.replace(/-/g, '');
      const noRit = await nextRitNo(shift.branchId, shift.tanggal, branchCode, datePart);

      const hasTimbangan = Boolean(parsed.grossKg && parsed.tareKg);
      const jarakKm = await resolveJarakKm(parsed.pitId, parsed.stockpileId, parsed.jarakKm);
      const kapasitasTon = unit.tipe?.kapasitasTon;
      const newRit = await prisma.rit.create({
        data: {
          noRit,
          shiftId: parsed.shiftId,
          unitId: parsed.unitId,
          operatorId: parsed.operatorId,
          pitId: parsed.pitId,
          stockpileId: parsed.stockpileId,
          material: parsed.material,
          jumlahRit: parsed.jumlahRit,
          jarakKm,
          grossKg: parsed.grossKg,
          tareKg: parsed.tareKg,
          nettoTon: hasTimbangan ? ((parsed.grossKg! - parsed.tareKg!) / 1000) * parsed.jumlahRit : null,
          estimasiTon: !hasTimbangan && kapasitasTon != null ? kapasitasTon * parsed.jumlahRit : null,
          statusTimbangan: hasTimbangan ? 'imported' : 'manual',
          catatan: parsed.catatan,
        },
        include: { shift: true, unit: true, operator: true, pit: true, stockpile: true },
      });

      created.push(newRit);
    } catch (e) {
      // skip invalid items
    }
  }

  sendData(res, created, { total: created.length });
});

ritsRouter.get('/grouped', async (req, res) => {
  const allRits = await prisma.rit.findMany({
    include: { shift: true },
    orderBy: { createdAt: 'desc' },
  });

  const groups: Record<string, any[]> = {};
  allRits.forEach((rit) => {
    const tanggal = rit.shift.tanggal;
    const key = `${tanggal}::${rit.unitId}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(rit);
  });

  const result = Object.entries(groups).map(([key, arr]) => {
    const [tanggal, unitId] = key.split('::');
    return { tanggal, unitId, rits: arr };
  });

  sendData(res, result, { total: result.length });
});

ritsRouter.put('/:id', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const rit = await prisma.rit.findUnique({
    where: { id: req.params.id },
    include: { shift: true, unit: true, operator: true, pit: true, stockpile: true },
  });
  if (!rit) return sendNotFound(res, 'Rit tidak ditemukan.');

  const updateData: any = { ...parsed.data };
  if (updateData.grossKg !== undefined && updateData.tareKg !== undefined) {
    updateData.nettoTon = (updateData.grossKg - updateData.tareKg) / 1000;
    updateData.statusTimbangan = 'imported';
  }

  const updatedRit = await prisma.rit.update({
    where: { id: req.params.id },
    data: updateData,
    include: { shift: true, unit: true, operator: true, pit: true, stockpile: true },
  });

  sendData(res, updatedRit);
});

ritsRouter.delete('/:id', requireRole('supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const rit = await prisma.rit.findUnique({ where: { id: req.params.id } });
  if (!rit) return sendNotFound(res, 'Rit tidak ditemukan.');

  await prisma.rit.delete({ where: { id: req.params.id } });
  sendData(res, { id: rit.id, noRit: rit.noRit, message: 'Rit dihapus.' });
});

const editRequestSchema = z.object({
  requestedBy: z.string().optional().default('user'),
  changes: z.record(z.any()).refine((o) => Object.keys(o).length > 0, {
    message: 'changes must have at least one field',
  }),
});

// Create edit request for a rit
ritsRouter.post('/:id/edit-request', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = editRequestSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const rit = await prisma.rit.findUnique({
    where: { id: req.params.id },
  });
  if (!rit) return sendNotFound(res, 'Rit tidak ditemukan.');

  // NOTE: EditRequest model in schema.prisma uses different field names,
  // we need to adjust the data to match the schema
  const editReq = await prisma.editRequest.create({
    data: {
      tipe: 'rit',
      recordId: rit.id,
      field: Object.keys(parsed.data.changes)[0] || 'unknown',
      nilaiLama: JSON.stringify(rit),
      nilaiBaru: JSON.stringify(parsed.data.changes),
      alasan: 'Edit request from user',
      dibuatById: req.user!.id,
      status: 'pending',
    },
  });

  res.status(201);
  sendData(res, editReq);
});
