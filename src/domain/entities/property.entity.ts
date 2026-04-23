// src/domain/entities/property.entity.ts
export interface PropertyEntity {
  id: string;
  ownerId: string;
  name: string;
  address: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt: Date | null;
}
