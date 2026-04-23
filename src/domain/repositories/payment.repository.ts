// payment.repository.ts
import { PaymentEntity } from '../entities/payment.entity';
import { PaymentStatus } from '../enums';

export interface IPaymentRepository {
  findById(id: string, ownerId: string): Promise<PaymentEntity | null>;
  findByIdOrThrow(id: string, ownerId: string): Promise<PaymentEntity>;
  findByTransactionRef(ref: string): Promise<PaymentEntity | null>;
  findByInvoice(invoiceId: string, ownerId: string): Promise<PaymentEntity[]>;
  create(data: CreatePaymentData): Promise<PaymentEntity>;
  updateStatus(
    id: string,
    status: PaymentStatus,
    transactionRef?: string,
  ): Promise<PaymentEntity>;
  // Add to src/domain/repositories/payment.repository.ts

  findByInvoiceAsTenant(
    invoiceId: string,
    leaseIds: string[],
  ): Promise<PaymentEntity[]>;
}

export interface CreatePaymentData {
  invoiceId: string;
  ownerId: string;
  amount: string;
  method: import('../enums').PaymentMethod;
  idempotencyKeyId: string | null;
  createdBy: string;
}
