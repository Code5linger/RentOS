// src/application/property/use-cases/get-properties.use-case.ts
import { IPropertyRepository } from '@domain/repositories/property.repository';
import { PropertyEntity } from '@domain/entities/property.entity';

export class GetPropertiesUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(ownerId: string): Promise<PropertyEntity[]> {
    return this.propertyRepository.findAllByOwner(ownerId);
  }
}
