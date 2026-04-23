// src/application/invoice/use-cases/mark-late-invoices.use-case.ts
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { InvoiceStatus } from '@domain/enums';

export interface MarkLateResult {
  markedCount: number;
  invoiceIds: string[];
}

export class MarkLateInvoicesUseCase {
  constructor(private readonly rentInvoiceRepository: IRentInvoiceRepository) {}

  async execute(asOf: Date): Promise<MarkLateResult> {
    // 1. Find all PENDING/PARTIAL invoices past their due date
    const overdueInvoices =
      await this.rentInvoiceRepository.findOverdueUnpaid(asOf);

    if (overdueInvoices.length === 0) {
      return { markedCount: 0, invoiceIds: [] };
    }

    const ids = overdueInvoices.map((inv) => inv.id);

    // 2. Bulk update — single DB roundtrip regardless of count
    await this.rentInvoiceRepository.bulkUpdateStatus(ids, InvoiceStatus.LATE);

    return { markedCount: ids.length, invoiceIds: ids };
  }
}
