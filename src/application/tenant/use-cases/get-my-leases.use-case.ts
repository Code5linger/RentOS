// src/application/tenant/use-cases/get-my-leases.use-case.ts
import { TenantContextService } from '../services/tenant-context.service';
import { LeaseEntity } from '@domain/entities/lease.entity';
import { IUnitRepository } from '@domain/repositories/unit.repository';
import { IPropertyRepository } from '@domain/repositories/property.repository';

export interface LeaseWithUnitSummary extends LeaseEntity {
  unit: {
    id: string;
    unitNumber: string;
    rentAmount: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
  };
}

export class GetMyLeasesUseCase {
  constructor(
    private readonly tenantContextService: TenantContextService,
    private readonly unitRepository: IUnitRepository,
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(tenantId: string): Promise<LeaseWithUnitSummary[]> {
    const context = await this.tenantContextService.resolve(tenantId);

    if (context.leases.length === 0) return [];

    // Enrich each lease with unit + property summary
    // Tenants need to know WHAT they're renting — but only their own unit
    const enriched = await Promise.all(
      context.leases.map(async (lease) => {
        const unit = await this.unitRepository.findByIdForTenant(lease.unitId);
        const property = await this.propertyRepository.findByIdForTenant(
          unit.propertyId,
        );

        return {
          ...lease,
          unit: {
            id: unit.id,
            unitNumber: unit.unitNumber,
            rentAmount: unit.rentAmount,
          },
          property: {
            id: property.id,
            name: property.name,
            address: property.address,
          },
        };
      }),
    );

    return enriched;
  }
}
