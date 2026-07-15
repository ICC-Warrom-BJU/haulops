import request from 'supertest';
import { app } from './app.js';

describe('Operator Status routes', () => {
  let token: string;

  beforeAll(async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'password' });
    token = login.body.data.token;
  });

  it('lists operators for a branch/date with unvalidated status (null)', async () => {
    const response = await request(app)
      .get('/api/v1/operator-status/daily')
      .query({ tanggal: '2026-06-07', branchId: 'kala' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.rows).toHaveLength(2);
    expect(response.body.data.rows[0].statusTypeId).toBeNull();
    expect(response.body.data.statusTypes.length).toBeGreaterThanOrEqual(2);
  });

  it('rejects missing branchId', async () => {
    const response = await request(app)
      .get('/api/v1/operator-status/daily')
      .query({ tanggal: '2026-06-07' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
  });

  it('bulk sets daily status for multiple operators', async () => {
    const response = await request(app)
      .post('/api/v1/operator-status/daily')
      .set('Authorization', `Bearer ${token}`)
      .send({
        tanggal: '2026-06-07',
        entries: [
          { operatorId: 'operator-001', statusTypeId: 'opstatus-ready' },
          { operatorId: 'operator-002', statusTypeId: 'opstatus-sakit', catatan: 'Demam' },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.meta.total).toBe(2);

    const check = await request(app)
      .get('/api/v1/operator-status/daily')
      .query({ tanggal: '2026-06-07', branchId: 'kala' })
      .set('Authorization', `Bearer ${token}`);
    const byId = Object.fromEntries(check.body.data.rows.map((r: any) => [r.operatorId, r]));
    expect(byId['operator-001'].statusKode).toBe('READY');
    expect(byId['operator-002'].statusKode).toBe('SAKIT');
    expect(byId['operator-002'].catatan).toBe('Demam');
  });

  it('generates (copies) status from source date to target date', async () => {
    const response = await request(app)
      .post('/api/v1/operator-status/daily/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ branchId: 'kala', fromTanggal: '2026-06-07', toTanggal: '2026-06-08' });

    expect(response.status).toBe(200);
    expect(response.body.data.copied).toBe(2);

    const check = await request(app)
      .get('/api/v1/operator-status/daily')
      .query({ tanggal: '2026-06-08', branchId: 'kala' })
      .set('Authorization', `Bearer ${token}`);
    const byId = Object.fromEntries(check.body.data.rows.map((r: any) => [r.operatorId, r]));
    expect(byId['operator-001'].statusKode).toBe('READY');
  });

  it('returns a full-month matrix (rows=operator, days=column keys)', async () => {
    const response = await request(app)
      .get('/api/v1/operator-status/monthly')
      .query({ bulan: '06', tahun: 2026, branchId: 'kala' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.daysInMonth).toBe(30);
    expect(Object.keys(response.body.data.rows[0].days)).toHaveLength(30);
    const op1 = response.body.data.rows.find((r: any) => r.operatorId === 'operator-001');
    expect(op1.days['07'].statusKode).toBe('READY');
    expect(op1.days['08'].statusKode).toBe('READY');
    expect(op1.days['01']).toBeNull();
  });

  it('rejects generate with same from/to date', async () => {
    const response = await request(app)
      .post('/api/v1/operator-status/daily/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ branchId: 'kala', fromTanggal: '2026-06-07', toTanggal: '2026-06-07' });

    expect(response.status).toBe(400);
  });

  it('returns history for an operator within a date range', async () => {
    const response = await request(app)
      .get('/api/v1/operator-status/history/operator-001')
      .query({ from: '2026-06-01', to: '2026-06-30' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.operator.nama).toBe('Andi Saputra');
    expect(response.body.data.history.length).toBeGreaterThanOrEqual(2);
  });

  it('returns 404 for unknown operator history', async () => {
    const response = await request(app)
      .get('/api/v1/operator-status/history/does-not-exist')
      .query({ from: '2026-06-01', to: '2026-06-30' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
