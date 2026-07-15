import type { Response } from 'express';
import type { ZodError } from 'zod';

export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

export const sendData = <T>(res: Response, data: T, meta?: Record<string, unknown>) => {
  const body: ApiResponse<T> = meta ? { data, meta } : { data };
  res.json(body);
};

export const sendValidationError = (res: Response, error: ZodError) => {
  res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request tidak valid.',
      issues: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    },
  });
};

export const sendNotFound = (res: Response, message = 'Data tidak ditemukan.') => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message,
    },
  });
};
