import { Request, Response, NextFunction } from 'express';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
  BusinessRuleError,
  IdempotencyConflictError,
} from '@domain/errors/domain.errors';

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    fields?: Record<string, string[]>;
  };
}

export function errorMiddleware(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  console.error('[Error]', err);

  if (err instanceof ValidationError) {
    res.status(400).json(buildError(err, err.fields));
    return;
  }

  if (err instanceof UnauthorizedError) {
    res.status(401).json(buildError(err));
    return;
  }

  if (err instanceof ForbiddenError) {
    res.status(403).json(buildError(err));
    return;
  }

  if (err instanceof NotFoundError) {
    res.status(404).json(buildError(err));
    return;
  }

  if (err instanceof ConflictError || err instanceof IdempotencyConflictError) {
    res.status(409).json(buildError(err));
    return;
  }

  if (err instanceof BusinessRuleError) {
    res.status(422).json(buildError(err));
    return;
  }

  if (err instanceof DomainError) {
    res.status(400).json(buildError(err));
    return;
  }

  // Unhandled — never leak internals
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  } satisfies ErrorResponse);
}

function buildError(
  err: DomainError,
  fields?: Record<string, string[]>,
): ErrorResponse {
  return {
    success: false,
    error: {
      code: err.code,
      message: err.message,
      ...(fields && { fields }),
    },
  };
}
