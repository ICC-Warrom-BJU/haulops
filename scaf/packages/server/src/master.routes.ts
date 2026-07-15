import { Router } from 'express';
import { z } from 'zod';
import { sendData, sendValidationError, sendNotFound } from './http.js';
import { requireRole } from './auth.middleware.js';
import { hashPassword } from './auth.util.js';
import prisma from './prisma/client.js';

const querySchema = z.object({
  branchId: z.string().optional(),
  aktif: z
    .enum(['true', 'false'])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === 'true')),
});

const unitCreateSchema = z.object({
  kode: z.string().min(1),
  polisi: z.string().min(1),
  noRangka: z.string().optional(),
  noMesin: z.string().optional(),
  tahun: z.number().int().optional(),
  kapasitas: z.number().optional(),
  tipeId: z.string().min(1),
  branchId: z.string().min(1),
  status: z.enum(['ready', 'breakdown', 'pm']),
  aktif: z.boolean().optional().default(true),
});

const unitUpdateSchema = unitCreateSchema.partial();

const tipeUnitSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  kapasitasTon: z.number().min(1),
  aktif: z.boolean().optional().default(true),
});

const operatorCreateSchema = z.object({
  nama: z.string().min(1),
  nik: z.string().min(1),
  nid: z.string().optional(),
  telepon: z.string().optional(),
  sim: z.string().optional(),
  simJenis: z.string().optional(),
  simMasaBerlaku: z.coerce.date().optional(),
  kontakDaruratNama: z.string().optional(),
  kontakDaruratHubungan: z.string().optional(),
  kontakDaruratTelepon: z.string().optional(),
  branchId: z.string().min(1),
  aktif: z.boolean().optional().default(true),
});

const operatorUpdateSchema = operatorCreateSchema.partial();

const delayTypeCreateSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  kategori: z.string().min(1),
  budgetMenit: z.number().int().min(0),
  kenaPA: z.boolean().optional().default(true),
  urutan: z.number().int().min(0).optional().default(0),
  aktif: z.boolean().optional().default(true),
});

const rateCreateSchema = z.object({
  branchId: z.string().min(1),
  tipeUnitId: z.string().min(1),
  materialId: z.string().min(1),
  pitId: z.string().optional(),
  stockpileId: z.string().optional(),
  rateRpPerTon: z.number().min(0),
  berlakuDari: z.coerce.date(),
  berlakuSampai: z.coerce.date().optional(),
});

// Input dasar (versioned) untuk Target Produksi harian — lihat model
// BasisTargetProduksi. Di-scope per branch+tipeUnit+material, berlaku sejak
// berlakuDari (opsional berlakuSampai). Mengikuti pola Rate.
const basisTargetProduksiSchema = z.object({
  branchId: z.string().min(1),
  tipeUnitId: z.string().min(1),
  materialId: z.string().min(1),
  ewhPerUnitJam: z.number().min(0),
  jumlahUnitPlan: z.number().int().min(0),
  produktivitasTonPerJam: z.number().min(0),
  berlakuDari: z.coerce.date(),
  berlakuSampai: z.coerce.date().optional(),
});

const budgetTargetCreateSchema = z.object({
  tipeUnitId: z.string().min(1),
  materialId: z.string().min(1),
  bulan: z.string().regex(/^\d{2}$/),
  tahun: z.number().int().min(2000),
  targetTon: z.number().min(0),
  targetRitase: z.number().int().min(0).optional(),
});

export const masterRouter = Router();

masterRouter.get('/branches', async (req, res) => {
  const parsed = querySchema.pick({ aktif: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const data = await prisma.branch.findMany({
    where: {
      aktif: parsed.data.aktif,
    },
  });

  sendData(res, data, { total: data.length });
});

const branchCreateSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  skemaTimbangan: z.enum(['WITH_TIMBANGAN', 'WITHOUT_TIMBANGAN']).optional().default('WITH_TIMBANGAN'),
  aktif: z.boolean().optional().default(true),
});

masterRouter.post('/branches', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = branchCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.branch.findUnique({ where: { kode: parsed.data.kode } });
  if (existing) return res.status(409).json({ error: { code: 'KODE_TAKEN', message: 'Kode branch sudah dipakai.' } });
  const record = await prisma.branch.create({ data: { ...parsed.data } });
  sendData(res, record);
});

