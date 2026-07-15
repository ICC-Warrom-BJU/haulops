import request from 'supertest';
import { app } from './app.js';

describe('Master routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;
  });

  it('lists units', async () => {
    const response = await request(app)
      .get('/api/v1/master/units')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  describe('Branch CRUD', () => {
    it('creates a new branch', async () => {
      const response = await request(app)
        .post('/api/v1/master/branches')
        .set('Authorization', `Bearer ${token}`)
        .send({ kode: 'TEST-BR', nama: 'Test Branch', skemaTimbangan: 'WITHOUT_TIMBANGAN' });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ kode: 'TEST-BR', skemaTimbangan: 'WITHOUT_TIMBANGAN' });
    });

    it('rejects duplicate kode', async () => {
      const response = await request(app)
        .post('/api/v1/master/branches')
        .set('Authorization', `Bearer ${token}`)
        .send({ kode: 'TEST-BR', nama: 'Duplikat' });

      expect(response.status).toBe(409);
    });

    it('updates a branch', async () => {
      const list = await request(app).get('/api/v1/master/branches').set('Authorization', `Bearer ${token}`);
      const target = list.body.data.find((b: any) => b.kode === 'TEST-BR');

      const response = await request(app)
        .put(`/api/v1/master/branches/${target.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ aktif: false });

      expect(response.status).toBe(200);
      expect(response.body.data.aktif).toBe(false);
    });
  });

  it('creates a new rate', async () => {
    const response = await request(app)
      .post('/api/v1/master/rates')
      .set('Authorization', `Bearer ${token}`)
      .send({ branchId: 'kala', tipeUnitId: 'dt30', materialId: 'mat-ore', rateRpPerTon: 45000, berlakuDari: '2026-06-01' });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ materialId: 'mat-ore', rateRpPerTon: 45000 });
  });

  describe('Basis Target Produksi (versioned)', () => {
    let createdId: string;

    it('creates a basis row', async () => {
      const response = await request(app)
        .post('/api/v1/master/basis-target-produksi')
        .set('Authorization', `Bearer ${token}`)
        .send({
          branchId: 'kala', tipeUnitId: 'dt30', materialId: 'mat-ore',
          ewhPerUnitJam: 12, jumlahUnitPlan: 5, produktivitasTonPerJam: 3.5,
          berlakuDari: '2026-09-01',
        });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ jumlahUnitPlan: 5, ewhPerUnitJam: 12 });
      createdId = response.body.data.id;
    });

    it('lists basis rows for a branch', async () => {
      const response = await request(app)
        .get('/api/v1/master/basis-target-produksi')
        .query({ branchId: 'kala' })
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.some((b: { id: string }) => b.id === createdId)).toBe(true);
    });

    it('updates a basis row', async () => {
      const response = await request(app)
        .put(`/api/v1/master/basis-target-produksi/${createdId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ produktivitasTonPerJam: 4.0 });

      expect(response.status).toBe(200);
      expect(response.body.data.produktivitasTonPerJam).toBe(4.0);
    });

    it('deletes a basis row', async () => {
      const response = await request(app)
        .delete(`/api/v1/master/basis-target-produksi/${createdId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
    });
  });

  it('creates a new budget material target', async () => {
    const response = await request(app)
      .post('/api/v1/master/budget-material-targets')
      .set('Authorization', `Bearer ${token}`)
      .send({ tipeUnitId: 'dt30', materialId: 'mat-ob', bulan: '07', tahun: 2026, targetTon: 2000 });

    expect(response.status).toBe(200);
    expect(response.body.data).toMatchObject({ bulan: '07', targetTon: 2000 });
  });

  describe('User management', () => {
    it('lists users without exposing password field', async () => {
      const response = await request(app)
        .get('/api/v1/master/users')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0]).not.toHaveProperty('password');
    });

    it('creates a new user', async () => {
      const response = await request(app)
        .post('/api/v1/master/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'koordinator-1', password: 'password', nama: 'Koordinator Satu', role: 'koordinator-operator', branchId: 'kala' });

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({ username: 'koordinator-1', role: 'koordinator-operator' });
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('rejects duplicate username', async () => {
      const response = await request(app)
        .post('/api/v1/master/users')
        .set('Authorization', `Bearer ${token}`)
        .send({ username: 'koordinator-1', password: 'password', nama: 'Duplikat', role: 'operator', branchId: 'kala' });

      expect(response.status).toBe(409);
    });

    it('updates a user (nonaktifkan)', async () => {
      const list = await request(app).get('/api/v1/master/users').set('Authorization', `Bearer ${token}`);
      const target = list.body.data.find((u: any) => u.username === 'koordinator-1');

      const response = await request(app)
        .put(`/api/v1/master/users/${target.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ aktif: false });

      expect(response.status).toBe(200);
      expect(response.body.data.aktif).toBe(false);
    });

    it('resets a user password', async () => {
      const list = await request(app).get('/api/v1/master/users').set('Authorization', `Bearer ${token}`);
      const target = list.body.data.find((u: any) => u.username === 'koordinator-1');

      const response = await request(app)
        .put(`/api/v1/master/users/${target.id}/password`)
        .set('Authorization', `Bearer ${token}`)
        .send({ newPassword: 'newpassword123' });

      expect(response.status).toBe(200);

      // Reaktifkan (test sebelumnya menonaktifkan) — user nonaktif tak boleh login.
      await request(app)
        .put(`/api/v1/master/users/${target.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ aktif: true });

      const login = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'koordinator-1', password: 'newpassword123' });
      expect(login.status).toBe(200);
    });
  });

  describe('Module Permission (referensi)', () => {
    it('creates a module permission row', async () => {
      const response = await request(app)
        .post('/api/v1/master/module-permissions')
        .set('Authorization', `Bearer ${token}`)
        .send({ moduleKode: 'rit', moduleNama: 'Rit Operation', rolesAllowed: ['operator', 'supervisor'] });

      expect(response.status).toBe(200);
      expect(response.body.data.rolesAllowed).toEqual(['operator', 'supervisor']);
    });

    it('rejects duplicate moduleKode', async () => {
      const response = await request(app)
        .post('/api/v1/master/module-permissions')
        .set('Authorization', `Bearer ${token}`)
        .send({ moduleKode: 'rit', moduleNama: 'Rit Operation (dup)', rolesAllowed: [] });

      expect(response.status).toBe(409);
    });

    it('lists module permissions', async () => {
      const response = await request(app)
        .get('/api/v1/master/module-permissions')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.some((m: any) => m.moduleKode === 'rit')).toBe(true);
    });

    it('updates rolesAllowed on a module permission', async () => {
      const list = await request(app).get('/api/v1/master/module-permissions').set('Authorization', `Bearer ${token}`);
      const target = list.body.data.find((m: any) => m.moduleKode === 'rit');

      const response = await request(app)
        .put(`/api/v1/master/module-permissions/${target.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ rolesAllowed: ['operator', 'supervisor', 'admin-mining', 'general-admin'] });

      expect(response.status).toBe(200);
      expect(response.body.data.rolesAllowed).toHaveLength(4);
    });
  });
});