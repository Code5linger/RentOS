// tests/integration/api/lease.test.ts
import request from 'supertest';
import { createApp } from '../../../src/app';
import { clearDatabase } from '../../helpers/db.helper';
import {
  registerAndLogin,
  authHeader,
  TestUser,
} from '../../helpers/auth.helper';
import {
  createProperty,
  createUnit,
  createLease,
} from '../../helpers/seed.helper';
import { Role, LeaseStatus } from '../../../src/domain/enums';
import { Application } from 'express';

describe('Lease API', () => {
  let app: Application;
  let owner: TestUser;
  let tenant: TestUser;
  let propertyId: string;
  let unitId: string;

  beforeAll(() => {
    app = createApp();
  });
  beforeEach(async () => {
    await clearDatabase();
    owner = await registerAndLogin(app, {
      email: 'owner@test.com',
      role: Role.OWNER,
    });
    tenant = await registerAndLogin(app, {
      email: 'tenant@test.com',
      role: Role.TENANT,
    });

    const property = await createProperty(app, owner);
    propertyId = property.id;
    const unit = await createUnit(app, owner, propertyId);
    unitId = unit.id;
  });

  // ── POST /leases ─────────────────────────────────────────

  describe('POST /api/v1/leases', () => {
    it('201 — owner creates a lease for a tenant', async () => {
      const res = await request(app)
        .post('/api/v1/leases')
        .set(authHeader(owner.accessToken))
        .send({
          unitId,
          tenantId: tenant.id,
          startDate: '2025-01-01',
          monthlyRent: '10000.00',
          billingDay: 5,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe(LeaseStatus.ACTIVE);
      expect(res.body.data.tenantId).toBe(tenant.id);
      expect(res.body.data.ownerId).toBe(owner.id);
    });

    it('422 — cannot create lease if unit already has active lease', async () => {
      await createLease(app, owner, unitId, tenant.id);

      const res = await request(app)
        .post('/api/v1/leases')
        .set(authHeader(owner.accessToken))
        .send({
          unitId,
          tenantId: tenant.id,
          startDate: '2025-02-01',
          monthlyRent: '10000.00',
          billingDay: 5,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('403 — cannot assign OWNER user as a tenant', async () => {
      const anotherOwner = await registerAndLogin(app, {
        email: 'owner2@test.com',
        role: Role.OWNER,
      });

      const res = await request(app)
        .post('/api/v1/leases')
        .set(authHeader(owner.accessToken))
        .send({
          unitId,
          tenantId: anotherOwner.id,
          startDate: '2025-01-01',
          monthlyRent: '10000.00',
          billingDay: 5,
        });

      expect(res.status).toBe(403);
    });

    it('400 — billingDay 29 is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/leases')
        .set(authHeader(owner.accessToken))
        .send({
          unitId,
          tenantId: tenant.id,
          startDate: '2025-01-01',
          monthlyRent: '10000.00',
          billingDay: 29,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.fields.billingDay).toBeDefined();
    });
  });

  // ── PATCH /leases/:id/end ────────────────────────────────

  describe('PATCH /api/v1/leases/:leaseId/end', () => {
    it('200 — owner ends an active lease', async () => {
      const lease = await createLease(app, owner, unitId, tenant.id);

      const res = await request(app)
        .patch(`/api/v1/leases/${lease.id}/end`)
        .set(authHeader(owner.accessToken))
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(LeaseStatus.ENDED);
    });

    it('422 — cannot end an already-ended lease', async () => {
      const lease = await createLease(app, owner, unitId, tenant.id);

      await request(app)
        .patch(`/api/v1/leases/${lease.id}/end`)
        .set(authHeader(owner.accessToken))
        .send({});

      const res = await request(app)
        .patch(`/api/v1/leases/${lease.id}/end`)
        .set(authHeader(owner.accessToken))
        .send({});

      expect(res.status).toBe(422);
    });

    it('403 — TENANT cannot end a lease', async () => {
      const lease = await createLease(app, owner, unitId, tenant.id);

      const res = await request(app)
        .patch(`/api/v1/leases/${lease.id}/end`)
        .set(authHeader(tenant.accessToken))
        .send({});

      expect(res.status).toBe(403);
    });
  });
});