masterRouter.put('/branches/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = branchCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.branch.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Branch tidak ditemukan.');
  const record = await prisma.branch.update({ where: { id: req.params.id }, data: parsed.data });
  sendData(res, record);
});

masterRouter.get('/tipe-unit', async (_req, res) => {
  const data = await prisma.tipeUnit.findMany();
  sendData(res, data, { total: data.length });
});

masterRouter.get('/units', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const data = await prisma.unit.findMany({
    where: {
      branchId: parsed.data.branchId,
      aktif: parsed.data.aktif,
    },
    include: { tipe: true, branch: true },
  });

  sendData(res, data, { total: data.length });
});

masterRouter.get('/operators', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const data = await prisma.operator.findMany({
    where: {
      branchId: parsed.data.branchId,
      aktif: parsed.data.aktif,
    },
    include: { branch: true },
  });

  sendData(res, data, { total: data.length });
});

masterRouter.get('/materials', async (_req, res) => {
  const data = await prisma.material.findMany();
  sendData(res, data, { total: data.length });
});

masterRouter.get('/delay-types', async (_req, res) => {
  const data = await prisma.delayType.findMany();
  sendData(res, data, { total: data.length });
});

masterRouter.get('/status-operations', async (_req, res) => {
  const data = await prisma.statusOperation.findMany();
  sendData(res, data, { total: data.length });
});

masterRouter.get('/pits', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  
  const data = await prisma.lokasiPit.findMany({
    where: {
      branchId: parsed.data.branchId,
      aktif: parsed.data.aktif,
    },
  });

  sendData(res, data, { total: data.length });
});

masterRouter.get('/stockpiles', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  
  const data = await prisma.lokasiStockpile.findMany({
    where: {
      branchId: parsed.data.branchId,
      aktif: parsed.data.aktif,
    },
  });

  sendData(res, data, { total: data.length });
});

const fuelStationCreateSchema = z.object({
  nama: z.string().min(1),
  kode: z.string().optional(),
  branchId: z.string().optional(),
  aktif: z.boolean().optional().default(true),
});

masterRouter.get('/fuel-stations', async (req, res) => {
  const parsed = querySchema.safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const data = await prisma.fuelStation.findMany({
    where: { branchId: parsed.data.branchId, aktif: parsed.data.aktif },
    orderBy: { nama: 'asc' },
  });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/fuel-stations', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = fuelStationCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const record = await prisma.fuelStation.create({ data: { ...parsed.data } });
  sendData(res, record);
});

masterRouter.put('/fuel-stations/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = fuelStationCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const existing = await prisma.fuelStation.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Fuel station tidak ditemukan.');

  const record = await prisma.fuelStation.update({ where: { id: req.params.id }, data: parsed.data });
  sendData(res, record);
});

// ---- Material (create/update; GET sudah ada di atas) ----
const materialCreateSchema = z.object({
  nama: z.string().min(1),
  kode: z.string().min(1),
  kategori: z.string().optional(),
  satuan: z.string().optional().default('ton'),
  aktif: z.boolean().optional().default(true),
});

masterRouter.post('/materials', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = materialCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const record = await prisma.material.create({ data: { ...parsed.data } });
  sendData(res, record);
});

masterRouter.put('/materials/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = materialCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.material.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Material tidak ditemukan.');
  const record = await prisma.material.update({ where: { id: req.params.id }, data: parsed.data });
  sendData(res, record);
});

// ---- Fuel Type (jenis BBM: Biosolar, Pertamina Dex, Dexlite, dll) ----
const fuelTypeCreateSchema = z.object({
  nama: z.string().min(1),
  kode: z.string().optional(),
  aktif: z.boolean().optional().default(true),
});

masterRouter.get('/fuel-types', async (req, res) => {
  const parsed = querySchema.pick({ aktif: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const data = await prisma.fuelType.findMany({ where: { aktif: parsed.data.aktif }, orderBy: { nama: 'asc' } });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/fuel-types', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = fuelTypeCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const record = await prisma.fuelType.create({ data: { ...parsed.data } });
  sendData(res, record);
});

masterRouter.put('/fuel-types/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = fuelTypeCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.fuelType.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Fuel type tidak ditemukan.');
  const record = await prisma.fuelType.update({ where: { id: req.params.id }, data: parsed.data });
  sendData(res, record);
});

