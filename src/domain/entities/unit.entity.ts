// src/domain/entities/unit.entity.ts
export interface UnitEntity {
  id: string;
  propertyId: string;
  unitNumber: string;
  rentAmount: string; // Decimal as string
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt: Date | null;
}
