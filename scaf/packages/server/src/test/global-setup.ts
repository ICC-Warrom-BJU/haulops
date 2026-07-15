import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../auth.util.js';

/**
 * Global setup untuk test suite: mereset database test dan mengisi fixtures
 * deterministik yang dirujuk oleh test (id tetap: `kala`, `unit-001..003`,
 * `op-001`, `mat-ob/ore`, `delay-rain`, `shift-20260607-pagi-kala`, dll).
 *
 * DATABASE_URL diarahkan ke DB test terpisah lewat vitest.config.ts sehingga
 * data dev tidak ikut terhapus. Dijalankan sekali sebelum seluruh test; test
 * berjalan sekuensial (fileParallelism: false) agar aman berbagi satu DB.
 */
const prisma = new PrismaClient();

const TABLES = [
  'ActualStatus', 'BBMLog', 'Maintenance', 'Delay', 'Rit', 'ShiftUnit', 'EditRequest', 'Approval', 'Shift',
  'Rate', 'BasisTargetProduksi', 'NettoEstimasi', 'BudgetMaterialTarget', 'TargetMaterialBulanan', 'TargetProduksiBranch', 'TargetRevenue',
  'TargetRevenueTipeUnit', 'BudgetRatioBbm', 'BudgetBreakdownUnit', 'PitStockpileDistance', 'DelayBudget', 'TargetAvailabilityBranch',
  'OperatorDailyStatus', 'OperatorStatusType', 'ModulePermission',
  'Unit', 'Operator', 'LokasiPit', 'LokasiStockpile', 'FuelStation', 'FuelType', 'ShiftType', 'DelayType', 'StatusOperation', 'Material', 'TipeUnit',
  'User', 'Branch',
];

export default async function setup() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${TABLES.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  );

  await prisma.branch.create({
    data: { id: 'kala', kode: 'KALA', nama: 'Kalimantan A', skemaTimbangan: 'WITH_TIMBANGAN', aktif: true },
  });

  const pw = await hashPassword('password');
  await prisma.user.createMany({
    data: [
      { username: 'admin', password: pw, nama: 'Admin Mining', role: 'admin-mining', branchId: 'kala', aktif: true },
      { username: 'supervisor', password: pw, nama: 'Supervisor Operasi', role: 'supervisor', branchId: 'kala', aktif: true },
      // op-001 dipakai sebagai operatorBbmId (kolom FK ke User) di test BBM.
      { id: 'op-001', username: 'petugas-bbm-001', password: pw, nama: 'Petugas BBM', role: 'operator', branchId: 'kala', aktif: true },
    ],
  });

  await prisma.tipeUnit.create({
    data: { id: 'dt30', kode: 'DT30', nama: 'Dump Truck 30T', kapasitasTon: 30, aktif: true },
  });

  await prisma.unit.createMany({
    data: [
      { id: 'unit-001', kode: 'DT-001', polisi: 'KT 8101 HA', tipeId: 'dt30', branchId: 'kala', status: 'ready', aktif: true },
      { id: 'unit-002', kode: 'DT-002', polisi: 'KT 8102 HA', tipeId: 'dt30', branchId: 'kala', status: 'ready', aktif: true },
      { id: 'unit-003', kode: 'DT-003', polisi: 'KT 8103 HA', tipeId: 'dt30', branchId: 'kala', status: 'ready', aktif: true },
    ],
  });

  await prisma.operator.createMany({
    data: [
      { id: 'operator-001', nama: 'Andi Saputra', nik: 'OP-KALA-001', branchId: 'kala', aktif: true },
      { id: 'operator-002', nama: 'Budi Hartono', nik: 'OP-KALA-002', branchId: 'kala', aktif: true },
    ],
  });

  await prisma.operatorStatusType.createMany({
    data: [
      { id: 'opstatus-ready', kode: 'READY', nama: 'Ready', urutan: 1, aktif: true },
      { id: 'opstatus-sakit', kode: 'SAKIT', nama: 'Sakit', urutan: 2, aktif: true },
    ],
  });

  await prisma.material.createMany({
    data: [
      { id: 'mat-ob', nama: 'Overburden', kode: 'OB', kategori: 'OB', aktif: true },
      { id: 'mat-ore', nama: 'Nickel Ore', kode: 'ORE', kategori: 'ORE', aktif: true },
    ],
  });

  await prisma.delayType.createMany({
    data: [
      { id: 'delay-rain', kode: 'RAIN', nama: 'Hujan', kategori: 'Cuaca', scope: 'FLEET', budgetMenit: 90, kenaPA: false, urutan: 1, aktif: true },
      { id: 'delay-breakdown', kode: 'BD', nama: 'Breakdown', kategori: 'Unit', scope: 'UNIT', budgetMenit: 120, kenaPA: true, urutan: 2, aktif: true },
    ],
  });

  await prisma.statusOperation.createMany({
    data: [
      { id: 'status-standby', kode: 'STANDBY', nama: 'Standby', aktif: true },
      { id: 'status-ready', kode: 'READY', nama: 'Ready', isPA: true, aktif: true },
    ],
  });

  await prisma.fuelStation.create({
    data: { id: 'fs-pool', nama: 'Pool Kalimantan A', kode: 'FS-POOL', branchId: 'kala', aktif: true },
  });

  await prisma.shift.create({
    data: {
      id: 'shift-20260607-pagi-kala',
      tanggal: '2026-06-07',
      tipe: 'pagi',
      jamMulai: '07:00',
      jamSelesai: '17:00',
      branchId: 'kala',
      status: 'open',
      ritase: 0,
      tonase: 0,
    },
  });

  await prisma.$disconnect();
}
