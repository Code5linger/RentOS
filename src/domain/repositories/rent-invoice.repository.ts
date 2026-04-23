// rent-invoice.repository.ts
import { RentInvoiceEntity } from '../entities/rent-invoice.entity';
import { InvoiceStatus } from '../enums';

export interface IRentInvoiceRepository {
  findById(id: string, ownerId: string): Promise<RentInvoiceEntity | null>;
  findByIdOrThrow(id: string, ownerId: string): Promise<RentInvoiceEntity>;
  findByLeasePeriod(
    leaseId: string,
    billingPeriodStart: Date,
  ): Promise<RentInvoiceEntity | null>;
  findOverdueUnpaid(asOf: Date): Promise<RentInvoiceEntity[]>;
  findAllByOwner(
    ownerId: string,
    status?: InvoiceStatus,
  ): Promise<RentInvoiceEntity[]>;
  create(data: CreateInvoiceData): Promise<RentInvoiceEntity>;
  updatePaidAmount(
    id: string,
    paidAmount: string,
    status: InvoiceStatus,
    ownerId: string,
  ): Promise<RentInvoiceEntity>;
  bulkUpdateStatus(ids: string[], status: InvoiceStatus): Promise<void>;
}

export interface CreateInvoiceData {
  leaseId: string;
  ownerId: string;
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  totalAmount: string;
  dueDate: Date;
  createdBy: string;
}
