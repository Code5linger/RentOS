import { PrismaClient } from '@prisma/client';

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  ipAddress: string | null;
}

export interface IRefreshTokenRepository {
  create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord>;
  findByHash(hash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

export interface CreateRefreshTokenData {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  ipAddress: string | null;
}

export class RefreshTokenRepositoryImpl implements IRefreshTokenRepository {
  constructor(private readonly db: PrismaClient) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshTokenRecord> {
    return this.db.refreshToken.create({ data });
  }

  async findByHash(hash: string): Promise<RefreshTokenRecord | null> {
    return this.db.refreshToken.findUnique({
      where: { tokenHash: hash },
    });
  }

  async revoke(id: string): Promise<void> {
    await this.db.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.db.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
