import request from 'supertest';
import { app } from './app.js';

describe('BBM routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;
  });

  it('creates a bbm log record', async () => {
    const response = await request(app)
      .post('/api/v1/bbm')
      .set('Authorization', `Bearer ${token}`)
      .send({
        shiftId: 'shift-20260607-pagi-kala',
        unitId: 'unit-001',
        operatorBbmId: 'op-001',
        liter: 120,
        odoKm: 47300,
        hm: 4300,
        jenis: 'solar',
      });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ unitId: 'unit-001', liter: 120 });
  });

  it('retrieves previous bbm for a unit', async () => {
    const response = await request(app)
      .get('/api/v1/bbm/previous/unit-001')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.unitId).toBe('unit-001');
  });

  it('retrieves bbm report data', async () => {
    const response = await request(app)
      .get('/api/v1/bbm/report')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});