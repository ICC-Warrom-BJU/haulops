import { Router } from 'express';
import { z } from 'zod';
import { revokedTokens } from './data.js';
import { sendData, sendValidationError } from './http.js';
import { requireAuth } from './auth.middleware.js';
import { hashPassword, verifyPassword, signToken } from './auth.util.js';
import prisma from './prisma/client.js';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  nama: z.string().min(1),
  role: z.enum(['admin-mining', 'supervisor', 'general-admin', 'operator', 'koordinator-operator']),
  branchId: z.string().min(1),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});

// avatarUrl menyimpan "seed" (bukan URL gambar) yang dipakai untuk men-generate
// avatar Multiavatar secara deterministik di frontend — bukan file/upload.
const avatarSchema = z.object({
  avatarSeed: z.string().min(1).max(64),
});

export const authRouter = Router();

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const user = await prisma.user.findUnique({
    where: { username: parsed.data.username },
  });

  const match = user ? await verifyPassword(parsed.data.password, user.password) : { ok: false, legacy: false };
  if (!user || !match.ok || user.aktif === false) {
    return res.status(401).json({
      error: {
        code: 'AUTH_FAILED',
        message: 'Username atau password salah.',
      },
    });
  }

  // Upgrade transparan: password lama plaintext → hash bcrypt saat login sukses.
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date(), ...(match.legacy ? { password: await hashPassword(parsed.data.password) } : {}) },
  });

  const token = signToken(user.id);
  sendData(res, { token, user: { id: user.id, username: user.username, nama: user.nama, role: user.role, branchId: user.branchId, avatarUrl: user.avatarUrl } });
});

authRouter.post('/register', async (req, res) => {
  const userCount = await prisma.user.count();
  if (userCount > 0) {
    return res.status(403).json({ error: { code: 'REGISTER_NOT_ALLOWED', message: 'Registrasi hanya diperbolehkan saat belum ada user.' } });
  }

  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const user = await prisma.user.create({
    data: {
      ...parsed.data,
      password: await hashPassword(parsed.data.password),
      lastLoginAt: new Date(),
    },
  });

  sendData(res, { id: user.id, username: user.username, nama: user.nama, role: user.role, branchId: user.branchId });
});

authRouter.get('/me', requireAuth, (req, res) => {
  const user = req.user!;
  sendData(res, { id: user.id, username: user.username, nama: user.nama, role: user.role, branchId: user.branchId, lastLoginAt: user.lastLoginAt, avatarUrl: user.avatarUrl });
});

// Ganti avatar (seed Multiavatar) akun sendiri — dibuka untuk semua role,
// setiap user hanya bisa mengubah avatarnya sendiri (req.user.id, bukan param).
authRouter.put('/avatar', requireAuth, async (req, res) => {
  const user = req.user!;
  const parsed = avatarSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { avatarUrl: parsed.data.avatarSeed },
  });

  sendData(res, { avatarUrl: updated.avatarUrl });
});

authRouter.put('/password', requireAuth, async (req, res) => {
  const user = req.user!;
  const parsed = passwordSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const current = await verifyPassword(parsed.data.currentPassword, user.password ?? '');
  if (!current.ok) {
    return res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Password saat ini tidak cocok.' } });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await hashPassword(parsed.data.newPassword) },
  });

  sendData(res, { message: 'Password telah diperbarui.' });
});

authRouter.post('/logout', requireAuth, (req, res) => {
  const authHeader = req.headers.authorization!;
  const token = authHeader.slice(7);
  revokedTokens.add(token);
  sendData(res, { message: 'Logout berhasil. Token dicabut.' });
});
