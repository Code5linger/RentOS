// src/domain/entities/RentInvoice.ts
import { InvoiceStatus } from '@domain/enums';
import { Decimal } from '@prisma/client/runtime/library';

export interface RentInvoice {
  id: string;
  leaseId: string;
  ownerId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  totalAmount: Decimal;
  paidAmount: Decimal;
  dueDate: Date;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt: Date | null;
}
