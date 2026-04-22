// src/domain/repositories/property.repository.ts
export interface IPropertyRepository {
  findById(id: string, ownerId: string): Promise<PropertyEntity | null>;
  findByIdOrThrow(id: string, ownerId: string): Promise<PropertyEntity>;
  findAllByOwner(ownerId: string): Promise<PropertyEntity[]>;
  create(data: CreatePropertyData): Promise<PropertyEntity>;
  update(
    id: string,
    ownerId: string,
    data: UpdatePropertyData,
  ): Promise<PropertyEntity>;
  softDelete(id: string, ownerId: string): Promise<void>;
}

export interface CreatePropertyData {
  ownerId: string;
  name: string;
  address: string;
  createdBy: string;
}

export interface UpdatePropertyData {
  name?: string;
  address?: string;
}
