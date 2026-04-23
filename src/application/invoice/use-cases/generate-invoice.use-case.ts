// src/application/invoice/use-cases/generate-invoice.use-case.ts
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { ILeaseRepository } from '@domain/repositories/lease.repository';
import { RentInvoiceEntity } from '@domain/entities/rent-invoice.entity';
import { LeaseStatus } from '@domain/enums';
import { BusinessRuleError, ConflictError } from '@domain/errors/domain.errors';
import { InvoiceDateCalculator } from '@domain/services/invoice-date-calculator';

export interface GenerateInvoiceInput {
  leaseId: string;
  ownerId: string;
  billingPeriodStart: Date;
}

export class GenerateInvoiceUseCase {
  private readonly calculator = new InvoiceDateCalculator();

  constructor(
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
    private readonly leaseRepository: ILeaseRepository,
  ) {}

  async execute(input: GenerateInvoiceInput): Promise<RentInvoiceEntity> {
    const { leaseId, ownerId, billingPeriodStart } = input;

    // 1. Load lease — scoped by ownerId (multi-tenant guard)
    const lease = await this.leaseRepository.findByIdOrThrow(leaseId, ownerId);

    // 2. Guard: only generate for active leases
    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BusinessRuleError(
        `Cannot generate invoice for lease with status: ${lease.status}`,
      );
    }

    // 3. Application-level idempotency check (before hitting DB constraint)
    const existing = await this.rentInvoiceRepository.findByLeasePeriod(
      leaseId,
      billingPeriodStart,
    );
    if (existing) {
      // Not an error — idempotent. Return the existing invoice.
      return existing;
    }

    // 4. Compute billing period deterministically
    const period = this.calculator.getBillingPeriod(
      billingPeriodStart,
      lease.billingDay,
    );

    // 5. Create invoice — DB unique constraint is the final safety net
    try {
      return await this.rentInvoiceRepository.create({
        leaseId,
        ownerId,
        billingPeriodStart: period.billingPeriodStart,
        billingPeriodEnd: period.billingPeriodEnd,
        totalAmount: lease.monthlyRent,
        dueDate: period.dueDate,
        createdBy: 'system',
      });
    } catch (err) {
      if (err instanceof ConflictError) {
        // Race condition — another worker beat us. Fetch and return.
        const raceResult = await this.rentInvoiceRepository.findByLeasePeriod(
          leaseId,
          billingPeriodStart,
        );
        if (raceResult) return raceResult;
      }
      throw err;
    }
  }
}
