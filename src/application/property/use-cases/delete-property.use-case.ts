// src/application/property/use-cases/delete-property.use-case.ts
import { IPropertyRepository } from '@domain/repositories/property.repository';
import { IUnitRepository } from '@domain/repositories/unit.repository';
import { BusinessRuleError } from '@domain/errors/domain.errors';

export class DeletePropertyUseCase {
  constructor(
    private readonly propertyRepository: IPropertyRepository,
    private readonly unitRepository: IUnitRepository,
  ) {}

  async execute(propertyId: string, ownerId: string): Promise<void> {
    // Guard: cannot delete a property that has active unit leases
    const units = await this.unitRepository.findAllByProperty(
      propertyId,
      ownerId,
    );

    for (const unit of units) {
      const hasActiveLease = await this.unitRepository.findActiveLeaseExists(
        unit.id,
      );
      if (hasActiveLease) {
        throw new BusinessRuleError(
          'Cannot delete property with active leases. End all leases first.',
        );
      }
    }

    await this.propertyRepository.softDelete(propertyId, ownerId);
  }
}
