import request from 'supertest';
import { app } from './app.js';

describe('Delay routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;
  });

  it('lists delay entries', async () => {
    const response = await request(app)
      .get('/api/v1/delays')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('creates fleet-wide delay records', async () => {
    const response = await request(app)
      .post('/api/v1/delays')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shiftId: 'shift-20260607-pagi-kala',
        delayTypeId: 'delay-rain',
        unitIds: ['unit-001', 'unit-002'],
        durasiMenit: 45,
        catatan: 'Hujan lebat',
      });

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta.total).toBe(2);
  });

  it('returns delay summary', async () => {
    const response = await request(app)
      .get('/api/v1/delays/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta.total).toBeGreaterThan(0);
  });

  it('validates delay total for a unit and date', async () => {
    const response = await request(app)
      .get('/api/v1/delays/validation/unit-001/2026-06-07')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ unitId: 'unit-001', tanggal: '2026-06-07' });
    expect(typeof response.body.data.totalDelay).toBe('number');
  });
});