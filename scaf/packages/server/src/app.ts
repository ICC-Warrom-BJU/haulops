import './async-errors.js'; // harus paling awal: menambal Router agar error async tertangani
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import { masterRouter } from './master.routes.js';
import { authRouter } from './auth.routes.js';
import { shiftRouter } from './shift.routes.js';
import { ritsRouter } from './rits.routes.js';
import { approvalsRouter } from './approvals.routes.js';
import { delayRouter } from './delay.routes.js';
import { maintenanceRouter } from './maintenance.routes.js';
import { bbmRouter } from './bbm.routes.js';
import { laporanRouter } from './laporan.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { dashboardDailyRouter } from './dashboard-daily.routes.js';
import { analyticRouter } from './analytic.routes.js';
import { operatorStatusRouter } from './operator-status.routes.js';
import { actualOperationRouter } from './actual-operation.routes.js';
import { requireAuth } from './auth.middleware.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'HAULOPS API is running' });
});

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', requireAuth);
app.use('/api/v1/master', masterRouter);
app.use('/api/v1/shifts', shiftRouter);
app.use('/api/v1/rits', ritsRouter);
app.use('/api/v1/approvals', approvalsRouter);
app.use('/api/v1/delays', delayRouter);
app.use('/api/v1/maintenance', maintenanceRouter);
app.use('/api/v1/bbm', bbmRouter);
app.use('/api/v1/laporan', laporanRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/dashboard', dashboardDailyRouter);
app.use('/api/v1/analytic', analyticRouter);
app.use('/api/v1/operator-status', operatorStatusRouter);
app.use('/api/v1/actual-operation', actualOperationRouter);

app.use('/api', (_req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Endpoint API tidak ditemukan.',
    },
  });
});

// Error-handling middleware (harus paling akhir & berarity 4). Menangkap error yang
// diteruskan oleh async-errors sehingga request gagal mengembalikan 500 rapi,
// bukan mematikan server.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled route error:', err);
  if (res.headersSent) return;
  res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Terjadi kesalahan internal.',
    },
  });
});

export { app };
