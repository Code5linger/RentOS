// src/application/tenant/use-cases/get-my-invoice-detail.use-case.ts
import { TenantContextService } from '../services/tenant-context.service';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { IPaymentRepository } from '@domain/repositories/payment.repository';
import { RentInvoiceEntity } from '@domain/entities/rent-invoice.entity';
import { PaymentEntity } from '@domain/entities/payment.entity';
import { InvoiceReconciler } from '@domain/services/invoice-reconciler';

export interface InvoiceDetail {
  invoice: RentInvoiceEntity & { remainingBalance: string };
  payments: PaymentEntity[];
}

export class GetMyInvoiceDetailUseCase {
  private readonly reconciler = new InvoiceReconciler();

  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
    private readonly paymentRepository: IPaymentRepository,
  ) {}

  async execute(tenantId: string, invoiceId: string): Promise<InvoiceDetail> {
    const context = await this.tenantContextService.resolve(tenantId);

    // findByIdOrThrowAsTenant uses leaseIds as the scope gate
    // If invoiceId belongs to another tenant's lease, this throws NotFoundError
    const invoice = await this.rentInvoiceRepository.findByIdOrThrowAsTenant(
      invoiceId,
      context.leaseIds,
    );

    const payments = await this.paymentRepository.findByInvoiceAsTenant(
      invoiceId,
      context.leaseIds,
    );

    return {
      invoice: {
        ...invoice,
        remainingBalance: this.reconciler.getRemainingBalance(
          invoice.totalAmount,
          invoice.paidAmount,
        ),
      },
      payments,
    };
  }
}
