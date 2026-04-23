// src/infrastructure/database/repositories/rent-invoice.repository.impl.ts
import { PrismaClient, Prisma } from '@prisma/client';
import {
  IRentInvoiceRepository,
  CreateInvoiceData,
} from '@domain/repositories/rent-invoice.repository';
import { RentInvoiceEntity } from '@domain/entities/rent-invoice.entity';
import { InvoiceStatus } from '@domain/enums';
import { NotFoundError, ConflictError } from '@domain/errors/domain.errors';

export class RentInvoiceRepositoryImpl implements IRentInvoiceRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(
    id: string,
    ownerId: string,
  ): Promise<RentInvoiceEntity | null> {
    const row = await this.db.rentInvoice.findFirst({
      where: { id, ownerId, deletedAt: null },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdOrThrow(
    id: string,
    ownerId: string,
  ): Promise<RentInvoiceEntity> {
    const invoice = await this.findById(id, ownerId);
    if (!invoice) throw new NotFoundError('RentInvoice', id);
    return invoice;
  }

  // Used by worker to check before insert — idempotency check
  async findByLeasePeriod(
    leaseId: string,
    billingPeriodStart: Date,
  ): Promise<RentInvoiceEntity | null> {
    const row = await this.db.rentInvoice.findUnique({
      where: {
        leaseId_billingPeriodStart: { leaseId, billingPeriodStart },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  // Critical query for late detection job
  async findOverdueUnpaid(asOf: Date): Promise<RentInvoiceEntity[]> {
    const rows = await this.db.rentInvoice.findMany({
      where: {
        dueDate: { lt: asOf },
        status: { in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL] },
        deletedAt: null,
      },
      orderBy: { dueDate: 'asc' },
    });
    return rows.map(this.toEntity.bind(this));
  }

  async findAllByOwner(
    ownerId: string,
    status?: InvoiceStatus,
  ): Promise<RentInvoiceEntity[]> {
    const rows = await this.db.rentInvoice.findMany({
      where: {
        ownerId,
        deletedAt: null,
        ...(status && { status }),
      },
      orderBy: { billingPeriodStart: 'desc' },
    });
    return rows.map(this.toEntity.bind(this));
  }

  async create(data: CreateInvoiceData): Promise<RentInvoiceEntity> {
    try {
      const row = await this.db.rentInvoice.create({
        data: {
          leaseId: data.leaseId,
          ownerId: data.ownerId,
          billingPeriodStart: data.billingPeriodStart,
          billingPeriodEnd: data.billingPeriodEnd,
          totalAmount: new Prisma.Decimal(data.totalAmount),
          paidAmount: new Prisma.Decimal(0),
          dueDate: data.dueDate,
          status: InvoiceStatus.PENDING,
          createdBy: data.createdBy,
        },
      });
      return this.toEntity(row);
    } catch (err) {
      // P2002 = unique constraint violation
      // (leaseId, billingPeriodStart) — this is expected on retry, not an error
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        (err as Prisma.PrismaClientKnownRequestError).code === 'P2002'
      ) {
        throw new ConflictError(
          `Invoice already exists for lease ${data.leaseId} period ${data.billingPeriodStart.toISOString()}`,
        );
      }
      throw err;
    }
  }

  async updatePaidAmount(
    id: string,
    paidAmount: string,
    status: InvoiceStatus,
    ownerId: string,
  ): Promise<RentInvoiceEntity> {
    await this.findByIdOrThrow(id, ownerId);

    const row = await this.db.rentInvoice.update({
      where: { id },
      data: {
        paidAmount: new Prisma.Decimal(paidAmount),
        status,
      },
    });
    return this.toEntity(row);
  }

  // Bulk update for late detection — single DB roundtrip
  async bulkUpdateStatus(ids: string[], status: InvoiceStatus): Promise<void> {
    if (ids.length === 0) return;

    await this.db.rentInvoice.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  private toEntity(raw: {
    id: string;
    leaseId: string;
    ownerId: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    totalAmount: Prisma.Decimal;
    paidAmount: Prisma.Decimal;
    dueDate: Date;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    deletedAt: Date | null;
  }): RentInvoiceEntity {
    return {
      ...raw,
      totalAmount: raw.totalAmount.toString(),
      paidAmount: raw.paidAmount.toString(),
      status: raw.status as InvoiceStatus,
    };
  }

  // Add to src/infrastructure/database/repositories/rent-invoice.repository.impl.ts

  async findAllByTenant(
    tenantId: string,
    leaseIds: string[],
  ): Promise<RentInvoiceEntity[]> {
    if (leaseIds.length === 0) return [];

    const rows = await this.db.rentInvoice.findMany({
      where: {
        leaseId: { in: leaseIds },
        deletedAt: null,
      },
      orderBy: { billingPeriodStart: 'desc' },
    });
    return rows.map(this.toEntity.bind(this));
  }

  async findByIdAsTenant(
    invoiceId: string,
    leaseIds: string[],
  ): Promise<RentInvoiceEntity | null> {
    if (leaseIds.length === 0) return null;

    const row = await this.db.rentInvoice.findFirst({
      where: {
        id: invoiceId,
        leaseId: { in: leaseIds },
        deletedAt: null,
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdOrThrowAsTenant(
    invoiceId: string,
    leaseIds: string[],
  ): Promise<RentInvoiceEntity> {
    const invoice = await this.findByIdAsTenant(invoiceId, leaseIds);
    if (!invoice) throw new NotFoundError('RentInvoice', invoiceId);
    return invoice;
  }

  async findAllByLease(
    leaseId: string,
    ownerId: string,
  ): Promise<RentInvoiceEntity[]> {
    const rows = await this.db.rentInvoice.findMany({
      where: {
        leaseId,
        ownerId,
        deletedAt: null,
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return rows.map((row: any) => this.toEntity(row));
  }

  }
