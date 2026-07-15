import type { Request, Response, NextFunction } from 'express';
import { revokedTokens } from './data.js';
import prisma from './prisma/client.js';
import { verifyToken } from './auth.util.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      username: string;
      nama: string;
      role: string;
      branchId?: string | null;
      password?: string;
      lastLoginAt?: Date | null;
      avatarUrl?: string | null;
    };
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'AUTH_REQUIRED', message: 'Authorization header required.' },
    });
  }

  const token = authHeader.slice(7);

  // Token dicabut (logout) — cek sebelum verifikasi agar konsisten 401.
  if (revokedTokens.has(token)) {
    return res.status(401).json({
      error: { code: 'TOKEN_REVOKED', message: 'Token sudah dicabut. Silakan login kembali.' },
    });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({
      error: { code: 'AUTH_INVALID', message: 'Token tidak valid atau kadaluarsa. Silakan login kembali.' },
    });
  }

  prisma.user.findUnique({ where: { id: userId } }).then((user) => {
    // User valid & aktif; token untuk user yang dihapus/nonaktif ditolak 401.
    if (!user || user.aktif === false) {
      return res.status(401).json({
        error: { code: 'AUTH_INVALID', message: 'Sesi tidak valid. Silakan login kembali.' },
      });
    }
    req.user = user;
    next();
  }).catch((err) => {
    console.error(err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan internal.' },
    });
  });
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'AUTH_REQUIRED',
          message: 'Authorization header required.',
        },
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Akses ditolak untuk peran pengguna ini.',
        },
      });
    }

    next();
  };
}
