import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// ============================================================================
// Auth util — hashing password (bcrypt) & token JWT.
// Menggantikan password plaintext + token `userId#timestamp` yang lama.
// ============================================================================

const BCRYPT_ROUNDS = 10;
const BCRYPT_RE = /^\$2[aby]?\$/; // penanda string sudah berupa hash bcrypt

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

/**
 * Verifikasi password. Mendukung transisi dari data lama: bila `stored` masih
 * plaintext (bukan hash bcrypt), dibandingkan apa adanya dan ditandai `legacy`
 * agar pemanggil (login) bisa meng-upgrade-nya ke hash.
 */
export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<{ ok: boolean; legacy: boolean }> {
  if (BCRYPT_RE.test(stored)) {
    return { ok: await bcrypt.compare(plain, stored), legacy: false };
  }
  return { ok: plain === stored, legacy: true };
}

let warnedSecret = false;
function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (s && s.length >= 16) return s;
  if (!warnedSecret) {
    console.warn(
      '[auth] ⚠ JWT_SECRET belum diset / terlalu pendek — memakai secret dev yang TIDAK aman. ' +
      'Set JWT_SECRET (≥16 char) di production.',
    );
    warnedSecret = true;
  }
  return 'haulops-dev-insecure-secret-change-me';
}

const EXPIRES_IN = (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn'];

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, getJwtSecret(), { expiresIn: EXPIRES_IN });
}

/** Verifikasi JWT → kembalikan userId (`sub`), atau null bila invalid/kadaluarsa. */
export function verifyToken(token: string): string | null {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (typeof payload === 'object' && payload && typeof payload.sub === 'string') {
      return payload.sub;
    }
    return null;
  } catch {
    return null;
  }
}
