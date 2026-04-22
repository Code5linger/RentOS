// src/application/lease/use-cases/end-lease.use-case.ts
import { ILeaseRepository } from '@domain/repositories/lease.repository';
import { LeaseEntity } from '@domain/entities/lease.entity';
import { LeaseStatus } from '@domain/enums';
import { BusinessRuleError } from '@domain/errors/domain.errors';
import { EndLeaseDto } from '../dtos/lease.dto';

export class EndLeaseUseCase {
  constructor(private readonly leaseRepository: ILeaseRepository) {}

  async execute(
    leaseId: string,
    dto: EndLeaseDto,
    ownerId: string,
  ): Promise<LeaseEntity> {
    const lease = await this.leaseRepository.findByIdOrThrow(leaseId, ownerId);

    if (lease.status === LeaseStatus.ENDED) {
      throw new BusinessRuleError('Lease is already ended.');
    }

    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    if (endDate < lease.startDate) {
      throw new BusinessRuleError(
        'End date cannot be before the lease start date.',
      );
    }

    return this.leaseRepository.updateStatus(
      leaseId,
      LeaseStatus.ENDED,
      ownerId,
    );
  }
}
