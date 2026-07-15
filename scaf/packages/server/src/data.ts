export type ShiftStatus = 'open' | 'pending' | 'approved' | 'rejected';

export type Branch = {
  id: string;
  kode: string;
  nama: string;
  skemaTimbangan: 'WITH_TIMBANGAN' | 'WITHOUT_TIMBANGAN';
  aktif: boolean;
};

export type Unit = {
  id: string;
  kode: string;
  polisi: string;
  tipeUnitId: string;
  tipeUnitNama: string;
  kapasitasTon: number;
  branchId: string;
  status: 'ready' | 'breakdown' | 'pm';
  aktif: boolean;
};

export type Operator = {
  id: string;
  nama: string;
  nik: string;
  branchId: string;
  aktif: boolean;
};

export type Material = {
  id: string;
  kode: string;
  nama: string;
  kategori: 'OB' | 'ORE' | 'WASTE';
};

export type UserRole = 'admin-mining' | 'supervisor' | 'general-admin' | 'operator' | 'koordinator-operator';

export type User = {
  id: string;
  username: string;
  password: string;
  nama: string;
  role: UserRole;
  branchId: string;
  lastLoginAt?: string;
};

export type NettoEstimasi = {
  id: string;
  tipeUnitId: string;
  materialId: string;
  estimasiTon: number;
};

export type ShiftUnit = {
  id: string;
  shiftId: string;
  unitId: string;
  operatorId: string;
  materialId: string;
  statusAwal: 'ready' | 'standby' | 'breakdown';
};

export type Shift = {
  id: string;
  tanggal: string;
  branchId: string;
  tipe: 'pagi' | 'malam';
  jamMulai: string;
  jamSelesai: string;
  status: ShiftStatus;
  ritase: number;
  tonase: number;
  createdBy: string;
  closedBy?: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
};

export const branches: Branch[] = [
  { id: 'br-kal-a', kode: 'KALA', nama: 'Kalimantan A', skemaTimbangan: 'WITH_TIMBANGAN', aktif: true },
  { id: 'br-kal-b', kode: 'KALB', nama: 'Kalimantan B', skemaTimbangan: 'WITHOUT_TIMBANGAN', aktif: true },
  { id: 'br-sulteng', kode: 'STG', nama: 'Sulawesi Tengah', skemaTimbangan: 'WITH_TIMBANGAN', aktif: true },
];

export const tipeUnits = [
  { id: 'tu-dt-30', kode: 'DT30', nama: 'Dump Truck 30T', kapasitasTon: 30, aktif: true },
  { id: 'tu-dt-45', kode: 'DT45', nama: 'Dump Truck 45T', kapasitasTon: 45, aktif: true },
];

export const units: Unit[] = [
  { id: 'unit-001', kode: 'DT-001', polisi: 'KT 8101 HA', tipeUnitId: 'tu-dt-30', tipeUnitNama: 'Dump Truck 30T', kapasitasTon: 30, branchId: 'br-kal-a', status: 'ready', aktif: true },
  { id: 'unit-002', kode: 'DT-002', polisi: 'KT 8102 HA', tipeUnitId: 'tu-dt-30', tipeUnitNama: 'Dump Truck 30T', kapasitasTon: 30, branchId: 'br-kal-a', status: 'ready', aktif: true },
  { id: 'unit-003', kode: 'DT-003', polisi: 'KT 8103 HA', tipeUnitId: 'tu-dt-45', tipeUnitNama: 'Dump Truck 45T', kapasitasTon: 45, branchId: 'br-kal-a', status: 'breakdown', aktif: true },
  { id: 'unit-004', kode: 'DT-004', polisi: 'KT 8104 HA', tipeUnitId: 'tu-dt-45', tipeUnitNama: 'Dump Truck 45T', kapasitasTon: 45, branchId: 'br-kal-a', status: 'ready', aktif: true },
  { id: 'unit-005', kode: 'DT-101', polisi: 'KT 9101 HB', tipeUnitId: 'tu-dt-30', tipeUnitNama: 'Dump Truck 30T', kapasitasTon: 30, branchId: 'br-kal-b', status: 'pm', aktif: true },
  { id: 'unit-006', kode: 'DT-201', polisi: 'DN 7201 ST', tipeUnitId: 'tu-dt-45', tipeUnitNama: 'Dump Truck 45T', kapasitasTon: 45, branchId: 'br-sulteng', status: 'ready', aktif: true },
];

