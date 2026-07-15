import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

const shiftQuerySchema = z.object({
  branchId: z.string().optional(),
  status: z.enum(['open', 'pending', 'approved', 'rejected']).optional(),
  // Tipe shift kini bebas (kode dari master ShiftType), bukan enum pagi/malam.
  tipe: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

const createShiftSchema = z.object({
  branchId: z.string().min(1),
  tanggal: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  // Kode tipe shift dari master ShiftType (mis. 'pagi', 'malam', atau kustom).
  tipe: z.string().min(1),
  unitIds: z.array(z.string()).optional().default([]),
  // Assignment per-unit (opsional): operator, material, dan status awal.
  // Jika diisi, dipakai menggantikan auto-assign berbasis unitIds.
  assignments: z
    .array(
      z.object({
        unitId: z.string().min(1),
        operatorId: z.string().optional(),
        material: z.string().optional(),
        statusAwal: z.string().optional(),
      }),
    )
    .optional(),
  createdBy: z.string().min(1).default('system'),
});

const closeShiftSchema = z.object({
  closedBy: z.string().min(1).default('system'),
});

export const shiftRouter = Router();

shiftRouter.get('/', async (req, res) => {
  const parsed = shiftQuerySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = {};
  if (parsed.data.branchId) where.branchId = parsed.data.branchId;
  if (parsed.data.status) where.status = parsed.data.status;
  if (parsed.data.tipe) where.tipe = parsed.data.tipe;
  if (parsed.data.dateFrom) where.tanggal = { gte: parsed.data.dateFrom };
  if (parsed.data.dateTo) where.tanggal = { ...where.tanggal, lte: parsed.data.dateTo };

  const data = await prisma.shift.findMany({
    where,
    include: { branch: true, units: { include: { unit: true, operator: true } } },
    orderBy: [{ tanggal: 'desc' }, { tipe: 'asc' }],
  });

  const enrichedData = data.map((shift) => enrichShift(shift));

  sendData(res, enrichedData, { total: enrichedData.length });
});

shiftRouter.get('/:id', async (req, res) => {
  const shift = await prisma.shift.findUnique({
    where: { id: req.params.id },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });
  if (!shift) return sendNotFound(res, 'Shift tidak ditemukan.');
  sendData(res, enrichShift(shift, true));
});

shiftRouter.get('/:id/units', async (req, res) => {
  const shift = await prisma.shift.findUnique({
    where: { id: req.params.id },
    include: { units: { include: { unit: true, operator: true } } },
  });
  if (!shift) return sendNotFound(res, 'Shift tidak ditemukan.');
  sendData(res, shift.units, { total: shift.units.length });
});

shiftRouter.post('/', requireRole('admin-mining', 'supervisor', 'general-admin'), async (req, res) => {
  const parsed = createShiftSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const branch = await prisma.branch.findUnique({
    where: { id: parsed.data.branchId },
  });
  if (!branch || !branch.aktif) {
    return res.status(400).json({
      error: { code: 'INVALID_BRANCH', message: 'Branch tidak valid atau tidak aktif.' },
    });
  }

  const activeShiftExists = await prisma.shift.findFirst({
    where: {
      branchId: parsed.data.branchId,
      tanggal: parsed.data.tanggal,
      tipe: parsed.data.tipe,
      status: 'open',
    },
  });
  if (activeShiftExists) {
    return res.status(409).json({
      error: {
        code: 'SHIFT_ALREADY_OPEN',
        message: 'Shift aktif untuk branch, tanggal, dan tipe shift ini sudah ada.',
      },
    });
  }

  const nextShiftId = `shift-${parsed.data.tanggal.replace(/-/g, '')}-${parsed.data.tipe}-${parsed.data.branchId}`;

  // Jam mulai/selesai diambil dari master ShiftType (kode = tipe). Fallback ke pola
  // lama pagi/malam bila tipe belum terdaftar di master (mis. data lama / test seed).
  const shiftType = await prisma.shiftType.findUnique({ where: { kode: parsed.data.tipe } });
  const jamMulai = shiftType?.jamMulai ?? (parsed.data.tipe === 'malam' ? '19:00' : '07:00');
  const jamSelesai = shiftType?.jamSelesai ?? (parsed.data.tipe === 'malam' ? '07:00' : '17:00');

  const nextShift = await prisma.shift.create({
    data: {
      id: nextShiftId,
      tanggal: parsed.data.tanggal,
      branchId: parsed.data.branchId,
      tipe: parsed.data.tipe,
      jamMulai,
      jamSelesai,
      status: 'open',
      ritase: 0,
      tonase: 0,
    },
    include: { branch: true },
  });

  // Sumber assignment: pakai `assignments` (per-unit) bila ada, else `unitIds` (auto).
  const assignments =
    parsed.data.assignments && parsed.data.assignments.length > 0
      ? parsed.data.assignments
      : parsed.data.unitIds.map((unitId) => ({ unitId, operatorId: undefined, material: undefined, statusAwal: undefined }));

  if (assignments.length > 0) {
    const targetIds = assignments.map((a) => a.unitId);
    const validUnits = await prisma.unit.findMany({
      where: { id: { in: targetIds }, branchId: parsed.data.branchId, aktif: true },
      include: { tipe: true },
    });
    const validById = new Map(validUnits.map((unit) => [unit.id, unit]));

    const materials = await prisma.material.findMany({ take: 5 });
    const firstOperator = await prisma.operator.findFirst({
      where: { branchId: parsed.data.branchId },
    });

    let i = 0;
    for (const assignment of assignments) {
      const unit = validById.get(assignment.unitId);
      if (!unit) continue;

      const operatorId = assignment.operatorId ?? firstOperator?.id;
      if (!operatorId) continue; // ShiftUnit butuh operator; lewati bila tak ada.

      await prisma.shiftUnit.create({
        data: {
          id: `su-${nextShift.id}-${unit.id}`,
          shiftId: nextShift.id,
          unitId: unit.id,
          operatorId,
          material: assignment.material ?? materials[i % Math.max(1, materials.length)]?.kode ?? null,
          statusAwal: assignment.statusAwal ?? (unit.status === 'breakdown' ? 'breakdown' : 'ready'),
        },
      });
      i += 1;
    }
  }

  const enrichedShift = await prisma.shift.findUnique({
    where: { id: nextShift.id },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });

  res.status(201);
  sendData(res, enrichShift(enrichedShift!, true));
});

shiftRouter.post('/:id/close', requireRole('admin-mining', 'supervisor', 'general-admin'), async (req, res) => {
  const parsed = closeShiftSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const shift = await prisma.shift.findUnique({
    where: { id: req.params.id },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });
  if (!shift) return sendNotFound(res, 'Shift tidak ditemukan.');
  if (shift.status !== 'open') {
    return res.status(409).json({
      error: { code: 'SHIFT_NOT_OPEN', message: 'Hanya shift berstatus open yang bisa ditutup.' },
    });
  }

  const updatedShift = await prisma.shift.update({
    where: { id: req.params.id },
    data: {
      status: 'pending',
      closedById: req.user?.id ?? null,
      closedAt: new Date(),
    },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });

  sendData(res, enrichShift(updatedShift, true), {
    warnings: [
      'Validasi UA/PA detail akan diaktifkan setelah modul rit, delay, dan maintenance tersambung.',
    ],
  });
});

shiftRouter.post('/:id/approve', requireRole('admin-mining', 'supervisor'), async (req, res) => {
  const shift = await prisma.shift.findUnique({
    where: { id: req.params.id },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });
  if (!shift) return sendNotFound(res, 'Shift tidak ditemukan.');
  if (shift.status !== 'pending') {
    return res.status(409).json({
      error: { code: 'SHIFT_NOT_PENDING', message: 'Hanya shift berstatus pending yang bisa di-approve.' },
    });
  }

  const updatedShift = await prisma.shift.update({
    where: { id: req.params.id },
    data: { status: 'approved', approvedById: req.user?.id ?? null, approvedAt: new Date() },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });

  sendData(res, enrichShift(updatedShift, true));
});

shiftRouter.post('/:id/reject', requireRole('admin-mining', 'supervisor'), async (req, res) => {
  const shift = await prisma.shift.findUnique({
    where: { id: req.params.id },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });
  if (!shift) return sendNotFound(res, 'Shift tidak ditemukan.');
  if (shift.status !== 'pending') {
    return res.status(409).json({
      error: { code: 'SHIFT_NOT_PENDING', message: 'Hanya shift berstatus pending yang bisa di-reject.' },
    });
  }

  const updatedShift = await prisma.shift.update({
    where: { id: req.params.id },
    data: { status: 'rejected' },
    include: { branch: true, units: { include: { unit: true, operator: true } } },
  });

  sendData(res, enrichShift(updatedShift, true));
});

const enrichShift = (shift: any, includeUnits = false) => {
  const assignedUnits = shift.units || [];

  return {
    ...shift,
    branch: shift.branch,
    unitAktif: assignedUnits.length,
    kpi: {
      ritase: shift.ritase,
      tonase: shift.tonase,
      pa: assignedUnits.length ? 87.5 : 0,
      ua: assignedUnits.length ? 74.2 : 0,
    },
    ...(includeUnits ? { units: assignedUnits } : {}),
  };
};
