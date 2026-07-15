import request from 'supertest';
import { app } from './app.js';

describe('Maintenance routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;
  });

  it('creates a maintenance record', async () => {
    const response = await request(app)
      .post('/api/v1/maintenance')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shiftId: 'shift-20260607-pagi-kala',
        unitId: 'unit-003',
        jenis: 'breakdown',
        status: 'open',
        durasiMenit: 60,
        catatan: 'Kerusakan unit',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ unitId: 'unit-003', status: 'open' });
  });

  it('lists open maintenance issues', async () => {
    const response = await request(app)
      .get('/api/v1/maintenance/issues')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('lists ready units', async () => {
    const response = await request(app)
      .get('/api/v1/maintenance/ready')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});