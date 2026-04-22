// rent-invoice.entity.ts
import { InvoiceStatus } from '../enums';

export interface RentInvoiceEntity {
  id: string;
  leaseId: string;
  ownerId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  totalAmount: string; // Decimal as string
  paidAmount: string; // Decimal as string
  dueDate: Date;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt: Date | null;
}
