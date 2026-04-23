// src/presentation/middleware/idempotency.middleware.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { IIdempotencyKeyRepository } from '@domain/repositories/idempotency-key.repository';
import { env } from '@config/env';

// Attach to Request so the use case can access the key record
declare global {
  namespace Express {
    interface Request {
      idempotencyKeyId: string | null;
    }
  }
}

export function idempotency(
  idempotencyKeyRepository: IIdempotencyKeyRepository,
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const key = req.headers['idempotency-key'];

    // If no key provided, pass through — key is optional unless enforced per route
    if (!key || typeof key !== 'string') {
      req.idempotencyKeyId = null;
      return next();
    }

    // Validate key format — must be a UUID
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(key)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Idempotency-Key must be a valid UUID v4',
        },
      });
      return;
    }

    const ownerId = req.user?.sub;
    if (!ownerId) return next();

    try {
      const existing = await idempotencyKeyRepository.findByKey(key, ownerId);

      if (existing) {
        // Key already used — check if we have a cached response
        if (existing.responseHash) {
          // Return 409 with clear message — client should check their payment records
          res.status(409).json({
            success: false,
            error: {
              code: 'IDEMPOTENCY_CONFLICT',
              message:
                'This request was already processed. Check your payment records.',
              key,
            },
          });
          return;
        }

        // Key exists but no response yet — request is still in flight
        res.status(409).json({
          success: false,
          error: {
            code: 'REQUEST_IN_FLIGHT',
            message:
              'A request with this idempotency key is currently being processed.',
            key,
          },
        });
        return;
      }

      // Create the key record — locks this key for this owner
      const record = await idempotencyKeyRepository.create({
        ownerId,
        key,
        expiresAt: getExpiryDate(),
      });

      req.idempotencyKeyId = record.id;
      next();
    } catch (err) {
      next(err);
    }
  };
}

function getExpiryDate(): Date {
  const hours = env.IDEMPOTENCY_KEY_TTL_HOURS;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}
