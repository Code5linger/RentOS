// src/presentation/middleware/require-idempotency.middleware.ts
import { Request, Response, NextFunction } from 'express';

export function requireIdempotencyKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const key = req.headers['idempotency-key'];

  if (!key || typeof key !== 'string') {
    res.status(400).json({
      success: false,
      error: {
        code: 'MISSING_IDEMPOTENCY_KEY',
        message: 'Idempotency-Key header is required for payment requests',
      },
    });
    return;
  }

  next();
}
