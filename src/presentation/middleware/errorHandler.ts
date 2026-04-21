// src/presentation/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@domain/errors/AppError';
import { errorResponse } from '@shared/types/ApiResponse';
import { ZodError } from 'zod';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.code, err.message));
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ');
    res.status(422).json(errorResponse('VALIDATION_ERROR', message));
    return;
  }

  // Unknown errors — don't leak internals
  console.error('[Unhandled Error]', err);
  res
    .status(500)
    .json(errorResponse('INTERNAL_ERROR', 'An unexpected error occurred'));
}
