// src/application/tenant/use-cases/get-my-payment-history.use-case.ts
import { TenantContextService } from '../services/tenant-context.service';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { IPaymentRepository } from '@domain/repositories/payment.repository';
import { PaymentEntity } from '@domain/entities/payment.entity';
import { RentInvoiceEntity } from '@domain/entities/rent-invoice.entity';

export interface PaymentWithInvoice extends PaymentEntity {
  invoice: {
    id: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    totalAmount: string;
    status: string;
  };
}

export class GetMyPaymentHistoryUseCase {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(tenantId: string): Promise<PaymentWithInvoice[]> {
    const context = await this.tenantContextService.resolve(tenantId);

    if (context.leaseIds.length === 0) return [];

    // Load all invoices in scope
    const invoices = await this.rentInvoiceRepository.findAllByTenant(
      tenantId,
      context.leaseIds,
    );

    if (invoices.length === 0) return [];

    // Build invoice map for enrichment
    const invoiceMap = new Map<string, RentInvoiceEntity>(
      invoices.map((inv) => [inv.id, inv]),
    );

    // Load all payments across all tenant invoices in parallel
    const paymentArrays = await Promise.all(
      invoices.map((inv) =>
        this.paymentRepository.findByInvoiceAsTenant(inv.id, context.leaseIds),
      ),
    );

    const allPayments = paymentArrays.flat();

    // Sort by most recent first
    allPayments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    // Enrich with invoice summary
    return allPayments.map((payment) => {
      const invoice = invoiceMap.get(payment.invoiceId)!;
      return {
        ...payment,
        invoice: {
          id: invoice.id,
          billingPeriodStart: invoice.billingPeriodStart,
          billingPeriodEnd: invoice.billingPeriodEnd,
          totalAmount: invoice.totalAmount,
          status: invoice.status,
        },
      };
    });
  }
}
