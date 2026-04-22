import { PrismaClient } from '@prisma/client';
import {
  IUserRepository,
  CreateUserData,
} from '@domain/repositories/user.repository';
import { UserEntity } from '@domain/entities/user.entity';
import { NotFoundError } from '@domain/errors/domain.errors';
import { Role } from '@domain/enums';

export class UserRepositoryImpl implements IUserRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string): Promise<UserEntity | null> {
    const user = await this.db.user.findFirst({
      where: { id, deletedAt: null },
    });
    return user ? this.toEntity(user) : null;
  }

  async findByIdOrThrow(id: string): Promise<UserEntity> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundError('User', id);
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await this.db.user.findFirst({
      where: { email, deletedAt: null },
    });
    return user ? this.toEntity(user) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const user = await this.db.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role,
        createdBy: data.createdBy,
      },
    });
    return this.toEntity(user);
  }

  // Map Prisma model → domain entity
  // This is the anti-corruption layer — Prisma types never leak out
  private toEntity(raw: {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
    deletedAt: Date | null;
  }): UserEntity {
    return {
      id: raw.id,
      email: raw.email,
      passwordHash: raw.passwordHash,
      role: raw.role as Role,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdBy: raw.createdBy,
      deletedAt: raw.deletedAt,
    };
  }
}