export const operators: Operator[] = [
  { id: 'op-001', nama: 'Andi Saputra', nik: 'OP-KALA-001', branchId: 'br-kal-a', aktif: true },
  { id: 'op-002', nama: 'Budi Hartono', nik: 'OP-KALA-002', branchId: 'br-kal-a', aktif: true },
  { id: 'op-003', nama: 'Chandra Wijaya', nik: 'OP-KALA-003', branchId: 'br-kal-a', aktif: true },
  { id: 'op-004', nama: 'Dedi Pratama', nik: 'OP-KALB-001', branchId: 'br-kal-b', aktif: true },
  { id: 'op-005', nama: 'Eko Lestari', nik: 'OP-STG-001', branchId: 'br-sulteng', aktif: true },
];

export const materials: Material[] = [
  { id: 'mat-ob', kode: 'OB', nama: 'Overburden', kategori: 'OB' },
  { id: 'mat-ore', kode: 'ORE', nama: 'Nickel Ore', kategori: 'ORE' },
  { id: 'mat-waste', kode: 'WST', nama: 'Waste', kategori: 'WASTE' },
];

export const users: User[] = [
  { id: 'user-admin', username: 'admin', password: 'password', nama: 'Admin Mining', role: 'admin-mining', branchId: 'br-kal-a', lastLoginAt: new Date().toISOString() },
  { id: 'user-supervisor', username: 'supervisor', password: 'password', nama: 'Supervisor Operasi', role: 'supervisor', branchId: 'br-kal-a' },
];

export const nettoEstimasi: NettoEstimasi[] = [
  { id: 'netto-tu-30-mat-ore', tipeUnitId: 'tu-dt-30', materialId: 'mat-ore', estimasiTon: 24 },
  { id: 'netto-tu-45-mat-ore', tipeUnitId: 'tu-dt-45', materialId: 'mat-ore', estimasiTon: 36 },
  { id: 'netto-tu-30-mat-ob', tipeUnitId: 'tu-dt-30', materialId: 'mat-ob', estimasiTon: 22 },
  { id: 'netto-tu-45-mat-ob', tipeUnitId: 'tu-dt-45', materialId: 'mat-ob', estimasiTon: 33 },
];

export const delayTypes = [
  { id: 'delay-rain', kode: 'RAIN', nama: 'Rain', kategori: 'Weather', budgetMenit: 120, kenaPA: true, urutan: 1, aktif: true },
  { id: 'delay-driver', kode: 'NO_DRIVER', nama: 'No Driver', kategori: 'Manpower', budgetMenit: 60, kenaPA: true, urutan: 2, aktif: true },
  { id: 'delay-shift', kode: 'CHANGE_SHIFT', nama: 'Change Shift', kategori: 'Operation', budgetMenit: 30, kenaPA: true, urutan: 3, aktif: true },
  { id: 'delay-p5m', kode: 'P5M_P2H', nama: 'P5M, P2H, Perbaikan LP', kategori: 'Operation', budgetMenit: 45, kenaPA: true, urutan: 4, aktif: true },
];

export const statusOperations = [
  { id: 'status-ready', kode: 'READY', nama: 'Ready', aktif: true },
  { id: 'status-breakdown', kode: 'BREAKDOWN', nama: 'Breakdown', aktif: true },
  { id: 'status-pm', kode: 'PM', nama: 'Preventive Maintenance', aktif: true },
  { id: 'status-standby', kode: 'STANDBY', nama: 'Standby', aktif: true },
];

type Pit = {
  id: string;
  kode: string;
  nama: string;
  branchId: string;
  aktif: boolean;
};

export type Stockpile = {
  id: string;
  kode: string;
  nama: string;
  branchId: string;
  aktif: boolean;
};

export type Rate = {
  id: string;
  materialId: string;
  rateTon: number;
  active: boolean;
};

export type BudgetMaterialTarget = {
  id: string;
  materialId: string;
  targetTon: number;
  bulan: string;
  branchId: string;
};

export const pits: Pit[] = [
  { id: 'pit-001', kode: 'PIT-01', nama: 'Pit Utama', branchId: 'br-kal-a', aktif: true },
  { id: 'pit-002', kode: 'PIT-02', nama: 'Pit Cadangan', branchId: 'br-kal-b', aktif: true },
];

export const stockpiles: Stockpile[] = [
  { id: 'sp-001', kode: 'SP-01', nama: 'Stockpile A', branchId: 'br-kal-a', aktif: true },
  { id: 'sp-002', kode: 'SP-02', nama: 'Stockpile B', branchId: 'br-kal-b', aktif: true },
];

export const rates: Rate[] = [
  { id: 'rate-ore', materialId: 'mat-ore', rateTon: 40000, active: true },
  { id: 'rate-ob', materialId: 'mat-ob', rateTon: 12000, active: true },
];

