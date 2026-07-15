import prisma from './prisma/client.js';
import { hashPassword } from './auth.util.js';

/**
 * Bootstrap first-run: memastikan ada 1 akun admin yang bisa login pada DB
 * production yang baru (setelah `prisma migrate deploy`, DB kosong).
 *
 * IDEMPOTEN: hanya bertindak bila belum ada user sama sekali. Begitu ada
 * minimal 1 user, fungsi ini no-op — aman dipanggil tiap startup/redeploy
 * tanpa menabrak data. Berbeda dari `prisma/seed.ts` (fixtures demo dev,
 * tidak idempotent) — ini hanya admin + 1 branch minimal.
 *
 * Kredensial dari env (disarankan diisi di production):
 *   ADMIN_USERNAME (default 'admin'), ADMIN_PASSWORD (default 'admin'),
 *   ADMIN_BRANCH_KODE (default 'HQ'), ADMIN_BRANCH_NAMA (default 'Kantor Pusat').
 */
export async function bootstrapAdmin(): Promise<void> {
  const userCount = await prisma.user.count();
  if (userCount > 0) return; // sudah ada user → jangan sentuh apa pun

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin';
  const branchKode = process.env.ADMIN_BRANCH_KODE || 'HQ';
  const branchNama = process.env.ADMIN_BRANCH_NAMA || 'Kantor Pusat';

  // Admin butuh konteks branch untuk sebagian besar operasi → pastikan ada 1.
  let branch = await prisma.branch.findFirst();
  if (!branch) {
    branch = await prisma.branch.create({
      data: { kode: branchKode, nama: branchNama, skemaTimbangan: 'WITH_TIMBANGAN', aktif: true },
    });
  }

  await prisma.user.create({
    data: {
      username,
      password: await hashPassword(password),
      nama: 'Administrator',
      role: 'admin-mining',
      branchId: branch.id,
      aktif: true,
    },
  });

  console.log(`[bootstrap] Akun admin '${username}' dibuat (branch: ${branch.nama}).`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn(
      "[bootstrap] ⚠ Password admin memakai default 'admin'. Segera ganti lewat Settings, " +
      'atau set env ADMIN_PASSWORD sebelum deploy.',
    );
  }
}