// ---- Shift Type (Tipe Shift: Pagi/Malam + jam) ----
const shiftTypeCreateSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  jamMulai: z.string().min(1),
  jamSelesai: z.string().min(1),
  aktif: z.boolean().optional().default(true),
});

masterRouter.get('/shift-types', async (req, res) => {
  const parsed = querySchema.pick({ aktif: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const data = await prisma.shiftType.findMany({ where: { aktif: parsed.data.aktif }, orderBy: { jamMulai: 'asc' } });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/shift-types', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = shiftTypeCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const record = await prisma.shiftType.create({ data: { ...parsed.data } });
  sendData(res, record);
});

masterRouter.put('/shift-types/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = shiftTypeCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.shiftType.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Shift type tidak ditemukan.');
  const record = await prisma.shiftType.update({ where: { id: req.params.id }, data: parsed.data });
  sendData(res, record);
});

// ---- Operator Status Type (katalog kesiapan operator: Ready/Sakit/Izin/dst) ----
const operatorStatusTypeCreateSchema = z.object({
  kode: z.string().min(1),
  nama: z.string().min(1),
  warna: z.string().optional(),
  urutan: z.number().int().optional().default(0),
  aktif: z.boolean().optional().default(true),
});

masterRouter.get('/operator-status-types', async (req, res) => {
  const parsed = querySchema.pick({ aktif: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const data = await prisma.operatorStatusType.findMany({ where: { aktif: parsed.data.aktif }, orderBy: { urutan: 'asc' } });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/operator-status-types', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = operatorStatusTypeCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const record = await prisma.operatorStatusType.create({ data: { ...parsed.data } });
  sendData(res, record);
});

masterRouter.put('/operator-status-types/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = operatorStatusTypeCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.operatorStatusType.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Status operator tidak ditemukan.');
  const record = await prisma.operatorStatusType.update({ where: { id: req.params.id }, data: parsed.data });
  sendData(res, record);
});

// ---- User (manajemen akun — tambah/edit/nonaktifkan/reset password) ----
// Tanpa DELETE keras: User direferensikan banyak relasi (shift closedBy/approvedBy,
// dll) — nonaktifkan via `aktif`, konsisten dengan pola master lain di seluruh app.
const userRoleEnum = z.enum(['admin-mining', 'supervisor', 'general-admin', 'operator', 'koordinator-operator']);
const userSelect = {
  id: true, username: true, nama: true, email: true, role: true, branchId: true,
  aktif: true, avatarUrl: true, lastLoginAt: true, createdAt: true, branch: true,
} as const;

const userCreateSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(6),
  nama: z.string().min(1),
  email: z.string().email().optional(),
  role: userRoleEnum,
  branchId: z.string().optional(),
  aktif: z.boolean().optional().default(true),
});

const userUpdateSchema = z.object({
  nama: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: userRoleEnum.optional(),
  branchId: z.string().optional(),
  aktif: z.boolean().optional(),
});

const userPasswordResetSchema = z.object({ newPassword: z.string().min(6) });

masterRouter.get('/users', async (req, res) => {
  const parsed = querySchema.pick({ branchId: true, aktif: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const data = await prisma.user.findMany({
    where: { branchId: parsed.data.branchId, aktif: parsed.data.aktif },
    select: userSelect,
    orderBy: { nama: 'asc' },
  });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/users', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = userCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.user.findUnique({ where: { username: parsed.data.username } });
  if (existing) return res.status(409).json({ error: { code: 'USERNAME_TAKEN', message: 'Username sudah dipakai.' } });
  const record = await prisma.user.create({ data: { ...parsed.data, password: await hashPassword(parsed.data.password) }, select: userSelect });
  sendData(res, record);
});

masterRouter.put('/users/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = userUpdateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'User tidak ditemukan.');
  const record = await prisma.user.update({ where: { id: req.params.id }, data: parsed.data, select: userSelect });
  sendData(res, record);
});

masterRouter.put('/users/:id/password', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = userPasswordResetSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'User tidak ditemukan.');
  await prisma.user.update({ where: { id: req.params.id }, data: { password: await hashPassword(parsed.data.newPassword) } });
  sendData(res, { message: 'Password berhasil direset.' });
});

