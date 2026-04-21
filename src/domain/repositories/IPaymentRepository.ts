// src/domain/repositories/IPaymentRepository.ts
import { Payment } from '@domain/entities/Payment';
import { PaymentMethod, PaymentStatus } from '@domain/enums';

export interface IPaymentRepository {
  findById(id: string, ownerId: string): Promise<Payment | null>;
  findByIdempotencyKey(keyId: string): Promise<Payment | null>;
  findByInvoice(invoiceId: string, ownerId: string): Promise<Payment[]>;
  create(data: CreatePaymentData): Promise<Payment>;
  updateStatus(
    id: string,
    status: PaymentStatus,
    transactionRef?: string,
  ): Promise<Payment>;
}

export interface CreatePaymentData {
  invoiceId: string;
  ownerId: string;
  amount: import('@prisma/client/runtime/library').Decimal;
  method: PaymentMethod;
  idempotencyKeyId: string | null;
  createdBy: string;
}
