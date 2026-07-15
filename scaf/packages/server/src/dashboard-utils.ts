// Helper murni (tanpa Prisma) untuk dashboard monitoring harian: konversi
// periode & durasi shift. Tidak digabung dengan frontend (shiftTersedia di
// App.tsx) karena web & server adalah TS project terpisah tanpa shared package.

// "MM" + tahun (Int) — format yang dipakai 6 model Budget & Target bulanan.
export function tanggalToBulanTahun(tanggal: string): { bulan: string; tahun: number } {
  const [y, m] = tanggal.split('-');
  return { bulan: m, tahun: Number(y) };
}

// "YYYY-MM" — format yang dipakai DelayBudget.bulan.
export function tanggalToDelayBudgetBulan(tanggal: string): string {
  return tanggal.slice(0, 7);
}

export function daysInMonth(tanggal: string): number {
  const { bulan, tahun } = tanggalToBulanTahun(tanggal);
  return new Date(tahun, Number(bulan), 0).getDate();
}

export function dayOfMonth(tanggal: string): number {
  return Number(tanggal.slice(8, 10));
}

// Pro-rata harian straight-line dari target bulanan.
export function proRate(monthlyTarget: number, tanggal: string): number {
  return monthlyTarget / daysInMonth(tanggal);
}

// Rentang awal-bulan s.d. tanggal (untuk filter Shift.tanggal — string
// "YYYY-MM-DD" zero-padded, lexicographic order = kronologis).
export function monthStartToDate(tanggal: string): { gte: string; lte: string } {
  return { gte: `${tanggal.slice(0, 7)}-01`, lte: tanggal };
}

// Durasi shift dalam jam, menangani shift yang lintas tengah malam (mis.
// malam 19:00-07:00). Cross-ref: App.tsx `shiftTersedia()` (versi tampilan
// string di frontend) — jaga logic wrap tetap sinkron bila diubah.
export function shiftDurationHours(jamMulai: string, jamSelesai: string): number {
  const [mh, mm] = jamMulai.split(':').map(Number);
  const [sh, sm] = jamSelesai.split(':').map(Number);
  if ([mh, mm, sh, sm].some((n) => Number.isNaN(n))) return 0;
  let mins = sh * 60 + sm - (mh * 60 + mm);
  if (mins <= 0) mins += 24 * 60;
  return mins / 60;
}

export type BudgetStatus = 'good' | 'warn' | 'bad';

// Ambang status untuk delay (semakin kecil semakin baik: actual/target).
export function delayStatus(actual: number, target: number): BudgetStatus {
  if (target <= 0) return actual > 0 ? 'bad' : 'good';
  const pct = (actual / target) * 100;
  if (pct <= 100) return 'good';
  if (pct <= 115) return 'warn';
  return 'bad';
}

// Ambang status untuk produksi/revenue (semakin besar semakin baik: actual/target).
export function targetStatus(actual: number, target: number | null): BudgetStatus {
  if (target == null || target <= 0) return 'good';
  const pct = (actual / target) * 100;
  if (pct >= 95) return 'good';
  if (pct >= 80) return 'warn';
  return 'bad';
}

// Status gabungan (dipakai untuk badge ringkasan): terburuk yang menang.
export function worstStatus(statuses: BudgetStatus[]): BudgetStatus {
  if (statuses.includes('bad')) return 'bad';
  if (statuses.includes('warn')) return 'warn';
  return 'good';
}