// ---- Module Permission (referensi/dokumentasi modul x role — lihat komentar
// model ModulePermission di schema.prisma. Bukan mesin enforcement.) ----
const modulePermissionCreateSchema = z.object({
  moduleKode: z.string().min(1),
  moduleNama: z.string().min(1),
  deskripsi: z.string().optional(),
  rolesAllowed: z.array(z.string()).default([]),
  aktif: z.boolean().optional().default(true),
});

masterRouter.get('/module-permissions', async (_req, res) => {
  const data = await prisma.modulePermission.findMany({ orderBy: { moduleNama: 'asc' } });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/module-permissions', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = modulePermissionCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.modulePermission.findUnique({ where: { moduleKode: parsed.data.moduleKode } });
  if (existing) return res.status(409).json({ error: { code: 'MODULE_EXISTS', message: 'Kode modul sudah ada.' } });
  const record = await prisma.modulePermission.create({ data: { ...parsed.data } });
  sendData(res, record);
});

masterRouter.put('/module-permissions/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = modulePermissionCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const existing = await prisma.modulePermission.findUnique({ where: { id: req.params.id } });
  if (!existing) return sendNotFound(res, 'Permission modul tidak ditemukan.');
  const record = await prisma.modulePermission.update({ where: { id: req.params.id }, data: parsed.data });
  sendData(res, record);
});

// ---- DELETE untuk master inti (gagal 409 bila masih direferensikan) ----
const adminRoles = ['admin-mining', 'general-admin'] as const;
async function guardedDelete(res: any, deleteFn: () => Promise<unknown>, notFound: string, found: boolean) {
  if (!found) return sendNotFound(res, notFound);
  try {
    await deleteFn();
    sendData(res, { message: 'Data dihapus.' });
  } catch {
    res.status(409).json({ error: { code: 'IN_USE', message: 'Data tidak bisa dihapus karena masih dipakai di transaksi lain.' } });
  }
}

masterRouter.delete('/units/:id', requireRole(...adminRoles), async (req, res) => {
  const found = await prisma.unit.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.unit.delete({ where: { id: req.params.id } }), 'Unit tidak ditemukan.', !!found);
});

masterRouter.delete('/tipe-unit/:id', requireRole(...adminRoles), async (req, res) => {
  const found = await prisma.tipeUnit.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.tipeUnit.delete({ where: { id: req.params.id } }), 'Tipe unit tidak ditemukan.', !!found);
});

masterRouter.delete('/operators/:id', requireRole(...adminRoles), async (req, res) => {
  const found = await prisma.operator.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.operator.delete({ where: { id: req.params.id } }), 'Operator tidak ditemukan.', !!found);
});

// ---- Pit (create/update/delete) ----
const pitSchema = z.object({
  nama: z.string().min(1),
  kodeArea: z.string().optional(),
  branchId: z.string().optional(),
  materialDominan: z.string().optional(),
  jarakKeROM: z.number().optional(),
  aktif: z.boolean().optional().default(true),
});

masterRouter.post('/pits', requireRole(...adminRoles), async (req, res) => {
  const parsed = pitSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  sendData(res, await prisma.lokasiPit.create({ data: { ...parsed.data } }));
});

masterRouter.put('/pits/:id', requireRole(...adminRoles), async (req, res) => {
  const parsed = pitSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const found = await prisma.lokasiPit.findUnique({ where: { id: req.params.id } });
  if (!found) return sendNotFound(res, 'Pit tidak ditemukan.');
  sendData(res, await prisma.lokasiPit.update({ where: { id: req.params.id }, data: parsed.data }));
});

masterRouter.delete('/pits/:id', requireRole(...adminRoles), async (req, res) => {
  const found = await prisma.lokasiPit.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.lokasiPit.delete({ where: { id: req.params.id } }), 'Pit tidak ditemukan.', !!found);
});

// ---- Stockpile (create/update/delete) ----
const stockpileSchema = z.object({
  nama: z.string().min(1),
  kode: z.string().optional(),
  branchId: z.string().optional(),
  kapasitasTon: z.number().optional(),
  aktif: z.boolean().optional().default(true),
});

