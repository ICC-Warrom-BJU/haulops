import request from 'supertest';
import { app } from './app.js';

describe('Actual Operation routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });

    token = login.body.data.token;
  });

  it('returns actual operation rows with default date range', async () => {
    const response = await request(app)
      .get('/api/v1/actual-operation')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.meta).toMatchObject({ total: expect.any(Number) });
  });

  it('updates actual operation status for a unit and date', async () => {
    const response = await request(app)
      .put('/api/v1/actual-operation/unit-001/2026-06-07')
      .set('Authorization', `Bearer ${token}`)
      .send({ statusOpId: 'status-standby', catatan: 'Test update' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ unitId: 'unit-001', tanggal: '2026-06-07', statusOpId: 'status-standby', catatan: 'Test update' });
  });

  it('returns export CSV response', async () => {
    const response = await request(app)
      .get('/api/v1/actual-operation/export')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.text).toContain('"unitId","kode","branchId","tanggal","status","note"');
  });
});