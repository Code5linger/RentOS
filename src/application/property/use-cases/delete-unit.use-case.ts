// src/application/property/use-cases/delete-unit.use-case.ts
import { IUnitRepository } from '@domain/repositories/unit.repository';

export class DeleteUnitUseCase {
  constructor(private readonly unitRepository: IUnitRepository) {}

  async execute(unitId: string, ownerId: string): Promise<void> {
    // Business rule check is inside softDelete — active lease guard
    await this.unitRepository.softDelete(unitId, ownerId);
  }
}
