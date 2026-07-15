import request from 'supertest';
import { app } from './app.js';

async function loginToken() {
  const login = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: 'admin', password: 'password' });
  return login.body.data.token;
}

describe('Shift routes', () => {
  it('returns shifts list', async () => {
    const token = await loginToken();
    const response = await request(app).get('/api/v1/shifts').set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('returns a shift detail', async () => {
    const token = await loginToken();
    const response = await request(app)
      .get('/api/v1/shifts/shift-20260607-pagi-kala')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe('shift-20260607-pagi-kala');
  });
});
