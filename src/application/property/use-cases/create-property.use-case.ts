// src/application/property/use-cases/create-property.use-case.ts
import { IPropertyRepository } from '@domain/repositories/property.repository';
import { PropertyEntity } from '@domain/entities/property.entity';
import { CreatePropertyDto } from '../dtos/property.dto';

export class CreatePropertyUseCase {
  constructor(private readonly propertyRepository: IPropertyRepository) {}

  async execute(
    dto: CreatePropertyDto,
    ownerId: string,
  ): Promise<PropertyEntity> {
    return this.propertyRepository.create({
      ownerId,
      name: dto.name,
      address: dto.address,
      createdBy: ownerId,
    });
  }
}
