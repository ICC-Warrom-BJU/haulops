import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendNotFound, sendValidationError } from './http.js';
import { requireRole } from './auth.middleware.js';
import prisma from './prisma/client.js';

export const approvalsRouter = Router();

// list approvals history and pending edit requests
const listQuery = z.object({ status: z.enum(['pending', 'approved', 'rejected']).optional() });

approvalsRouter.get('/', async (_req, res) => {
  const shiftApprovals = await prisma.shift.findMany({
    where: {
      status: { in: ['approved', 'rejected'] },
    },
    select: {
      id: true,
      status: true,
      approvedBy: true,
      closedBy: true,
      updatedAt: true,
    },
  });

  const requestApprovals = await prisma.editRequest.findMany({
    where: {
      status: { in: ['approved', 'rejected'] },
    },
    select: {
      id: true,
      status: true,
      reviewedById: true,
      reviewedAt: true,
      createdAt: true,
    },
  });

  const result = [
    ...shiftApprovals.map((shift) => ({
      type: 'shift',
      id: shift.id,
      status: shift.status,
      reviewedBy: shift.approvedBy ?? shift.closedBy ?? null,
      updatedAt: shift.updatedAt,
    })),
    ...requestApprovals.map((er) => ({
      type: 'edit-request',
      id: er.id,
      status: er.status,
      reviewedBy: er.reviewedById ?? null,
      updatedAt: er.reviewedAt ?? er.createdAt,
    })),
  ].sort((a, b) => b.updatedAt.toISOString().localeCompare(a.updatedAt.toISOString()));

  sendData(res, result, { total: result.length });
});

approvalsRouter.get('/edit-requests', async (req, res) => {
  const parsed = listQuery.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = {};
  if (parsed.data.status) where.status = parsed.data.status;

  const data = await prisma.editRequest.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });

  sendData(res, data, { total: data.length });
});

approvalsRouter.post('/edit-requests/:id/approve', requireRole('admin-mining', 'supervisor'), async (req, res) => {
  const er = await prisma.editRequest.findUnique({
    where: { id: req.params.id },
  });
  if (!er) return sendNotFound(res, 'Edit request tidak ditemukan.');
  if (er.status !== 'pending') return res.status(409).json({ error: { code: 'ER_NOT_PENDING', message: 'Edit request bukan berstatus pending.' } });

  // Only process if recordId is a rit
  if (er.tipe === 'rit') {
    const rit = await prisma.rit.findUnique({
      where: { id: er.recordId },
    });
    if (!rit) return sendNotFound(res, 'Rit terkait tidak ditemukan.');

    // Parse nilaiBaru as changes object and update rit
    let changes: any = {};
    try {
      changes = JSON.parse(er.nilaiBaru);
    } catch (e) {
      // If parsing fails, skip applying changes
    }

    if (Object.keys(changes).length > 0) {
      await prisma.rit.update({
        where: { id: er.recordId },
        data: {
          ...changes,
          updatedAt: new Date(),
        },
      });
    }
  }

  const updatedEr = await prisma.editRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'approved',
      reviewedAt: new Date(),
      reviewedById: req.user!.id,
    },
  });

  sendData(res, { editRequest: updatedEr });
});

const bulkApproveSchema = z.object({ shiftIds: z.array(z.string()).optional() });

approvalsRouter.post('/bulk-approve-shifts', requireRole('admin-mining', 'supervisor'), async (req, res) => {
  const parsed = bulkApproveSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = { status: 'pending' };
  if (parsed.data.shiftIds?.length) {
    where.id = { in: parsed.data.shiftIds };
  }

  // Capture ids BEFORE update; setelah update statusnya bukan 'pending' lagi.
  const targetShifts = await prisma.shift.findMany({
    where,
    select: { id: true },
  });

  await prisma.shift.updateMany({
    where,
    data: {
      status: 'approved',
      approvedById: req.user!.id,
      approvedAt: new Date(),
      updatedAt: new Date(),
    },
  });

  sendData(res, { approved: targetShifts.map((s) => s.id), total: targetShifts.length });
});

approvalsRouter.post('/bulk-reject-shifts', requireRole('admin-mining', 'supervisor'), async (req, res) => {
  const parsed = bulkApproveSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const where: any = { status: 'pending' };
  if (parsed.data.shiftIds?.length) {
    where.id = { in: parsed.data.shiftIds };
  }

  // Capture ids BEFORE update; setelah update statusnya bukan 'pending' lagi.
  const targetShifts = await prisma.shift.findMany({
    where,
    select: { id: true },
  });

  await prisma.shift.updateMany({
    where,
    data: {
      status: 'rejected',
      updatedAt: new Date(),
    },
  });

  sendData(res, { rejected: targetShifts.map((s) => s.id), total: targetShifts.length });
});

const rejectSchema = z.object({ reason: z.string().optional(), reviewedBy: z.string().optional().default('approver') });

approvalsRouter.post('/edit-requests/:id/reject', requireRole('admin-mining', 'supervisor'), async (req, res) => {
  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const er = await prisma.editRequest.findUnique({
    where: { id: req.params.id },
  });
  if (!er) return sendNotFound(res, 'Edit request tidak ditemukan.');
  if (er.status !== 'pending') return res.status(409).json({ error: { code: 'ER_NOT_PENDING', message: 'Edit request bukan berstatus pending.' } });

  const updatedEr = await prisma.editRequest.update({
    where: { id: req.params.id },
    data: {
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedById: req.user!.id,
      // We'll use "catatanReview" field for the reason
      catatanReview: parsed.data.reason,
    },
  });

  sendData(res, updatedEr);
});
