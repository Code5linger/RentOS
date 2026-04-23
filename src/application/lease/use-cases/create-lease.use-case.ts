// src/application/lease/use-cases/create-lease.use-case.ts
import { ILeaseRepository } from '@domain/repositories/lease.repository';
import { IUnitRepository } from '@domain/repositories/unit.repository';
import { IUserRepository } from '@domain/repositories/user.repository';
import { LeaseEntity } from '@domain/entities/lease.entity';
import { Role } from '@domain/enums';
import {
  BusinessRuleError,
  ForbiddenError,
} from '@domain/errors/domain.errors';
import { CreateLeaseDto } from '../dtos/lease.dto';
import { invoiceQueue } from '@infrastructure/queue/queues';

export class CreateLeaseUseCase {
  constructor(
    private readonly leaseRepository: ILeaseRepository,
    private readonly unitRepository: IUnitRepository,
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    dto: CreateLeaseDto,
    ownerId: string,
    actorId: string,
  ): Promise<LeaseEntity> {
    // 1. Verify unit belongs to owner and get propertyId
    const unit = await this.unitRepository.findByIdOrThrow(dto.unitId, ownerId);

    // 2. Verify unit is not already leased
    const existingLease = await this.leaseRepository.findActiveByUnit(
      dto.unitId,
    );
    if (existingLease) {
      throw new BusinessRuleError(
        'Unit already has an active lease. End the existing lease before creating a new one.',
      );
    }

    // 3. Verify tenant exists and has TENANT role
    const tenant = await this.userRepository.findByIdOrThrow(dto.tenantId);
    if (tenant.role !== Role.TENANT) {
      throw new ForbiddenError(
        'The specified user is not registered as a tenant.',
      );
    }

    // 4. Create lease
    const lease = await this.leaseRepository.create({
      propertyId: unit.propertyId,
      unitId: dto.unitId,
      tenantId: dto.tenantId,
      ownerId,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      monthlyRent: dto.monthlyRent,
      billingDay: dto.billingDay,
      createdBy: actorId,
    });

    // 5. Enqueue first invoice generation — non-blocking
    // The worker handles idempotency via the DB unique constraint
    await invoiceQueue.add(
      'generate-invoice',
      {
        leaseId: lease.id,
        ownerId,
        billingPeriodStart: dto.startDate,
      },
      { jobId: `invoice-${lease.id}-${dto.startDate}` }, // deterministic jobId
    );

    return lease;
  }
}
