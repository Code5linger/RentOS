// src/application/tenant/use-cases/get-my-invoices.use-case.ts
import { TenantContextService } from '../services/tenant-context.service';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { RentInvoiceEntity } from '@domain/entities/rent-invoice.entity';
import { InvoiceStatus } from '@domain/enums';
import { InvoiceReconciler } from '@domain/services/invoice-reconciler';

export interface InvoiceWithBalance extends RentInvoiceEntity {
  remainingBalance: string;
}

export class GetMyInvoicesUseCase {
  private readonly reconciler = new InvoiceReconciler();

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
  ) {}

  async execute(
    tenantId: string,
    filters: { status?: InvoiceStatus; leaseId?: string },
  ): Promise<InvoiceWithBalance[]> {
    const context = await this.tenantContextService.resolve(tenantId);

    if (context.leaseIds.length === 0) return [];

    // If filtering by leaseId, assert it belongs to this tenant
    let scopedLeaseIds = context.leaseIds;
    if (filters.leaseId) {
      if (!scopedLeaseIds.includes(filters.leaseId)) {
        return []; // Lease not in tenant's scope — return empty, not 403
      }
      scopedLeaseIds = [filters.leaseId];
    }

    const invoices = await this.rentInvoiceRepository.findAllByTenant(
      tenantId,
      scopedLeaseIds,
    );

    // Apply status filter in memory — avoids extra DB query
    const filtered = filters.status
      ? invoices.filter((inv) => inv.status === filters.status)
      : invoices;

    return filtered.map((invoice) => ({
      ...invoice,
      remainingBalance: this.reconciler.getRemainingBalance(
        invoice.totalAmount,
        invoice.paidAmount,
      ),
    }));
  }
}
