import request from 'supertest';
import { app } from './app.js';

describe('Analytic routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;

    // Input dasar (versioned) untuk kala + dt30 + OB, berlaku sejak awal Juni.
    // Produksi Plan harian turunannya = 10 × 2 × 3 = 60 ton.
    await request(app)
      .post('/api/v1/master/basis-target-produksi')
      .set('Authorization', `Bearer ${token}`)
      .send({
        branchId: 'kala', tipeUnitId: 'dt30', materialId: 'mat-ob',
        ewhPerUnitJam: 10, jumlahUnitPlan: 2, produktivitasTonPerJam: 3,
        berlakuDari: '2026-06-01',
      });

    // Rit untuk unit-001 -> aktualTon > 0 dan unit-001 masuk DT Beroperasi aktual.
    await request(app)
      .post('/api/v1/rits')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-001', material: 'OB', jumlahRit: 1 });
  });

  it('mengembalikan raw data harian sebulan penuh', async () => {
    const response = await request(app)
      .get('/api/v1/analytic/daily')
      .query({ branchId: 'kala', bulan: '06', tahun: 2026 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    const data = response.body.data;
    expect(data.branch).toMatchObject({ id: 'kala', kode: 'KALA' });
    expect(data.jumlahHari).toBe(30);
    expect(data.rows).toHaveLength(30);
  });

  it('menurunkan Produksi Plan dari basis versioned yang berlaku hari itu', async () => {
    const response = await request(app)
      .get('/api/v1/analytic/daily')
      .query({ branchId: 'kala', bulan: '06', tahun: 2026 })
      .set('Authorization', `Bearer ${token}`);

    const hari7 = response.body.data.rows.find((r: { tanggal: string }) => r.tanggal === '2026-06-07');
    expect(hari7.produksi.planTon).toBeCloseTo(60); // 10 × 2 × 3
    expect(hari7.dtBeroperasi.plan).toBe(2); // jumlahUnitPlan
    expect(hari7.produksi.aktualTon).toBeGreaterThan(0); // dari Rit unit-001
    expect(hari7.dtBeroperasi.aktual).toBeGreaterThanOrEqual(1); // unit-001 ber-rit, tanpa maintenance
    expect(hari7.availability.ewhJam).toBeGreaterThanOrEqual(0);

    const basisOb = hari7.basisTerpakai.find((b: { materialKode: string }) => b.materialKode === 'OB');
    expect(basisOb).toMatchObject({ jumlahUnitPlan: 2, ewhPerUnitJam: 10, produktivitasTonPerJam: 3 });
  });

  it('menandai noData saat ada target tapi tak ada shift (hari 1 Juni)', async () => {
    const response = await request(app)
      .get('/api/v1/analytic/daily')
      .query({ branchId: 'kala', bulan: '06', tahun: 2026 })
      .set('Authorization', `Bearer ${token}`);

    const hari1 = response.body.data.rows.find((r: { tanggal: string }) => r.tanggal === '2026-06-01');
    expect(hari1.produksi.planTon).toBeCloseTo(60); // basis berlaku sejak 2026-06-01
    expect(hari1.produksi.aktualTon).toBe(0);
    expect(hari1.noData).toBe(true);
  });

  it('requires branchId', async () => {
    const response = await request(app)
      .get('/api/v1/analytic/daily')
      .query({ bulan: '06', tahun: 2026 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('returns 404 for unknown branch', async () => {
    const response = await request(app)
      .get('/api/v1/analytic/daily')
      .query({ branchId: 'does-not-exist', bulan: '06', tahun: 2026 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
