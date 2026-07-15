import request from 'supertest';
import { app } from './app.js';

async function loginToken() {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'admin', password: 'password' });
  return login.body.data.token;
}

describe('Dashboard routes', () => {
  it('returns KPI cards', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/api/v1/dashboard/kpi')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveProperty('totalBranches');
  });

  it('returns fleet status', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/api/v1/dashboard/fleet-status')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.fleet).toBeInstanceOf(Array);
  });
});
