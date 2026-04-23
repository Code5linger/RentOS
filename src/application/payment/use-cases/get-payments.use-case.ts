// src/application/payment/use-cases/get-payments.use-case.ts
import { IPaymentRepository } from '@domain/repositories/payment.repository';
import { PaymentEntity } from '@domain/entities/payment.entity';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';

export class GetPaymentsUseCase {
  constructor(
    private readonly paymentRepository: IPaymentRepository,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
  ) {}

  async getByInvoice(
    invoiceId: string,
    ownerId: string,
  ): Promise<PaymentEntity[]> {
    // Verify invoice belongs to owner before returning payments
    await this.rentInvoiceRepository.findByIdOrThrow(invoiceId, ownerId);
    return this.paymentRepository.findByInvoice(invoiceId, ownerId);
  }

  async getById(id: string, ownerId: string): Promise<PaymentEntity> {
    return this.paymentRepository.findByIdOrThrow(id, ownerId);
  }
}