masterRouter.post('/stockpiles', requireRole(...adminRoles), async (req, res) => {
  const parsed = stockpileSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  sendData(res, await prisma.lokasiStockpile.create({ data: { ...parsed.data } }));
});

masterRouter.put('/stockpiles/:id', requireRole(...adminRoles), async (req, res) => {
  const parsed = stockpileSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const found = await prisma.lokasiStockpile.findUnique({ where: { id: req.params.id } });
  if (!found) return sendNotFound(res, 'Stockpile tidak ditemukan.');
  sendData(res, await prisma.lokasiStockpile.update({ where: { id: req.params.id }, data: parsed.data }));
});

masterRouter.delete('/stockpiles/:id', requireRole(...adminRoles), async (req, res) => {
  const found = await prisma.lokasiStockpile.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.lokasiStockpile.delete({ where: { id: req.params.id } }), 'Stockpile tidak ditemukan.', !!found);
});

// ---- Matriks Jarak Pit x Stockpile ----
const distanceSchema = z.object({
  pitId: z.string().min(1),
  stockpileId: z.string().min(1),
  jarakKm: z.number().min(0),
});

masterRouter.get('/pit-stockpile-distances', async (_req, res) => {
  const data = await prisma.pitStockpileDistance.findMany({
    include: { pit: true, stockpile: true },
    orderBy: { createdAt: 'desc' },
  });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/pit-stockpile-distances', requireRole(...adminRoles), async (req, res) => {
  const parsed = distanceSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  // Upsert per pasangan pit+stockpile.
  const record = await prisma.pitStockpileDistance.upsert({
    where: { pitId_stockpileId: { pitId: parsed.data.pitId, stockpileId: parsed.data.stockpileId } },
    create: { ...parsed.data },
    update: { jarakKm: parsed.data.jarakKm },
    include: { pit: true, stockpile: true },
  });
  sendData(res, record);
});

masterRouter.delete('/pit-stockpile-distances/:id', requireRole(...adminRoles), async (req, res) => {
  const found = await prisma.pitStockpileDistance.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.pitStockpileDistance.delete({ where: { id: req.params.id } }), 'Data jarak tidak ditemukan.', !!found);
});

// ---- Delay Budget per bulan + Generate (copy) ----
const delayBudgetSchema = z.object({
  delayTypeId: z.string().min(1),
  bulan: z.string().regex(/^\d{4}-\d{2}$/),
  budgetMenit: z.number().int().min(0),
});

masterRouter.get('/delay-budgets', async (req, res) => {
  const bulan = typeof req.query.bulan === 'string' ? req.query.bulan : undefined;
  const data = await prisma.delayBudget.findMany({
    where: bulan ? { bulan } : undefined,
    include: { delayType: true },
    orderBy: [{ bulan: 'desc' }],
  });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/delay-budgets', requireRole(...adminRoles), async (req, res) => {
  const parsed = delayBudgetSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const record = await prisma.delayBudget.upsert({
    where: { delayTypeId_bulan: { delayTypeId: parsed.data.delayTypeId, bulan: parsed.data.bulan } },
    create: { ...parsed.data },
    update: { budgetMenit: parsed.data.budgetMenit },
    include: { delayType: true },
  });
  sendData(res, record);
});

masterRouter.delete('/delay-budgets/:id', requireRole(...adminRoles), async (req, res) => {
  const found = await prisma.delayBudget.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.delayBudget.delete({ where: { id: req.params.id } }), 'Budget tidak ditemukan.', !!found);
});