export const budgetMaterialTargets: BudgetMaterialTarget[] = [
  { id: 'bmt-001', materialId: 'mat-ore', targetTon: 1500, bulan: '2026-06', branchId: 'br-kal-a' },
  { id: 'bmt-002', materialId: 'mat-ob', targetTon: 2500, bulan: '2026-06', branchId: 'br-kal-a' },
];

export const shifts: Shift[] = [
  {
    id: 'shift-20260607-pagi-kala',
    tanggal: '2026-06-07',
    branchId: 'br-kal-a',
    tipe: 'pagi',
    jamMulai: '07:00',
    jamSelesai: '17:00',
    status: 'open',
    ritase: 247,
    tonase: 4832,
    createdBy: 'user-supervisor',
    createdAt: '2026-06-07T00:00:00.000Z',
    updatedAt: '2026-06-07T04:32:00.000Z',
  },
  {
    id: 'shift-20260606-malam-kala',
    tanggal: '2026-06-06',
    branchId: 'br-kal-a',
    tipe: 'malam',
    jamMulai: '19:00',
    jamSelesai: '07:00',
    status: 'pending',
    ritase: 262,
    tonase: 5040,
    createdBy: 'user-admin-lap',
    closedBy: 'user-admin-lap',
    createdAt: '2026-06-06T11:00:00.000Z',
    updatedAt: '2026-06-07T00:20:00.000Z',
  },
  {
    id: 'shift-20260606-pagi-kala',
    tanggal: '2026-06-06',
    branchId: 'br-kal-a',
    tipe: 'pagi',
    jamMulai: '07:00',
    jamSelesai: '17:00',
    status: 'approved',
    ritase: 281,
    tonase: 5318,
    createdBy: 'user-admin-lap',
    closedBy: 'user-admin-lap',
    approvedBy: 'user-supervisor',
    createdAt: '2026-06-06T00:00:00.000Z',
    updatedAt: '2026-06-06T11:20:00.000Z',
  },
];

export const shiftUnits: ShiftUnit[] = [
  { id: 'su-001', shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-001', operatorId: 'op-001', materialId: 'mat-ore', statusAwal: 'ready' },
  { id: 'su-002', shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-002', operatorId: 'op-002', materialId: 'mat-ob', statusAwal: 'ready' },
  { id: 'su-003', shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-003', operatorId: 'op-003', materialId: 'mat-ore', statusAwal: 'breakdown' },
  { id: 'su-004', shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-004', operatorId: 'op-001', materialId: 'mat-ore', statusAwal: 'ready' },
];

export type Rit = {
  id: string;
  noRit: string;
  shiftId: string;
  unitId: string;
  operatorId?: string;
  material: string;
  jumlahRit: number;
  grossKg?: number;
  tareKg?: number;
  nettoTon?: number;
  statusTimbangan?: string;
  estimasiTon?: number;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
};

export const rits: Rit[] = [];

export type EditRequest = {
  id: string;
  ritId: string;
  requestedBy: string;
  changes: Record<string, any>;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewReason?: string;
};

export const editRequests: EditRequest[] = [];

export type Delay = {
  id: string;
  shiftId: string;
  unitId: string | null;
  delayTypeId: string;
  tanggal: string;
  jamMulai: string;
  jamSelesai: string;
  durasiMenit: number;
  catatan?: string;
  delayType?: { id: string; kode: string; nama: string; kategori: string; budgetMenit: number };
  createdAt: string;
  updatedAt: string;
};

export const delays: Delay[] = [];

export type Maintenance = {
  id: string;
  shiftId: string;
  unitId: string;
  operatorId: string | null;
  jenis: 'breakdown' | 'pm' | 'full-day';
  status: 'open' | 'closed';
  durasiMenit: number;
  catatan?: string;
  createdAt: string;
  updatedAt: string;
};

export const maintenances: Maintenance[] = [];

export type BBMLog = {
  id: string;
  shiftId: string;
  unitId: string;
  operatorBbmId: string;
  liter: number;
  odoKm?: number;
  hm?: number;
  jenis: string;
  createdAt: string;
  updatedAt: string;
};

export type ActualOperation = {
  id: string;
  unitId: string;
  tanggal: string;
  status: 'ready' | 'standby' | 'breakdown' | 'pm' | 'off';
  note?: string | null;
};

export const bbmLogs: BBMLog[] = [];
export const actualOperations: ActualOperation[] = [];
export const revokedTokens = new Set<string>();
