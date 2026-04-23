// src/application/tenant/use-cases/get-my-dashboard.use-case.ts
import { TenantContextService } from '../services/tenant-context.service';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { InvoiceStatus } from '@domain/enums';
import { InvoiceReconciler } from '@domain/services/invoice-reconciler';
import { LeaseStatus } from '@domain/enums';

export interface TenantDashboard {
  activeLeaseCount: number;
  overdueInvoiceCount: number;
  pendingInvoiceCount: number;
  totalOutstanding: string;
  recentInvoices: Array<{
    id: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    totalAmount: string;
    paidAmount: string;
    remainingBalance: string;
    status: string;
    dueDate: Date;
  }>;
}

export class GetMyDashboardUseCase {
  private readonly reconciler = new InvoiceReconciler();

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
  ) {}

  async execute(tenantId: string): Promise<TenantDashboard> {
    const context = await this.tenantContextService.resolve(tenantId);

    const activeLeaseCount = context.leases.filter(
      (l) => l.status === LeaseStatus.ACTIVE,
    ).length;

    if (context.leaseIds.length === 0) {
      return {
        activeLeaseCount,
        overdueInvoiceCount: 0,
        pendingInvoiceCount: 0,
        totalOutstanding: '0.00',
        recentInvoices: [],
      };
    }

    const allInvoices = await this.rentInvoiceRepository.findAllByTenant(
      tenantId,
      context.leaseIds,
    );

    // Compute summary in memory — no extra DB round trips
    let overdueCount = 0;
    let pendingCount = 0;
    let outstanding = '0.00';

    const Decimal = (await import('decimal.js')).default;
    let outstandingDecimal = new Decimal('0.00');

    for (const inv of allInvoices) {
      if (inv.status === InvoiceStatus.LATE) {
        overdueCount++;
        outstandingDecimal = outstandingDecimal.plus(
          this.reconciler.getRemainingBalance(inv.totalAmount, inv.paidAmount),
        );
      }
      if (inv.status === InvoiceStatus.PENDING) {
        pendingCount++;
        outstandingDecimal = outstandingDecimal.plus(
          this.reconciler.getRemainingBalance(inv.totalAmount, inv.paidAmount),
        );
      }
      if (inv.status === InvoiceStatus.PARTIAL) {
        outstandingDecimal = outstandingDecimal.plus(
          this.reconciler.getRemainingBalance(inv.totalAmount, inv.paidAmount),
        );
      }
    }

    outstanding = outstandingDecimal.toFixed(2);

    // Most recent 5 invoices
    const recentInvoices = allInvoices.slice(0, 5).map((inv) => ({
      id: inv.id,
      billingPeriodStart: inv.billingPeriodStart,
      billingPeriodEnd: inv.billingPeriodEnd,
      totalAmount: inv.totalAmount,
      paidAmount: inv.paidAmount,
      remainingBalance: this.reconciler.getRemainingBalance(
        inv.totalAmount,
        inv.paidAmount,
      ),
      status: inv.status,
      dueDate: inv.dueDate,
    }));

    return {
      activeLeaseCount,
      overdueInvoiceCount: overdueCount,
      pendingInvoiceCount: pendingCount,
      totalOutstanding: outstanding,
      recentInvoices,
    };
  }
}
