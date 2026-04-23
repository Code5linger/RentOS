// src/application/property/use-cases/create-unit.use-case.ts
import { IUnitRepository } from '@domain/repositories/unit.repository';
import { IPropertyRepository } from '@domain/repositories/property.repository';
import { UnitEntity } from '@domain/entities/unit.entity';
import { CreateUnitDto } from '../dtos/unit.dto';

export class CreateUnitUseCase {
  constructor(
    private readonly unitRepository: IUnitRepository,
    private readonly propertyRepository: IPropertyRepository,
  ) {}

  async execute(
    propertyId: string,
    dto: CreateUnitDto,
    ownerId: string,
  ): Promise<UnitEntity> {
    // Verify property exists and belongs to this owner
    await this.propertyRepository.findByIdOrThrow(propertyId, ownerId);

    return this.unitRepository.create({
      propertyId,
      unitNumber: dto.unitNumber,
      rentAmount: dto.rentAmount,
      createdBy: ownerId,
    });
  }
}
