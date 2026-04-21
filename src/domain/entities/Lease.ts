// src/domain/entities/Lease.ts
import { LeaseStatus } from '@domain/enums';
import { Decimal } from '@prisma/client/runtime/library';

export interface Lease {
  id: string;
  unitId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date | null;
  monthlyRent: Decimal;
  billingDay: number;
  status: LeaseStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  deletedAt: Date | null;
}
