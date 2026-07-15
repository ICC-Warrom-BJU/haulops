import request from 'supertest';
import { app } from './app.js';

describe('Auth routes', () => {
  it('logs in an existing user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBeTruthy();
    expect(response.body.data.user).toMatchObject({ username: 'admin', role: 'admin-mining' });
  });

  it('mengeluarkan token JWT (tiga segmen), bukan userId#timestamp', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });

    const token: string = response.body.data.token;
    expect(token.split('.')).toHaveLength(3); // header.payload.signature
    expect(token).not.toContain('#');
  });

  it('menolak token dengan tanda tangan tidak valid', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    const tampered = login.body.data.token.slice(0, -3) + 'xyz'; // rusak signature

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tampered}`);

    expect(response.status).toBe(401);
  });

  it('menolak login untuk user nonaktif', async () => {
    // Buat user lalu nonaktifkan, pastikan tidak bisa login.
    const admin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    const adminToken = admin.body.data.token;

    await request(app)
      .post('/api/v1/master/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username: 'nonaktif-user', password: 'rahasia123', nama: 'Nonaktif', role: 'operator', branchId: 'kala' });

    const list = await request(app).get('/api/v1/master/users').set('Authorization', `Bearer ${adminToken}`);
    const target = list.body.data.find((u: { username: string }) => u.username === 'nonaktif-user');
    await request(app)
      .put(`/api/v1/master/users/${target.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ aktif: false });

    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'nonaktif-user', password: 'rahasia123' });
    expect(login.status).toBe(401);
  });

  it('returns current user profile when token is valid', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });

    const token = login.body.data.token;
    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.username).toBe('admin');
    expect(response.body.data.role).toBe('admin-mining');
  });

  it('logs out and invalidates the token', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });

    const token = login.body.data.token;
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${token}`);

    expect(logout.status).toBe(200);

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });
});
