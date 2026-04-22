import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '@config/env';

export interface AccessTokenPayload {
  sub: string; // userId
  email: string;
  role: import('@domain/enums').Role;
  ownerId: string; // for TENANT: their landlord's id; for OWNER: their own id
}

export interface RefreshTokenPayload {
  sub: string; // userId
  jti: string; // unique token id — used for revocation
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string; // what we store in DB
  jti: string;
}

export class TokenService {
  generateTokenPair(payload: Omit<AccessTokenPayload, never>): TokenPair {
    const jti = crypto.randomUUID();

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN,
      issuer: 'rentos',
    });

    const rawRefreshToken = crypto.randomBytes(64).toString('hex');

    // Store the hash — never the raw token
    const refreshTokenHash = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    // Embed jti in the refresh token for DB lookup without exposing the hash
    const refreshToken = jwt.sign(
      { sub: payload.sub, jti } satisfies RefreshTokenPayload,
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN, issuer: 'rentos' },
    );

    return { accessToken, refreshToken, refreshTokenHash, jti };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: 'rentos',
      }) as AccessTokenPayload;
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new (require('@domain/errors/domain.errors').UnauthorizedError)(
          'Access token expired',
        );
      }
      throw new (require('@domain/errors/domain.errors').UnauthorizedError)(
        'Invalid access token',
      );
    }
  }

  verifyRefreshToken(token: string): RefreshTokenPayload {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: 'rentos',
      }) as RefreshTokenPayload;
    } catch {
      throw new (require('@domain/errors/domain.errors').UnauthorizedError)(
        'Invalid or expired refresh token',
      );
    }
  }

  hashRawRefreshToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken).digest('hex');
  }

  getRefreshTokenExpiryDate(): Date {
    const ms = parseDuration(env.JWT_REFRESH_EXPIRES_IN);
    return new Date(Date.now() + ms);
  }
}

function parseDuration(duration: string): number {
  const unit = duration.slice(-1);
  const value = parseInt(duration.slice(0, -1), 10);
  const map: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * (map[unit] ?? 1000);
}
