// src/domain/repositories/unit.repository.ts
import { UnitEntity } from '../entities/unit.entity';

export interface IUnitRepository {
  findById(id: string, ownerId: string): Promise<UnitEntity | null>;
  findByIdOrThrow(id: string, ownerId: string): Promise<UnitEntity>;
  findAllByProperty(propertyId: string, ownerId: string): Promise<UnitEntity[]>;
  findActiveLeaseExists(unitId: string): Promise<boolean>;
  create(data: CreateUnitData): Promise<UnitEntity>;
  update(
    id: string,
    ownerId: string,
    data: UpdateUnitData,
  ): Promise<UnitEntity>;
  softDelete(id: string, ownerId: string): Promise<void>;
}

export interface CreateUnitData {
  propertyId: string;
  unitNumber: string;
  rentAmount: string;
  createdBy: string;
}

export interface UpdateUnitData {
  unitNumber?: string;
  rentAmount?: string;
}
