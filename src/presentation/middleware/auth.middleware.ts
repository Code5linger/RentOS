// src/presentation/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '@infrastructure/auth/token.service';
import { AccessTokenPayload } from '@infrastructure/auth/token.service';
import { Role } from '@domain/enums';
import {
  UnauthorizedError,
  ForbiddenError,
} from '@domain/errors/domain.errors';

// Extend Express Request — typed, no any
declare global {
  namespace Express {
    interface Request {
      user: AccessTokenPayload;
    }
  }
}

const tokenService = new TokenService();

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing authorization header'));
  }

  const token = authHeader.slice(7);

  try {
    req.user = tokenService.verifyAccessToken(token);
    next();
  } catch (err) {
    next(err);
  }
}

// RBAC — use as: authorize(Role.OWNER, Role.ADMIN)
export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Role ${req.user.role} is not permitted to perform this action`,
        ),
      );
    }

    next();
  };
}

// Scope guard — ensures OWNERs can only access their own data
// Call after authenticate()
export function scopeToOwner(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const paramOwnerId = req.params['ownerId'] ?? req.query['ownerId'];

  if (
    req.user.role === Role.OWNER &&
    paramOwnerId &&
    paramOwnerId !== req.user.ownerId
  ) {
    return next(new ForbiddenError('You can only access your own resources'));
  }

  next();
}
