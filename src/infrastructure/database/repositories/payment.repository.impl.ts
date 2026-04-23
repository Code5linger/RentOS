// src/infrastructure/database/repositories/payment.repository.impl.ts
import { PrismaClient, Prisma } from '@prisma/client';
import {
  IPaymentRepository,
  CreatePaymentData,
} from '@domain/repositories/payment.repository';
import { PaymentEntity } from '@domain/entities/payment.entity';
import { InvoiceStatus, PaymentStatus, PaymentMethod } from '@domain/enums';
import { NotFoundError } from '@domain/errors/domain.errors';

export interface CreatePaymentWithReconciliationData extends CreatePaymentData {
  newPaidAmount: string;
  newInvoiceStatus: InvoiceStatus;
}

export class PaymentRepositoryImpl implements IPaymentRepository {
  constructor(private readonly db: PrismaClient) {}

  async findById(id: string, ownerId: string): Promise<PaymentEntity | null> {
    const row = await this.db.payment.findFirst({
      where: { id, ownerId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdOrThrow(id: string, ownerId: string): Promise<PaymentEntity> {
    const payment = await this.findById(id, ownerId);
    if (!payment) throw new NotFoundError('Payment', id);
    return payment;
  }

  async findByTransactionRef(ref: string): Promise<PaymentEntity | null> {
    const row = await this.db.payment.findUnique({
      where: { transactionRef: ref },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByInvoice(
    invoiceId: string,
    ownerId: string,
  ): Promise<PaymentEntity[]> {
    const rows = await this.db.payment.findMany({
      where: { invoiceId, ownerId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity.bind(this));
  }

  async create(data: CreatePaymentData): Promise<PaymentEntity> {
    const row = await this.db.payment.create({
      data: {
        invoiceId: data.invoiceId,
        ownerId: data.ownerId,
        amount: new Prisma.Decimal(data.amount),
        method: data.method,
        status: PaymentStatus.INITIATED,
        idempotencyKeyId: data.idempotencyKeyId,
        createdBy: data.createdBy,
      },
    });
    return this.toEntity(row);
  }

  /**
   * CRITICAL: Creates payment AND updates invoice in a single transaction.
   * If either operation fails, both roll back.
   * This is the only correct way to record a payment.
   */
  async createWithInvoiceUpdate(
    data: CreatePaymentWithReconciliationData,
  ): Promise<PaymentEntity> {
    const result = await this.db.$transaction(async (tx) => {
      // 1. Create payment record
      const payment = await tx.payment.create({
        data: {
          invoiceId: data.invoiceId,
          ownerId: data.ownerId,
          amount: new Prisma.Decimal(data.amount),
          method: data.method,
          status: PaymentStatus.SUCCESS,
          idempotencyKeyId: data.idempotencyKeyId,
          createdBy: data.createdBy,
        },
      });

      // 2. Update invoice paid amount and status atomically
      await tx.rentInvoice.update({
        where: { id: data.invoiceId },
        data: {
          paidAmount: new Prisma.Decimal(data.newPaidAmount),
          status: data.newInvoiceStatus,
        },
      });

      return payment;
    });

    return this.toEntity(result);
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    transactionRef?: string,
  ): Promise<PaymentEntity> {
    const row = await this.db.payment.update({
      where: { id },
      data: {
        status,
        ...(transactionRef && { transactionRef }),
      },
    });
    return this.toEntity(row);
  }

  private toEntity(raw: {
    id: string;
    invoiceId: string;
    ownerId: string;
    amount: Prisma.Decimal;
    method: string;
    status: string;
    transactionRef: string | null;
    idempotencyKeyId: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
  }): PaymentEntity {
    return {
      ...raw,
      amount: raw.amount.toString(),
      method: raw.method as PaymentMethod,
      status: raw.status as PaymentStatus,
    };
  }

  // Add to src/infrastructure/database/repositories/payment.repository.impl.ts

  async findByInvoiceAsTenant(
    invoiceId: string,
    leaseIds: string[],
  ): Promise<PaymentEntity[]> {
    if (leaseIds.length === 0) return [];

    // Double-scope: payment's invoice must belong to one of tenant's leases
    const rows = await this.db.payment.findMany({
      where: {
        invoiceId,
        invoice: {
          leaseId: { in: leaseIds },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(this.toEntity.bind(this));
  }
}
