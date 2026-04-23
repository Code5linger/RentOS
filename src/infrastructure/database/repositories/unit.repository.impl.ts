// src/infrastructure/database/repositories/unit.repository.impl.ts
import { PrismaClient, Prisma } from '@prisma/client';
import {
  IUnitRepository,
  CreateUnitData,
  UpdateUnitData,
} from '@domain/repositories/unit.repository';
import { UnitEntity } from '@domain/entities/unit.entity';
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from '@domain/errors/domain.errors';

export class UnitRepositoryImpl implements IUnitRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string, ownerId: string): Promise<UnitEntity | null> {
    const row = await this.db.unit.findFirst({
      where: {
        id,
        deletedAt: null,
        property: { ownerId, deletedAt: null }, // join-guard: unit must belong to owner
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdOrThrow(id: string, ownerId: string): Promise<UnitEntity> {
    const unit = await this.findById(id, ownerId);
    if (!unit) throw new NotFoundError('Unit', id);
    return unit;
  }

  async findAllByProperty(
    propertyId: string,
    ownerId: string,
  ): Promise<UnitEntity[]> {
    const rows = await this.db.unit.findMany({
      where: {
        propertyId,
        deletedAt: null,
        property: { ownerId, deletedAt: null },
      },
      orderBy: { unitNumber: 'asc' },
    });
    return rows.map(this.toEntity);
  }

  async findActiveLeaseExists(unitId: string): Promise<boolean> {
    const count = await this.db.lease.count({
      where: { unitId, status: 'ACTIVE', deletedAt: null },
    });
    return count > 0;
  }

  async create(data: CreateUnitData): Promise<UnitEntity> {
    try {
      const row = await this.db.unit.create({
        data: {
          propertyId: data.propertyId,
          unitNumber: data.unitNumber,
          rentAmount: new Prisma.Decimal(data.rentAmount),
          createdBy: data.createdBy,
        },
      });
      return this.toEntity(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as Prisma.PrismaClientKnownRequestError).code === 'P2002'
      ) {
        throw new ConflictError(
          `Unit number '${data.unitNumber}' already exists in this property`,
        );
      }
      throw err;
    }
  }

  async update(
    id: string,
    ownerId: string,
    data: UpdateUnitData,
  ): Promise<UnitEntity> {
    await this.findByIdOrThrow(id, ownerId);

    try {
      const row = await this.db.unit.update({
        where: { id },
        data: {
          ...(data.unitNumber && { unitNumber: data.unitNumber }),
          ...(data.rentAmount && {
            rentAmount: new Prisma.Decimal(data.rentAmount),
          }),
        },
      });
      return this.toEntity(row);
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as Prisma.PrismaClientKnownRequestError).code === 'P2002'
      ) {
        throw new ConflictError(
          `Unit number '${data.unitNumber}' already exists in this property`,
        );
      }
      throw err;
    }
  }

  async softDelete(id: string, ownerId: string): Promise<void> {
    await this.findByIdOrThrow(id, ownerId);

    const hasActiveLease = await this.findActiveLeaseExists(id);
    if (hasActiveLease) {
      throw new BusinessRuleError(
        'Cannot delete a unit with an active lease. End the lease first.',
      );
    }

    await this.db.unit.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findByIdForTenant(id: string): Promise<UnitEntity> {
    const row = await this.db.unit.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });

    if (!row) {
      throw new NotFoundError('Unit not found', 'UNIT_NOT_FOUND');
    }

    return this.toEntity(row);
  }

  private toEntity(raw: {
    id: string;
    propertyId: string;
    unitNumber: string;
    rentAmount: Prisma.Decimal;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    deletedAt: Date | null;
  }): UnitEntity {
    return {
      ...raw,
      rentAmount: raw.rentAmount.toString(),
    };
  }
}
