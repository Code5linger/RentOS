// lease.entity.ts
import { LeaseStatus } from '../enums';

export interface LeaseEntity {
  id: string;
  unitId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date | null;
  monthlyRent: string; // Decimal as string — never convert to float
  billingDay: number;
  status: LeaseStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt: Date | null;
}
