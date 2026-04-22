// src/application/property/use-cases/update-property.use-case.ts
import { IPropertyRepository } from '@domain/repositories/property.repository';
import { PropertyEntity } from '@domain/entities/property.entity';
import { UpdatePropertyDto } from '../dtos/property.dto';

export class UpdatePropertyUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(
    propertyId: string,
    dto: UpdatePropertyDto,
    ownerId: string,
  ): Promise<PropertyEntity> {
    return this.propertyRepository.update(propertyId, ownerId, dto);
  }
}
