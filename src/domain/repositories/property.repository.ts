// src/domain/repositories/property.repository.ts
import { PropertyEntity } from '../entities/property.entity';

export interface IPropertyRepository {
  findById(id: string, ownerId: string): Promise<PropertyEntity | null>;
  findByIdOrThrow(id: string, ownerId: string): Promise<PropertyEntity>;
  findAllByOwner(ownerId: string): Promise<PropertyEntity[]>;
  findByIdForTenant(id: string): Promise<PropertyEntity>;
  create(data: CreatePropertyData): Promise<PropertyEntity>;
  update(
    id: string,
    ownerId: string,
    data: UpdatePropertyData,
  ): Promise<PropertyEntity>;
  softDelete(id: string, ownerId: string): Promise<void>;
}

export interface CreatePropertyData {
  name: string;
  address: string;
  ownerId: string;
  createdBy: string;
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
}
