// tests/helpers/seed.helper.ts
import request from 'supertest';
import { Application } from 'express';
import { authHeader, TestUser } from './auth.helper';
import { PaymentMethod } from '../../src/domain/enums';

export async function createProperty(
  app: Application,
  owner: TestUser,
  overrides: { name?: string; address?: string } = {},
) {
  const res = await request(app)
    .post('/api/v1/properties')
    .set(authHeader(owner.accessToken))
    .send({
      name: overrides.name ?? 'Test Property',
      address: overrides.address ?? '123 Test Street, Dhaka',
    });

  if (res.status !== 201) {
    throw new Error(`createProperty failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export async function createUnit(
  app: Application,
  owner: TestUser,
  propertyId: string,
  overrides: { unitNumber?: string; rentAmount?: string } = {},
) {
  const res = await request(app)
    .post(`/api/v1/properties/${propertyId}/units`)
    .set(authHeader(owner.accessToken))
    .send({
      unitNumber: overrides.unitNumber ?? 'A1',
      rentAmount: overrides.rentAmount ?? '10000.00',
    });

  if (res.status !== 201) {
    throw new Error(`createUnit failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export async function createLease(
  app: Application,
  owner: TestUser,
  unitId: string,
  tenantId: string,
  overrides: Partial<{
    startDate: string;
    monthlyRent: string;
    billingDay: number;
  }> = {},
) {
  const res = await request(app)
    .post('/api/v1/leases')
    .set(authHeader(owner.accessToken))
    .send({
      unitId,
      tenantId,
      startDate: overrides.startDate ?? '2025-01-01',
      monthlyRent: overrides.monthlyRent ?? '10000.00',
      billingDay: overrides.billingDay ?? 5,
    });

  if (res.status !== 201) {
    throw new Error(`createLease failed: ${JSON.stringify(res.body)}`);
  }
  return res.body.data;
}

export async function createInvoiceDirectly(
  prisma: any,
  data: {
    leaseId: string;
    ownerId: string;
    billingPeriodStart: Date;
    billingPeriodEnd: Date;
    totalAmount: string;
    dueDate: Date;
  },
) {
  return prisma.rentInvoice.create({
    data: {
      ...data,
      paidAmount: 0,
      status: 'PENDING',
      createdBy: 'test',
    },
  });
}
