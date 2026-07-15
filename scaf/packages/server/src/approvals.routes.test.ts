import request from 'supertest';
import { app } from './app.js';

async function loginToken() {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'admin', password: 'password' });
  return login.body.data.token;
}

describe('Approvals routes', () => {
  it('lists approval history', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/api/v1/approvals')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('bulk approves pending shifts', async () => {
    const token = await loginToken();
    const response = await request(app)
      .post('/api/v1/approvals/bulk-approve-shifts')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBeGreaterThanOrEqual(0);
  });
});
