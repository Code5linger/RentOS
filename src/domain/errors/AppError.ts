// src/domain/errors/AppError.ts

export type ErrorCode =
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'PAYMENT_DUPLICATE'
  | 'INVOICE_ALREADY_EXISTS'
  | 'LEASE_NOT_ACTIVE'
  | 'INSUFFICIENT_PAYMENT'
  | 'INTERNAL_ERROR';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number,
    isOperational = true,
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }

  static notFound(resource: string): AppError {
    return new AppError(`${resource} not found`, 'NOT_FOUND', 404);
  }

  static unauthorized(message = 'Unauthorized'): AppError {
    return new AppError(message, 'UNAUTHORIZED', 401);
  }

  static forbidden(message = 'Access denied'): AppError {
    return new AppError(message, 'FORBIDDEN', 403);
  }

  static conflict(message: string): AppError {
    return new AppError(message, 'CONFLICT', 409);
  }

  static validation(message: string): AppError {
    return new AppError(message, 'VALIDATION_ERROR', 422);
  }

  static paymentDuplicate(): AppError {
    return new AppError(
      'Duplicate payment detected — idempotency key already used',
      'PAYMENT_DUPLICATE',
      409,
    );
  }

  static invoiceAlreadyExists(leaseId: string, period: string): AppError {
    return new AppError(
      `Invoice already exists for lease ${leaseId} period ${period}`,
      'INVOICE_ALREADY_EXISTS',
      409,
    );
  }

  static leaseNotActive(leaseId: string): AppError {
    return new AppError(
      `Lease ${leaseId} is not active`,
      'LEASE_NOT_ACTIVE',
      422,
    );
  }
}
