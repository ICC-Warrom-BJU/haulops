import { app } from './app.js';
import { bootstrapAdmin } from './bootstrap.js';

const port = Number(process.env.PORT || 4001);

// Pastikan ada admin yang bisa login pada DB baru; jangan halangi start server
// bila bootstrap gagal (mis. DB sempat tak terjangkau) — server tetap listen.
bootstrapAdmin()
  .catch((err) => console.error('[bootstrap] gagal membuat admin awal:', err))
  .finally(() => {
    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  });
