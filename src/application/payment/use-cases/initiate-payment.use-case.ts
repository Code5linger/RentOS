// src/application/payment/use-cases/initiate-payment.use-case.ts
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import {
  PaymentRepositoryImpl,
  CreatePaymentWithReconciliationData,
} from '@infrastructure/database/repositories/payment.repository.impl';
import { PaymentEntity } from '@domain/entities/payment.entity';
import { InvoiceStatus } from '@domain/enums';
import { BusinessRuleError } from '@domain/errors/domain.errors';
import { InvoiceReconciler } from '@domain/services/invoice-reconciler';
import { IIdempotencyKeyRepository } from '@domain/repositories/idempotency-key.repository';
import { InitiatePaymentDto } from '../dtos/payment.dto';

export class InitiatePaymentUseCase {
  private readonly reconciler = new InvoiceReconciler();

  constructor(
    private readonly paymentRepository: PaymentRepositoryImpl,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
    private readonly idempotencyKeyRepository: IIdempotencyKeyRepository,
  ) {}

  async execute(
    dto: InitiatePaymentDto,
    ownerId: string,
    actorId: string,
    idempotencyKeyId: string | null,
  ): Promise<PaymentEntity> {
    // 1. Load invoice — scoped by ownerId
    const invoice = await this.rentInvoiceRepository.findByIdOrThrow(
      dto.invoiceId,
      ownerId,
    );

    // 2. Guard: cannot pay a fully paid invoice
    if (invoice.status === InvoiceStatus.PAID) {
      throw new BusinessRuleError('Invoice is already fully paid.');
    }

    // 3. Guard: cannot pay a soft-deleted invoice
    if (invoice.deletedAt !== null) {
      throw new BusinessRuleError('Invoice is no longer active.');
    }

    // 4. Reconcile — validates amount, computes new totals
    //    Throws BusinessRuleError if overpayment attempted
    const reconciliation = this.reconciler.apply(
      invoice.paidAmount,
      invoice.totalAmount,
      dto.amount,
    );

    // 5. Create payment + update invoice atomically
    const payment = await this.paymentRepository.createWithInvoiceUpdate({
      invoiceId: dto.invoiceId,
      ownerId,
      amount: dto.amount,
      method: dto.method,
      idempotencyKeyId,
      createdBy: actorId,
      newPaidAmount: reconciliation.newPaidAmount,
      newInvoiceStatus: reconciliation.newStatus,
    });

    // 6. Mark idempotency key as consumed
    if (idempotencyKeyId) {
      await this.idempotencyKeyRepository.setResponseHash(
        idempotencyKeyId,
        payment.id,
      );
    }

    return payment;
  }
}
