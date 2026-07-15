import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

export const operatorStatusRouter = Router();

const coordinatorRoles = ['admin-mining', 'supervisor', 'general-admin', 'koordinator-operator'] as const;

const dailyQuery = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  branchId: z.string().min(1),
});

// Daftar operator (aktif) di branch + status hari itu (null bila belum divalidasi),
// plus katalog status untuk dropdown grid harian di frontend.
operatorStatusRouter.get('/daily', async (req, res) => {
  const parsed = dailyQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { tanggal, branchId } = parsed.data;

  const [operators, statuses, statusTypes] = await Promise.all([
    prisma.operator.findMany({ where: { branchId, aktif: true }, orderBy: { nama: 'asc' } }),
    prisma.operatorDailyStatus.findMany({
      where: { tanggal, operator: { branchId } },
      include: { statusType: true },
    }),
    prisma.operatorStatusType.findMany({ where: { aktif: true }, orderBy: { urutan: 'asc' } }),
  ]);

  const statusByOperator = new Map(statuses.map((s) => [s.operatorId, s]));
  const rows = operators.map((op) => {
    const status = statusByOperator.get(op.id);
    return {
      operatorId: op.id,
      nama: op.nama,
      nik: op.nik,
      statusTypeId: status?.statusTypeId ?? null,
      statusKode: status?.statusType.kode ?? null,
      statusNama: status?.statusType.nama ?? null,
      catatan: status?.catatan ?? null,
    };
  });

  sendData(res, { tanggal, rows, statusTypes }, { total: rows.length });
});

const monthlyQuery = z.object({
  bulan: z.string().regex(/^\d{2}$/),
  tahun: z.coerce.number().int().min(2000),
  branchId: z.string().min(1),
});

// Matriks status 1 bulan penuh: baris = operator, kolom = tanggal (01..akhir bulan).
// Dipakai grid bulanan di frontend (satu halaman langsung terlihat 1 bulan).
operatorStatusRouter.get('/monthly', async (req, res) => {
  const parsed = monthlyQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { bulan, tahun, branchId } = parsed.data;

  const daysInMonth = new Date(tahun, Number(bulan), 0).getDate();
  const from = `${tahun}-${bulan}-01`;
  const to = `${tahun}-${bulan}-${String(daysInMonth).padStart(2, '0')}`;

  const [operators, statuses, statusTypes] = await Promise.all([
    prisma.operator.findMany({ where: { branchId, aktif: true }, orderBy: { nama: 'asc' } }),
    prisma.operatorDailyStatus.findMany({
      where: { tanggal: { gte: from, lte: to }, operator: { branchId } },
      include: { statusType: true },
    }),
    prisma.operatorStatusType.findMany({ where: { aktif: true }, orderBy: { urutan: 'asc' } }),
  ]);

  const byOperatorDay = new Map(statuses.map((s) => [`${s.operatorId}|${s.tanggal.slice(8, 10)}`, s]));
  const rows = operators.map((op) => {
    const days: Record<string, { statusTypeId: string; statusKode: string; statusNama: string; catatan: string | null } | null> = {};
    for (let d = 1; d <= daysInMonth; d += 1) {
      const dd = String(d).padStart(2, '0');
      const s = byOperatorDay.get(`${op.id}|${dd}`);
      days[dd] = s ? { statusTypeId: s.statusTypeId, statusKode: s.statusType.kode, statusNama: s.statusType.nama, catatan: s.catatan } : null;
    }
    return { operatorId: op.id, nama: op.nama, nik: op.nik, days };
  });

  sendData(res, { bulan, tahun, daysInMonth, rows, statusTypes }, { total: rows.length });
});

const bulkSetSchema = z.object({
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  entries: z
    .array(
      z.object({
        operatorId: z.string().min(1),
        statusTypeId: z.string().min(1),
        catatan: z.string().optional(),
      }),
    )
    .min(1),
});

// Set/ubah status banyak operator sekaligus untuk satu tanggal (grid harian "Simpan Semua").
operatorStatusRouter.post('/daily', requireRole(...coordinatorRoles), async (req, res) => {
  const parsed = bulkSetSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { tanggal, entries } = parsed.data;

  const results = [];
  for (const entry of entries) {
    const record = await prisma.operatorDailyStatus.upsert({
      where: { operatorId_tanggal: { operatorId: entry.operatorId, tanggal } },
      create: { operatorId: entry.operatorId, tanggal, statusTypeId: entry.statusTypeId, catatan: entry.catatan },
      update: { statusTypeId: entry.statusTypeId, catatan: entry.catatan },
    });
    results.push(record);
  }

  sendData(res, results, { total: results.length });
});

const generateSchema = z.object({
  branchId: z.string().min(1),
  fromTanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toTanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Salin status seluruh operator branch dari tanggal sumber -> tanggal target (upsert).
operatorStatusRouter.post('/daily/generate', requireRole(...coordinatorRoles), async (req, res) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { branchId, fromTanggal, toTanggal } = parsed.data;
  if (fromTanggal === toTanggal) {
    return res.status(400).json({ error: { code: 'SAME_DATE', message: 'Tanggal sumber dan target tidak boleh sama.' } });
  }

  const source = await prisma.operatorDailyStatus.findMany({
    where: { tanggal: fromTanggal, operator: { branchId } },
  });

  let copied = 0;
  for (const row of source) {
    await prisma.operatorDailyStatus.upsert({
      where: { operatorId_tanggal: { operatorId: row.operatorId, tanggal: toTanggal } },
      create: { operatorId: row.operatorId, tanggal: toTanggal, statusTypeId: row.statusTypeId, catatan: row.catatan },
      update: { statusTypeId: row.statusTypeId, catatan: row.catatan },
    });
    copied += 1;
  }

  sendData(res, { from: fromTanggal, to: toTanggal, copied }, { total: copied });
});

const historyQuery = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Riwayat status seorang operator dalam rentang tanggal (timeline).
operatorStatusRouter.get('/history/:operatorId', async (req, res) => {
  const parsed = historyQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const { from, to } = parsed.data;

  const operator = await prisma.operator.findUnique({ where: { id: req.params.operatorId } });
  if (!operator) return sendNotFound(res, 'Operator tidak ditemukan.');

  const history = await prisma.operatorDailyStatus.findMany({
    where: { operatorId: req.params.operatorId, tanggal: { gte: from, lte: to } },
    include: { statusType: true },
    orderBy: { tanggal: 'desc' },
  });

  sendData(res, { operator: { id: operator.id, nama: operator.nama, nik: operator.nik }, history }, { total: history.length });
});