// Generate: copy semua budget dari bulan sumber → bulan target (upsert).
masterRouter.post('/delay-budgets/generate', requireRole(...adminRoles), async (req, res) => {
  const schema = z.object({ fromBulan: z.string().regex(/^\d{4}-\d{2}$/), toBulan: z.string().regex(/^\d{4}-\d{2}$/) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  if (parsed.data.fromBulan === parsed.data.toBulan) {
    return res.status(400).json({ error: { code: 'SAME_MONTH', message: 'Bulan sumber dan target tidak boleh sama.' } });
  }

  const source = await prisma.delayBudget.findMany({ where: { bulan: parsed.data.fromBulan } });
  let copied = 0;
  for (const b of source) {
    await prisma.delayBudget.upsert({
      where: { delayTypeId_bulan: { delayTypeId: b.delayTypeId, bulan: parsed.data.toBulan } },
      create: { delayTypeId: b.delayTypeId, bulan: parsed.data.toBulan, budgetMenit: b.budgetMenit },
      update: { budgetMenit: b.budgetMenit },
    });
    copied += 1;
  }
  sendData(res, { from: parsed.data.fromBulan, to: parsed.data.toBulan, copied }, { total: copied });
});

masterRouter.get('/rates', async (req, res) => {
  const parsed = querySchema.pick({ branchId: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  
  const data = await prisma.rate.findMany({
    where: {
      branchId: parsed.data.branchId,
    },
    include: { tipeUnit: true, material: true, branch: true },
  });

  sendData(res, data, { total: data.length });
});

masterRouter.post('/rates', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = rateCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const record = await prisma.rate.create({
    data: {
      ...parsed.data,
    },
    include: { tipeUnit: true, material: true, branch: true },
  });

  sendData(res, record);
});

masterRouter.put('/rates/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = rateCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const found = await prisma.rate.findUnique({ where: { id: req.params.id } });
  if (!found) return sendNotFound(res, 'Rate tidak ditemukan.');
  const record = await prisma.rate.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { tipeUnit: true, material: true, branch: true },
  });
  sendData(res, record);
});

masterRouter.delete('/rates/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const found = await prisma.rate.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.rate.delete({ where: { id: req.params.id } }), 'Rate tidak ditemukan.', !!found);
});

// ---- Basis Target Produksi (input dasar versioned, bagian Budget & Target) ----
masterRouter.get('/basis-target-produksi', async (req, res) => {
  const parsed = querySchema.pick({ branchId: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const data = await prisma.basisTargetProduksi.findMany({
    where: { branchId: parsed.data.branchId },
    include: { tipeUnit: true, material: true, branch: true },
  });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/basis-target-produksi', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = basisTargetProduksiSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const record = await prisma.basisTargetProduksi.create({
    data: { ...parsed.data },
    include: { tipeUnit: true, material: true, branch: true },
  });
  sendData(res, record);
});

masterRouter.put('/basis-target-produksi/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = basisTargetProduksiSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  const found = await prisma.basisTargetProduksi.findUnique({ where: { id: req.params.id } });
  if (!found) return sendNotFound(res, 'Basis Target Produksi tidak ditemukan.');
  const record = await prisma.basisTargetProduksi.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { tipeUnit: true, material: true, branch: true },
  });
  sendData(res, record);
});

masterRouter.delete('/basis-target-produksi/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const found = await prisma.basisTargetProduksi.findUnique({ where: { id: req.params.id } });
  await guardedDelete(res, () => prisma.basisTargetProduksi.delete({ where: { id: req.params.id } }), 'Basis Target Produksi tidak ditemukan.', !!found);
});

masterRouter.get('/budget-material-targets', async (_req, res) => {
  const data = await prisma.budgetMaterialTarget.findMany({
    include: { tipeUnit: true, material: true },
  });
  sendData(res, data, { total: data.length });
});

masterRouter.get('/netto-estimasi', async (req, res) => {
  const parsed = querySchema.pick({ branchId: true }).safeParse(req.query);
  if (!parsed.success) return sendValidationError(res, parsed.error);
  
  const data = await prisma.nettoEstimasi.findMany({
    where: {
      branchId: parsed.data.branchId,
    },
    include: { tipeUnit: true, material: true, branch: true },
  });
  sendData(res, data, { total: data.length });
});

masterRouter.post('/budget-material-targets', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = budgetTargetCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const record = await prisma.budgetMaterialTarget.create({
    data: {
      ...parsed.data,
    },
    include: { tipeUnit: true, material: true },
  });

  sendData(res, record);
});

// ============ Master "Budget & Target" (bulanan) ============
// Semua parameter mengikuti pola sama: dimensi (unit/branch/tipeUnit/material) +
// bulan (01-12) + tahun. Faktori di bawah men-generate 4 endpoint per parameter:
//   GET   /path?bulan&tahun     -> daftar (filter bulan/tahun opsional)
//   POST  /path                 -> upsert per (dimensi + bulan + tahun)
//   DELETE/path/:id             -> hapus satu baris
//   POST  /path/generate        -> copy semua baris bulan sumber -> bulan target
const bulanField = z.string().regex(/^\d{2}$/);
const tahunField = z.coerce.number().int().min(2000);

