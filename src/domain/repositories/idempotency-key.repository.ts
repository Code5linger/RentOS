// src/domain/repositories/idempotency-key.repository.ts
export interface IdempotencyKeyRecord {
  id: string;
  ownerId: string;
  key: string;
  responseHash: string | null;
  expiresAt: Date;
  createdAt: Date;
}

export interface IIdempotencyKeyRepository {
  findByKey(key: string, ownerId: string): Promise<IdempotencyKeyRecord | null>;
  create(data: CreateIdempotencyKeyData): Promise<IdempotencyKeyRecord>;
  setResponseHash(id: string, responseHash: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

export interface CreateIdempotencyKeyData {
  ownerId: string;
  key: string;
  expiresAt: Date;
}
