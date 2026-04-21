// src/domain/repositories/IInvoiceRepository.ts
import { RentInvoice } from '@domain/entities/RentInvoice';
import { InvoiceStatus } from '@domain/enums';

export interface IInvoiceRepository {
  findById(id: string, ownerId: string): Promise<RentInvoice | null>;
  findByLeaseAndPeriod(
    leaseId: string,
    periodStart: Date,
  ): Promise<RentInvoice | null>;
  findOverdueInvoices(asOf: Date): Promise<RentInvoice[]>;
  findAllByOwner(ownerId: string): Promise<RentInvoice[]>;
  create(data: CreateInvoiceData): Promise<RentInvoice>;
  updateStatus(id: string, status: InvoiceStatus): Promise<RentInvoice>;
  updatePaidAmount(
    id: string,
    paidAmount: import('@prisma/client/runtime/library').Decimal,
    status: InvoiceStatus,
  ): Promise<RentInvoice>;
  softDelete(id: string): Promise<void>;
}

export interface CreateInvoiceData {
  leaseId: string;
  ownerId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  totalAmount: import('@prisma/client/runtime/library').Decimal;
  dueDate: Date;
  createdBy: string;
}
