// src/application/tenant/services/tenant-context.service.ts
import { ILeaseRepository } from '@domain/repositories/lease.repository';
import { LeaseEntity } from '@domain/entities/lease.entity';

export interface TenantContext {
  tenantId: string;
  leases: LeaseEntity[];
  leaseIds: string[];
}

export class TenantContextService {
  constructor(private readonly leaseRepository: ILeaseRepository) {}

  /**
   * Resolves all leases accessible to a tenant.
   * This is called at the start of every tenant use case.
   * Result is the scope boundary — nothing outside this is accessible.
   */
  async resolve(tenantId: string): Promise<TenantContext> {
    const leases = await this.leaseRepository.findAllByTenant(tenantId);
    return {
      tenantId,
      leases,
      leaseIds: leases.map((l) => l.id),
    };
  }

  /**
   * Asserts a specific lease belongs to this tenant.
   * Throws NotFoundError (not ForbiddenError) to prevent lease ID enumeration.
   */
  async assertLeaseAccess(
    tenantId: string,
    leaseId: string,
  ): Promise<LeaseEntity> {
    return this.leaseRepository.findByIdOrThrowAsTenant(leaseId, tenantId);
  }
}
