// payment.entity.ts
import { PaymentMethod, PaymentStatus } from '../enums';

export interface PaymentEntity {
  id: string;
  invoiceId: string;
  ownerId: string;
  amount: string; // Decimal as string
  method: PaymentMethod;
  status: PaymentStatus;
  transactionRef: string | null;
  idempotencyKeyId: string | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}
