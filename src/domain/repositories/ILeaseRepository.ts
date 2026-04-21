// src/domain/repositories/ILeaseRepository.ts
import { Lease } from '@domain/entities/Lease';
import { LeaseStatus } from '@domain/enums';

export interface ILeaseRepository {
  findById(id: string, ownerId: string): Promise<Lease | null>;
  findActiveByUnit(unitId: string): Promise<Lease | null>;
  findAllByOwner(ownerId: string): Promise<Lease[]>;
  findActiveLeases(): Promise<Lease[]>; // for invoice generation job
  create(data: CreateLeaseData): Promise<Lease>;
  updateStatus(id: string, status: LeaseStatus): Promise<Lease>;
  softDelete(id: string): Promise<void>;
}

export interface CreateLeaseData {
  unitId: string;
  tenantId: string;
  ownerId: string;
  startDate: Date;
  endDate: Date | null;
  monthlyRent: import('@prisma/client/runtime/library').Decimal;
  billingDay: number;
  createdBy: string;
}
