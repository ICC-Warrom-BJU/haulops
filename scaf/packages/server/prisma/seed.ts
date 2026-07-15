import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/auth.util.js';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  // Seed Branches
  const branches = await prisma.branch.createMany({
    data: [
      { kode: 'KALA', nama: 'Kalimantan A', skemaTimbangan: 'WITH_TIMBANGAN', aktif: true },
      { kode: 'KALB', nama: 'Kalimantan B', skemaTimbangan: 'WITHOUT_TIMBANGAN', aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${branches.count} branches`);

  const createdBranches = await prisma.branch.findMany();

  // Seed TipeUnit
  const tipeUnits = await prisma.tipeUnit.createMany({
    data: [
      { kode: 'DT30', nama: 'Dump Truck 30T', kapasitasTon: 30, aktif: true },
      { kode: 'DT45', nama: 'Dump Truck 45T', kapasitasTon: 45, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${tipeUnits.count} tipe units`);

  const createdTipeUnits = await prisma.tipeUnit.findMany();

  // Seed Units
  const units = await prisma.unit.createMany({
    data: [
      { kode: 'DT-001', polisi: 'KT 8101 HA', tipeId: createdTipeUnits[0].id, branchId: createdBranches[0].id, status: 'ready', aktif: true },
      { kode: 'DT-002', polisi: 'KT 8102 HA', tipeId: createdTipeUnits[0].id, branchId: createdBranches[0].id, status: 'ready', aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${units.count} units`);

  // Seed Operators
  const operators = await prisma.operator.createMany({
    data: [
      { nama: 'Andi Saputra', nik: 'OP-KALA-001', branchId: createdBranches[0].id, aktif: true },
      { nama: 'Budi Hartono', nik: 'OP-KALA-002', branchId: createdBranches[0].id, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${operators.count} operators`);

  // Seed Materials
  const materials = await prisma.material.createMany({
    data: [
      { nama: 'Overburden', kode: 'OB', kategori: 'OB', aktif: true },
      { nama: 'Nickel Ore', kode: 'ORE', kategori: 'ORE', aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${materials.count} materials`);

  const createdMaterials = await prisma.material.findMany();

  // Seed DelayTypes (id deterministik agar konsisten dengan referensi test & UI)
  const delayTypes = await prisma.delayType.createMany({
    data: [
      { id: 'delay-rain', kode: 'RAIN', nama: 'Hujan', kategori: 'Cuaca', scope: 'FLEET', budgetMenit: 90, kenaPA: false, urutan: 1, aktif: true },
      { id: 'delay-nodriver', kode: 'NODRIVER', nama: 'No Driver', kategori: 'Operasional', scope: 'UNIT', budgetMenit: 60, kenaPA: true, urutan: 2, aktif: true },
      { id: 'delay-breakdown', kode: 'BD', nama: 'Breakdown', kategori: 'Unit', scope: 'UNIT', budgetMenit: 120, kenaPA: true, urutan: 3, aktif: true },
      { id: 'delay-changeshift', kode: 'CS', nama: 'Change Shift', kategori: 'Operasional', scope: 'FLEET', budgetMenit: 30, kenaPA: false, urutan: 4, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${delayTypes.count} delay types`);

  // Seed Users
  const seedPw = await hashPassword('password');
  const users = await prisma.user.createMany({
    data: [
      { username: 'admin', password: seedPw, nama: 'Admin Mining', role: 'admin-mining', branchId: createdBranches[0].id, aktif: true },
      { username: 'supervisor', password: seedPw, nama: 'Supervisor Operasi', role: 'supervisor', branchId: createdBranches[0].id, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${users.count} users`);

  // Seed LokasiPit
  const lokasiPits = await prisma.lokasiPit.createMany({
    data: [
      { nama: 'Pit Utama', kodeArea: 'PIT-001', branchId: createdBranches[0].id, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${lokasiPits.count} lokasi pits`);

  // Seed LokasiStockpile
  const lokasiStockpiles = await prisma.lokasiStockpile.createMany({
    data: [
      { nama: 'Stockpile A', kode: 'SP-001', branchId: createdBranches[0].id, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${lokasiStockpiles.count} lokasi stockpiles`);

  // Seed matriks jarak Pit -> Stockpile (dipakai auto-isi jarak km di rit)
  const seedPit = await prisma.lokasiPit.findFirst({ where: { kodeArea: 'PIT-001' } });
  const seedStockpile = await prisma.lokasiStockpile.findFirst({ where: { kode: 'SP-001' } });
  if (seedPit && seedStockpile) {
    await prisma.pitStockpileDistance.upsert({
      where: { pitId_stockpileId: { pitId: seedPit.id, stockpileId: seedStockpile.id } },
      create: { pitId: seedPit.id, stockpileId: seedStockpile.id, jarakKm: 12.5 },
      update: {},
    });
    console.log('Seeded 1 pit-stockpile distance (Pit Utama -> Stockpile A = 12.5 km)');
  }

  // Seed Fuel Stations
  const fuelStations = await prisma.fuelStation.createMany({
    data: [
      { nama: 'Pool Kalimantan A', kode: 'FS-POOL-A', branchId: createdBranches[0].id, aktif: true },
      { nama: 'Pit A Fueling Station', kode: 'FS-PIT-A', branchId: createdBranches[0].id, aktif: true },
      { nama: 'Mobile Fuel Truck', kode: 'FS-MOBILE', branchId: createdBranches[0].id, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${fuelStations.count} fuel stations`);

  // Seed Fuel Types (jenis BBM)
  const fuelTypes = await prisma.fuelType.createMany({
    data: [
      { nama: 'Biosolar (B35)', kode: 'BIOSOLAR', aktif: true },
      { nama: 'Pertamina Dex', kode: 'DEX', aktif: true },
      { nama: 'Dexlite', kode: 'DEXLITE', aktif: true },
      { nama: 'Solar Industri', kode: 'SOLAR-IND', aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${fuelTypes.count} fuel types`);

  // Seed Shift Types (tipe shift)
  const shiftTypes = await prisma.shiftType.createMany({
    data: [
      { kode: 'pagi', nama: 'Shift Pagi', jamMulai: '07:00', jamSelesai: '17:00', aktif: true },
      { kode: 'malam', nama: 'Shift Malam', jamMulai: '19:00', jamSelesai: '07:00', aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${shiftTypes.count} shift types`);

  // Seed Operator Status Types (katalog kesiapan operator)
  const operatorStatusTypes = await prisma.operatorStatusType.createMany({
    data: [
      { kode: 'READY', nama: 'Ready', warna: '#2D6A3F', urutan: 1, aktif: true },
      { kode: 'SAKIT', nama: 'Sakit', warna: '#8F2A2E', urutan: 2, aktif: true },
      { kode: 'IZIN', nama: 'Izin', warna: '#8A5A0E', urutan: 3, aktif: true },
      { kode: 'CUTI', nama: 'Cuti', warna: '#3F5B7A', urutan: 4, aktif: true },
      { kode: 'ALPHA', nama: 'Alpha / Tanpa Keterangan', warna: '#8F2A2E', urutan: 5, aktif: true },
      { kode: 'TRAINING', nama: 'Training', warna: '#3F5B7A', urutan: 6, aktif: true },
      { kode: 'OFF', nama: 'Off / Libur Terjadwal', warna: '#83705C', urutan: 7, aktif: true },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${operatorStatusTypes.count} operator status types`);

  // Seed Module Permission (referensi/dokumentasi — bukan enforcement; mencerminkan
  // aturan requireRole() aktual di tiap route per 2026-07-07).
  const modulePermissions = await prisma.modulePermission.createMany({
    data: [
      { moduleKode: 'dashboard', moduleNama: 'Dashboard', rolesAllowed: [], deskripsi: 'Baca-saja, terbuka untuk semua role yang login.' },
      { moduleKode: 'shift', moduleNama: 'Shift', rolesAllowed: ['admin-mining', 'supervisor', 'general-admin'], deskripsi: 'Approve/Reject shift hanya Admin Mining & Supervisor (General Admin tidak termasuk).' },
      { moduleKode: 'operator-status', moduleNama: 'Status Operator', rolesAllowed: ['admin-mining', 'supervisor', 'general-admin', 'koordinator-operator'] },
      { moduleKode: 'rit', moduleNama: 'Rit Operation', rolesAllowed: ['operator', 'supervisor', 'admin-mining', 'general-admin'], deskripsi: 'Hapus rit tidak termasuk Operator.' },
      { moduleKode: 'delay', moduleNama: 'Delay', rolesAllowed: ['operator', 'supervisor', 'admin-mining', 'general-admin'], deskripsi: 'Hapus delay tidak termasuk Operator.' },
      { moduleKode: 'maintenance', moduleNama: 'Maintenance', rolesAllowed: ['operator', 'supervisor', 'admin-mining', 'general-admin'], deskripsi: 'Hapus record tidak termasuk Operator.' },
      { moduleKode: 'bbm', moduleNama: 'BBM', rolesAllowed: ['operator', 'supervisor', 'admin-mining', 'general-admin'], deskripsi: 'Hapus record tidak termasuk Operator.' },
      { moduleKode: 'approval', moduleNama: 'Approval', rolesAllowed: ['admin-mining', 'supervisor'], deskripsi: 'General Admin & role lain tidak termasuk.' },
      { moduleKode: 'reports', moduleNama: 'Laporan', rolesAllowed: [], deskripsi: 'Baca-saja, terbuka untuk semua role yang login.' },
      { moduleKode: 'master', moduleNama: 'Master Data', rolesAllowed: ['admin-mining', 'general-admin'], deskripsi: 'Supervisor tidak bisa mengubah master data (termasuk User & Permission ini).' },
      { moduleKode: 'settings', moduleNama: 'Settings', rolesAllowed: [], deskripsi: 'Setiap user hanya bisa mengubah profil/password/avatar miliknya sendiri.' },
    ],
    skipDuplicates: true,
  });
  console.log(`Seeded ${modulePermissions.count} module permissions`);

  console.log('Data seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
