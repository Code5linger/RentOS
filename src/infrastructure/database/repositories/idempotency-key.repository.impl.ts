// src/infrastructure/database/repositories/idempotency-key.repository.impl.ts
import { PrismaClient, Prisma } from '@prisma/client';
import {
  IIdempotencyKeyRepository,
  IdempotencyKeyRecord,
  CreateIdempotencyKeyData,
} from '@domain/repositories/idempotency-key.repository';
import { ConflictError } from '@domain/errors/domain.errors';

export class IdempotencyKeyRepositoryImpl implements IIdempotencyKeyRepository {
  constructor(private readonly db: PrismaClient) {}

  async findByKey(
    key: string,
    ownerId: string,
  ): Promise<IdempotencyKeyRecord | null> {
    return this.db.idempotencyKey.findFirst({
      where: { key, ownerId },
    });
  }

  async create(data: CreateIdempotencyKeyData): Promise<IdempotencyKeyRecord> {
    try {
      return await this.db.idempotencyKey.create({ data });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictError(`Idempotency key already exists: ${data.key}`);
      }
      throw err;
    }
  }

  async setResponseHash(id: string, responseHash: string): Promise<void> {
    await this.db.idempotencyKey.update({
      where: { id },
      data: { responseHash },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.idempotencyKey.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
    return result.count;
  }
}
