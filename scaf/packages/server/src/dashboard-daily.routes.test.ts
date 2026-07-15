import request from 'supertest';
import { app } from './app.js';

describe('Dashboard daily routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;

    // Rit tanpa timbangan -> harus jatuh ke fallback estimasiTon (kapasitas dt30 = 30t).
    await request(app)
      .post('/api/v1/rits')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-001', material: 'OB', jumlahRit: 2 });

    // Delay UNIT-scope, kenaPA=true -> mengurangi PA.
    await request(app)
      .post('/api/v1/delays')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', delayTypeId: 'delay-breakdown', unitIds: ['unit-001'], durasiMenit: 30 });

    // Delay FLEET-scope, kenaPA=false -> hanya mengurangi UA.
    await request(app)
      .post('/api/v1/delays')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', delayTypeId: 'delay-rain', durasiMenit: 45 });
  });

  it('returns daily dashboard for a branch', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/daily')
      .query({ tanggal: '2026-06-07', branchId: 'kala' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(data.branch).toMatchObject({ id: 'kala', kode: 'KALA' });
    expect(data.pa.daily.pct).toBeGreaterThanOrEqual(0);
    expect(data.pa.daily.pct).toBeLessThanOrEqual(100);
    expect(data.ua.daily.pct).toBeGreaterThanOrEqual(0);

    const obRow = data.production.find((p: { kode: string }) => p.kode === 'OB');
    expect(obRow).toBeDefined();
    expect(obRow.daily.ritase).toBe(2);
    expect(obRow.daily.ton).toBeGreaterThan(0); // dari estimasiTon fallback

    // Tidak ada Rate di seed -> semua rit hari itu harus "unpriced".
    expect(data.revenue.daily.unpricedRitCount).toBeGreaterThan(0);

    const breakdownDelay = data.delay.find((d: { kode: string }) => d.kode === 'BD');
    expect(breakdownDelay.kenaPA).toBe(true);
    expect(breakdownDelay.daily.actualMin).toBe(30);

    const rainDelay = data.delay.find((d: { kode: string }) => d.kode === 'RAIN');
    expect(rainDelay.kenaPA).toBe(false);
    expect(rainDelay.daily.actualMin).toBe(45);
  });

  it('menampilkan targetPct null saat belum ada target, lalu terisi & status berubah setelah diset', async () => {
    const before = await request(app)
      .get('/api/v1/dashboard/daily')
      .query({ tanggal: '2026-06-07', branchId: 'kala' })
      .set('Authorization', `Bearer ${token}`);
    expect(before.body.data.pa.mtd.targetPct).toBeNull();
    expect(before.body.data.pa.status).toBe('good'); // tanpa target -> selalu 'good'

    const actualPaPct = before.body.data.pa.mtd.pct;
    await request(app)
      .post('/api/v1/master/target-availability-branch')
      .set('Authorization', `Bearer ${token}`)
      .send({ branchId: 'kala', bulan: '06', tahun: 2026, targetPaPct: Math.min(100, actualPaPct + 20), targetUaPct: 90 });

    const after = await request(app)
      .get('/api/v1/dashboard/daily')
      .query({ tanggal: '2026-06-07', branchId: 'kala' })
      .set('Authorization', `Bearer ${token}`);
    expect(after.body.data.pa.mtd.targetPct).toBe(Math.min(100, actualPaPct + 20));
    expect(after.body.data.pa.status).not.toBe('good'); // aktual < target -> warn/bad
  });

  it('requires branchId', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/daily')
      .query({ tanggal: '2026-06-07' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('returns 404 for unknown branch', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/daily')
      .query({ tanggal: '2026-06-07', branchId: 'does-not-exist' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it('returns one comparison row per active branch', async () => {
    const response = await request(app)
      .get('/api/v1/dashboard/daily-compare')
      .query({ tanggal: '2026-06-07' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    const kalaRow = response.body.data.find((r: { branchId: string }) => r.branchId === 'kala');
    expect(kalaRow).toBeDefined();
    expect(kalaRow.ritaseMtd).toBeGreaterThanOrEqual(2);
  });
});
