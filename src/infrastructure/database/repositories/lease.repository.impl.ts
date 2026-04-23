// src/infrastructure/database/repositories/lease.repository.impl.ts
import { PrismaClient, Prisma } from '@prisma/client';
import {
  ILeaseRepository,
  CreateLeaseData,
} from '@domain/repositories/lease.repository';
import { LeaseEntity } from '@domain/entities/lease.entity';
import { LeaseStatus } from '@domain/enums';
import { NotFoundError } from '@domain/errors/domain.errors';

export class LeaseRepositoryImpl implements ILeaseRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string, ownerId: string): Promise<LeaseEntity | null> {
    const row = await this.db.lease.findFirst({
      where: { id, ownerId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdOrThrow(id: string, ownerId: string): Promise<LeaseEntity> {
    const lease = await this.findById(id, ownerId);
    if (!lease) throw new NotFoundError('Lease', id);
    return lease;
  }

  async findActiveByUnit(unitId: string): Promise<LeaseEntity | null> {
    const row = await this.db.lease.findFirst({
      where: { unitId, status: 'ACTIVE', deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAllByOwner(
    ownerId: string,
    status?: LeaseStatus,
  ): Promise<LeaseEntity[]> {
    const rows = await this.db.lease.findMany({
      where: {
        ownerId,
        deletedAt: null,
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity.bind(this));
  }

  async findAllActive(): Promise<LeaseEntity[]> {
    const rows = await this.db.lease.findMany({
      where: { status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map(this.toEntity.bind(this));
  }

  async create(data: CreateLeaseData): Promise<LeaseEntity> {
    const row = await this.db.lease.create({
      data: {
        unitId: data.unitId,
        tenantId: data.tenantId,
        ownerId: data.ownerId,
        startDate: data.startDate,
        endDate: data.endDate ?? null,
        monthlyRent: new Prisma.Decimal(data.monthlyRent),
        billingDay: data.billingDay,
        createdBy: data.createdBy,
      },
    });
    return this.toEntity(row);
  }

  async updateStatus(
    id: string,
    status: LeaseStatus,
    ownerId: string,
  ): Promise<LeaseEntity> {
    await this.findByIdOrThrow(id, ownerId);

    const row = await this.db.lease.update({
      where: { id },
      data: {
        status,
        ...(status === LeaseStatus.ENDED && { endDate: new Date() }),
      },
    });
    return this.toEntity(row);
  }

  private toEntity(raw: {
    id: string;
    unitId: string;
    tenantId: string;
    ownerId: string;
    startDate: Date;
    endDate: Date | null;
    monthlyRent: Prisma.Decimal;
    billingDay: number;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    deletedAt: Date | null;
  }): LeaseEntity {
    return {
      ...raw,
      monthlyRent: raw.monthlyRent.toString(),
      status: raw.status as LeaseStatus,
    };
  }

  // Add to src/infrastructure/database/repositories/lease.repository.impl.ts

  async findAllByTenant(tenantId: string): Promise<LeaseEntity[]> {
    const rows = await this.db.lease.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity.bind(this));
  }

  async findByIdAsTenant(
    leaseId: string,
    tenantId: string,
  ): Promise<LeaseEntity | null> {
    const row = await this.db.lease.findFirst({
      where: { id: leaseId, tenantId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdOrThrowAsTenant(
    leaseId: string,
    tenantId: string,
  ): Promise<LeaseEntity> {
    const lease = await this.findByIdAsTenant(leaseId, tenantId);
    if (!lease) throw new NotFoundError('Lease', leaseId);
    return lease;
  }
}
