import request from 'supertest';
import { app } from './app.js';

describe('Laporan routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;
  });

  it('gets daily report data', async () => {
    const response = await request(app)
      .get('/api/v1/laporan/daily')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('totalTonase memasukkan estimasiTon (rit tanpa timbangan), bukan hanya nettoTon', async () => {
    // unit-001 -> tipe dt30 (kapasitas 30t). Rit tanpa gross/tare -> jatuh ke estimasiTon.
    await request(app)
      .post('/api/v1/rits')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-001', material: 'OB', jumlahRit: 1 });

    const response = await request(app)
      .get('/api/v1/laporan/daily')
      .query({ tanggal: '2026-06-07' })
      .set('Authorization', `Bearer ${token}`);

    const row = response.body.data.find((r: { shiftId: string }) => r.shiftId === 'shift-20260607-pagi-kala');
    expect(row.totalTonase).toBeGreaterThanOrEqual(30);
  });

  it('gets delay summary report', async () => {
    const response = await request(app)
      .get('/api/v1/laporan/delay-summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('gets bbm report data', async () => {
    const response = await request(app)
      .get('/api/v1/laporan/bbm')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('gets maintenance report data', async () => {
    const response = await request(app)
      .get('/api/v1/laporan/maintenance')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('gets monthly report data', async () => {
    const response = await request(app)
      .get('/api/v1/laporan/bulanan?bulan=2026-06')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('bulan', '2026-06');
  });

  it('exports laporan CSV for monthly report', async () => {
    const response = await request(app)
      .get('/api/v1/laporan/export?bulan=2026-06')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('"shiftId","tanggal","branchId","tipe","ritCount","totalTonase"');
  });
});