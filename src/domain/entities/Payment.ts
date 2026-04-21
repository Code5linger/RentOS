// src/domain/entities/Payment.ts
import { PaymentMethod, PaymentStatus } from '@domain/enums';
import { Decimal } from '@prisma/client/runtime/library';

export interface Payment {
  id: string;
  invoiceId: string;
  ownerId: string;
  amount: Decimal;
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string | null;
  idempotencyKeyId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
