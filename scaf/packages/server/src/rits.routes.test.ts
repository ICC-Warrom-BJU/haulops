import request from 'supertest';
import { app } from './app.js';

describe('Rits routes — tonase per jumlahRit', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;
  });

  it('mengalikan estimasiTon dengan jumlahRit (tanpa timbangan)', async () => {
    // unit-001 -> tipe dt30, kapasitasTon 30. jumlahRit=2 -> estimasiTon harus 60, bukan 30.
    const response = await request(app)
      .post('/api/v1/rits')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-001', material: 'OB', jumlahRit: 2 });

    expect(response.status).toBe(201);
    expect(response.body.data.estimasiTon).toBe(60);
    expect(response.body.data.nettoTon).toBeNull();
  });

  it('mengalikan nettoTon dengan jumlahRit (dengan timbangan)', async () => {
    // gross-tare = 45000-15000 = 30000 kg = 30 ton per rit. jumlahRit=3 -> nettoTon harus 90.
    const response = await request(app)
      .post('/api/v1/rits')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-001', material: 'OB', jumlahRit: 3, grossKg: 45000, tareKg: 15000 });

    expect(response.status).toBe(201);
    expect(response.body.data.nettoTon).toBe(90);
    expect(response.body.data.estimasiTon).toBeNull();
  });

  it('jumlahRit default 1 tetap sama seperti sebelumnya (baseline)', async () => {
    const response = await request(app)
      .post('/api/v1/rits')
      .set('Authorization', `Bearer ${token}`)
      .send({ shiftId: 'shift-20260607-pagi-kala', unitId: 'unit-001', material: 'OB' });

    expect(response.status).toBe(201);
    expect(response.body.data.jumlahRit).toBe(1);
    expect(response.body.data.estimasiTon).toBe(30);
  });
});
