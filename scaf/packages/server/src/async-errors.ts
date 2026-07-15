import express from 'express';
import type { NextFunction, Request, Response } from 'express';

/**
 * Express 4 tidak otomatis menangkap Promise rejection dari route handler async.
 * Akibatnya sebuah error di dalam handler async menjadi `unhandledRejection` yang
 * (di Node modern) mematikan seluruh proses server.
 *
 * Modul ini menambal prototipe Router agar setiap handler async yang menolak
 * (reject) diteruskan ke error-handling middleware lewat `next(err)`, sehingga
 * request gagal mengembalikan respons 500 yang rapi dan server tetap hidup.
 *
 * PENTING: modul ini harus di-import PALING AWAL di `app.ts`, sebelum modul route
 * mana pun dievaluasi, karena route didaftarkan saat modulnya di-load.
 */
const wrap = (handler: unknown): unknown => {
  // Jangan bungkus error-handling middleware (arity 4) atau non-fungsi (mis. path).
  if (typeof handler !== 'function' || handler.length >= 4) return handler;

  return function wrappedHandler(req: Request, res: Response, next: NextFunction) {
    try {
      const result = (handler as (req: Request, res: Response, next: NextFunction) => unknown)(req, res, next);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>).catch(next);
      }
      return result;
    } catch (err) {
      next(err);
      return undefined;
    }
  };
};

const routerProto = Object.getPrototypeOf(express.Router()) as Record<string, any>;
const methods = ['get', 'post', 'put', 'patch', 'delete', 'all'] as const;

for (const method of methods) {
  const original = routerProto[method];
  if (typeof original !== 'function') continue;
  routerProto[method] = function patchedMethod(this: unknown, ...args: unknown[]) {
    return original.apply(this, args.map((arg) => (typeof arg === 'function' ? wrap(arg) : arg)));
  };
}
