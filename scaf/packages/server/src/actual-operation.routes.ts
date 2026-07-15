import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

const querySchema = z.object({
  branchId: z.string().optional(),
  tanggalFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  tanggalTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  unitId: z.string().optional(),
});

const updateSchema = z.object({
  statusOpId: z.string(),
  catatan: z.string().optional(),
});

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

export const actualOperationRouter = Router();

actualOperationRouter.get('/', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const from = parsed.data.tanggalFrom ?? new Date().toISOString().slice(0, 10);
  const to = parsed.data.tanggalTo ?? new Date().toISOString().slice(0, 10);

  const units = await prisma.unit.findMany({
    where: {
      branchId: parsed.data.branchId ?? undefined,
      id: parsed.data.unitId ?? undefined,
    },
    include: {
      actualStatuses: {
        where: {
          tanggal: {
            gte: from,
            lte: to,
          },
        },
        include: {
          statusOp: true,
        },
      },
    },
  });

  const rows = units.map((unit) => {
    const cells = unit.actualStatuses.map((cell) => ({
      tanggal: cell.tanggal,
      status: cell.statusOp.kode,
      note: cell.catatan,
    }));
    return { unitId: unit.id, kode: unit.kode, branchId: unit.branchId, cells };
  });

  sendData(res, rows, { total: rows.length, from, to });
});

actualOperationRouter.put('/:unitId/:tanggal', requireRole('operator', 'supervisor', 'admin-mining', 'general-admin'), async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const unit = await prisma.unit.findUnique({
    where: { id: req.params.unitId },
  });
  if (!unit) return sendNotFound(res, 'Unit tidak ditemukan.');

  const tanggal = req.params.tanggal;
  const shift = await prisma.shift.findFirst({
    where: {
      tanggal,
      branchId: unit.branchId,
    },
  });
  if (!shift) return res.status(400).json({ error: { code: 'INVALID_DATE', message: 'Tidak ada shift pada tanggal ini untuk branch unit.' } });

  const cell = await prisma.actualStatus.upsert({
    where: {
      unitId_tanggal: {
        unitId: unit.id,
        tanggal,
      },
    },
    create: {
      unitId: unit.id,
      tanggal,
      statusOpId: parsed.data.statusOpId,
      catatan: parsed.data.catatan ?? null,
    },
    update: {
      statusOpId: parsed.data.statusOpId,
      catatan: parsed.data.catatan,
    },
    include: {
      statusOp: true,
    },
  });

  sendData(res, cell);
});

actualOperationRouter.get('/export', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const from = parsed.data.tanggalFrom ?? new Date().toISOString().slice(0, 10);
  const to = parsed.data.tanggalTo ?? new Date().toISOString().slice(0, 10);

  const units = await prisma.unit.findMany({
    where: {
      branchId: parsed.data.branchId ?? undefined,
      id: parsed.data.unitId ?? undefined,
    },
    include: {
      actualStatuses: {
        where: {
          tanggal: {
            gte: from,
            lte: to,
          },
        },
        include: {
          statusOp: true,
        },
      },
    },
  });

  const rows = units.flatMap((unit) =>
    unit.actualStatuses.map((cell) => [unit.id, unit.kode, unit.branchId, cell.tanggal, cell.statusOp.kode, cell.catatan]),
  );

  const csv = serializeCsv([
    ['unitId', 'kode', 'branchId', 'tanggal', 'status', 'note'],
    ...rows,
  ]);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="actual-operation.csv"');
  res.send(csv);
});
