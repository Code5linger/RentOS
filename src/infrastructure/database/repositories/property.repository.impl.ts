// src/infrastructure/database/repositories/property.repository.impl.ts
import { PrismaClient } from '@prisma/client';
import {
  IPropertyRepository,
  CreatePropertyData,
  UpdatePropertyData,
} from '@domain/repositories/property.repository';
import { PropertyEntity } from '@domain/entities/property.entity';
import { NotFoundError } from '@domain/errors/domain.errors';

export class PropertyRepositoryImpl implements IPropertyRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string, ownerId: string): Promise<PropertyEntity | null> {
    const row = await this.db.property.findFirst({
      where: { id, ownerId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdOrThrow(id: string, ownerId: string): Promise<PropertyEntity> {
    const property = await this.findById(id, ownerId);
    if (!property) throw new NotFoundError('Property', id);
    return property;
  }

  async findAllByOwner(ownerId: string): Promise<PropertyEntity[]> {
    const rows = await this.db.property.findMany({
      where: { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity);
  }

  async create(data: CreatePropertyData): Promise<PropertyEntity> {
    const row = await this.db.property.create({ data });
    return this.toEntity(row);
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdatePropertyData,
  ): Promise<PropertyEntity> {
    // findFirst scoped by ownerId before update — no blind updates
    const existing = await this.findByIdOrThrow(id, ownerId);

    const row = await this.db.property.update({
      where: { id: existing.id },
      data,
    });
    return this.toEntity(row);
  }

  async softDelete(id: string, ownerId: string): Promise<void> {
    await this.findByIdOrThrow(id, ownerId);

    await this.db.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // Add to src/infrastructure/database/repositories/property.repository.impl.ts
  async findByIdForTenant(id: string): Promise<PropertyEntity> {
    const row = await this.db.property.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!row) {
      throw new NotFoundError('Property not found', 'PROPERTY_NOT_FOUND');
    }

    return this.toEntity(row);
  }

  private toEntity(raw: {
    id: string;
    name: string;
    address: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    deletedAt: Date | null;
  }): PropertyEntity {
    return { ...raw };
  }
}