function registerMonthlyMaster(cfg: {
  path: string;
  delegate: any;
  dims: string[];
  values: z.AnyZodObject;
  include?: any;
}) {
  const { path, delegate, dims, values, include } = cfg;
  const keyName = [...dims, 'bulan', 'tahun'].join('_');
  const dimShape = Object.fromEntries(dims.map((d) => [d, z.string().min(1)]));
  const bodySchema = z.object({ ...dimShape, bulan: bulanField, tahun: tahunField }).merge(values);
  const valueKeys = Object.keys(values.shape);

  masterRouter.get(path, async (req, res) => {
    const q = z.object({ bulan: bulanField.optional(), tahun: z.coerce.number().int().optional() }).safeParse(req.query);
    if (!q.success) return sendValidationError(res, q.error);
    const where: any = {};
    if (q.data.bulan) where.bulan = q.data.bulan;
    if (q.data.tahun) where.tahun = q.data.tahun;
    const data = await delegate.findMany({ where, ...(include ? { include } : {}) });
    sendData(res, data, { total: data.length });
  });

  masterRouter.post(path, requireRole(...adminRoles), async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return sendValidationError(res, parsed.error);
    const d: any = parsed.data;
    const keyVal: any = { bulan: d.bulan, tahun: d.tahun };
    dims.forEach((k) => (keyVal[k] = d[k]));
    const valueData: any = {};
    valueKeys.forEach((k) => { if (d[k] !== undefined) valueData[k] = d[k]; });
    const record = await delegate.upsert({
      where: { [keyName]: keyVal },
      create: { ...keyVal, ...valueData },
      update: valueData,
      ...(include ? { include } : {}),
    });
    sendData(res, record);
  });

  masterRouter.post(`${path}/generate`, requireRole(...adminRoles), async (req, res) => {
    const s = z.object({ fromBulan: bulanField, fromTahun: tahunField, toBulan: bulanField, toTahun: tahunField }).safeParse(req.body);
    if (!s.success) return sendValidationError(res, s.error);
    const { fromBulan, fromTahun, toBulan, toTahun } = s.data;
    if (fromBulan === toBulan && fromTahun === toTahun) {
      return res.status(400).json({ error: { code: 'SAME_MONTH', message: 'Bulan/tahun sumber dan target tidak boleh sama.' } });
    }
    const source = await delegate.findMany({ where: { bulan: fromBulan, tahun: fromTahun } });
    let copied = 0;
    for (const row of source) {
      const keyVal: any = { bulan: toBulan, tahun: toTahun };
      dims.forEach((k) => (keyVal[k] = row[k]));
      const valueData: any = {};
      valueKeys.forEach((k) => { if (row[k] !== undefined && row[k] !== null) valueData[k] = row[k]; });
      await delegate.upsert({ where: { [keyName]: keyVal }, create: { ...keyVal, ...valueData }, update: valueData });
      copied += 1;
    }
    sendData(res, { from: `${fromTahun}-${fromBulan}`, to: `${toTahun}-${toBulan}`, copied }, { total: copied });
  });

  masterRouter.delete(`${path}/:id`, requireRole(...adminRoles), async (req, res) => {
    const found = await delegate.findUnique({ where: { id: req.params.id } });
    await guardedDelete(res, () => delegate.delete({ where: { id: req.params.id } }), 'Data tidak ditemukan.', !!found);
  });
}

// #1 Budget Breakdown per Unit (jam/hari)
registerMonthlyMaster({ path: '/budget-breakdown-units', delegate: prisma.budgetBreakdownUnit, dims: ['unitId'],
  values: z.object({ budgetJamPerHari: z.number().min(0) }), include: { unit: true } });
// #2 Target Produksi Bulanan per Branch (ton)
registerMonthlyMaster({ path: '/target-produksi-branch', delegate: prisma.targetProduksiBranch, dims: ['branchId'],
  values: z.object({ targetTon: z.number().min(0) }), include: { branch: true } });
