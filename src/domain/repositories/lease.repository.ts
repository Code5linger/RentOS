// lease.repository.ts
import { LeaseEntity } from '../entities/lease.entity';
import { LeaseStatus } from '../enums';

export interface ILeaseRepository {
  findById(id: string, ownerId: string): Promise<LeaseEntity | null>;
  findByIdOrThrow(id: string, ownerId: string): Promise<LeaseEntity>;
  findActiveByUnit(unitId: string): Promise<LeaseEntity | null>;
  findAllByOwner(ownerId: string, status?: LeaseStatus): Promise<LeaseEntity[]>;
  findAllActive(): Promise<LeaseEntity[]>;
  create(data: CreateLeaseData): Promise<LeaseEntity>;
  updateStatus(
    id: string,
    status: LeaseStatus,
    ownerId: string,
  ): Promise<LeaseEntity>;
  // Add to src/domain/repositories/lease.repository.ts

  findAllByTenant(tenantId: string): Promise<LeaseEntity[]>;
  findByIdAsTenant(
    leaseId: string,
    tenantId: string,
  ): Promise<LeaseEntity | null>;
  findByIdOrThrowAsTenant(
    leaseId: string,
    tenantId: string,
  ): Promise<LeaseEntity>;
}

export interface CreateLeaseData {
  unitId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate?: Date;
  monthlyRent: string;
  billingDay: number;
  createdBy: string;
}