// #3 Budget Ratio BBM per Tipe Unit (L/km)
registerMonthlyMaster({ path: '/budget-ratio-bbm', delegate: prisma.budgetRatioBbm, dims: ['tipeUnitId'],
  values: z.object({ ratioLPerKm: z.number().min(0) }), include: { tipeUnit: true } });
// #4 Target Revenue Bulanan per Branch (Rp)
registerMonthlyMaster({ path: '/target-revenue', delegate: prisma.targetRevenue, dims: ['branchId'],
  values: z.object({ targetRp: z.number().min(0), keterangan: z.string().optional() }), include: { branch: true } });
// #5 Target Revenue Bulanan per Tipe Unit (Rp)
registerMonthlyMaster({ path: '/target-revenue-tipe-unit', delegate: prisma.targetRevenueTipeUnit, dims: ['tipeUnitId'],
  values: z.object({ targetRp: z.number().min(0) }), include: { tipeUnit: true } });
// #6 + #7 Target Ritase & Tonase Bulanan per Material (per branch)
registerMonthlyMaster({ path: '/target-material-bulanan', delegate: prisma.targetMaterialBulanan, dims: ['branchId', 'materialId'],
  values: z.object({ targetRitase: z.number().int().min(0).optional(), targetTon: z.number().min(0).optional() }), include: { branch: true, material: true } });
// #8 Target PA%/UA% per Branch (dibandingkan ke aktual di Dashboard Monitoring Harian)
registerMonthlyMaster({ path: '/target-availability-branch', delegate: prisma.targetAvailabilityBranch, dims: ['branchId'],
  values: z.object({ targetPaPct: z.number().min(0).max(100), targetUaPct: z.number().min(0).max(100) }), include: { branch: true } });

masterRouter.post('/units', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = unitCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const record = await prisma.unit.create({
    data: {
      ...parsed.data,
    },
    include: { tipe: true, branch: true },
  });

  sendData(res, record);
});

masterRouter.put('/units/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = unitUpdateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const unit = await prisma.unit.findUnique({
    where: { id: req.params.id },
  });

  if (!unit) {
    return sendNotFound(res, 'Unit tidak ditemukan.');
  }

  const updatedUnit = await prisma.unit.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { tipe: true, branch: true },
  });

  sendData(res, updatedUnit);
});

masterRouter.post('/tipe-unit', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = tipeUnitSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const record = await prisma.tipeUnit.create({
    data: {
      ...parsed.data,
    },
  });

  sendData(res, record);
});

masterRouter.put('/tipe-unit/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = tipeUnitSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const tipeUnit = await prisma.tipeUnit.findUnique({
    where: { id: req.params.id },
  });

  if (!tipeUnit) {
    return sendNotFound(res, 'Tipe unit tidak ditemukan.');
  }

  const updatedTipeUnit = await prisma.tipeUnit.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  sendData(res, updatedTipeUnit);
});

masterRouter.post('/operators', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = operatorCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const record = await prisma.operator.create({
    data: {
      ...parsed.data,
    },
    include: { branch: true },
  });

  sendData(res, record);
});

masterRouter.put('/operators/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = operatorUpdateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const operator = await prisma.operator.findUnique({
    where: { id: req.params.id },
  });

  if (!operator) {
    return sendNotFound(res, 'Operator tidak ditemukan.');
  }

  const updatedOperator = await prisma.operator.update({
    where: { id: req.params.id },
    data: parsed.data,
    include: { branch: true },
  });

  sendData(res, updatedOperator);
});

masterRouter.post('/delay-types', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = delayTypeCreateSchema.safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const record = await prisma.delayType.create({
    data: {
      ...parsed.data,
    },
  });

  sendData(res, record);
});

masterRouter.put('/delay-types/:id', requireRole('admin-mining', 'general-admin'), async (req, res) => {
  const parsed = delayTypeCreateSchema.partial().safeParse(req.body);
  if (!parsed.success) return sendValidationError(res, parsed.error);

  const delayType = await prisma.delayType.findUnique({
    where: { id: req.params.id },
  });

  if (!delayType) {
    return sendNotFound(res, 'Delay type tidak ditemukan.');
  }

  const updatedDelayType = await prisma.delayType.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  sendData(res, updatedDelayType);
});
