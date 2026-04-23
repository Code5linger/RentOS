// tests/integration/api/tenant.test.ts
import request from 'supertest';
import { v4 as uuidv4 } from 'uuid';
import { createApp } from '../../../src/app';
import { clearDatabase, prisma } from '../../helpers/db.helper';
import {
  registerAndLogin,
  authHeader,
  TestUser,
} from '../../helpers/auth.helper';
import {
  createProperty,
  createUnit,
  createLease,
  createInvoiceDirectly,
} from '../../helpers/seed.helper';
import { Role, PaymentMethod } from '../../../src/domain/enums';
import { Application } from 'express';

describe('Tenant API (/me)', () => {
  let app: Application;
  let owner: TestUser;
  let tenant: TestUser;
  let leaseId: string;
  let invoiceId: string;

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
    const unit = await createUnit(app, owner, property.id);
    const lease = await createLease(app, owner, unit.id, tenant.id);
    leaseId = lease.id;

    const invoice = await createInvoiceDirectly(prisma, {
      leaseId,
      ownerId: owner.id,
      billingPeriodStart: new Date('2025-01-01'),
      billingPeriodEnd: new Date('2025-01-31'),
      totalAmount: '10000.00',
      dueDate: new Date('2025-01-05'),
    });
    invoiceId = invoice.id;
  });

  // ── GET /me/dashboard ────────────────────────────────────

  describe('GET /api/v1/me/dashboard', () => {
    it('200 — returns dashboard with correct outstanding balance', async () => {
      const res = await request(app)
        .get('/api/v1/me/dashboard')
        .set(authHeader(tenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.activeLeaseCount).toBe(1);
      expect(res.body.data.recentInvoices).toHaveLength(1);
    });

    it('403 — OWNER cannot access tenant dashboard', async () => {
      const res = await request(app)
        .get('/api/v1/me/dashboard')
        .set(authHeader(owner.accessToken));

      expect(res.status).toBe(403);
    });
  });

  // ── GET /me/leases ───────────────────────────────────────

  describe('GET /api/v1/me/leases', () => {
    it('200 — tenant sees only their leases with unit and property info', async () => {
      const res = await request(app)
        .get('/api/v1/me/leases')
        .set(authHeader(tenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(leaseId);
      expect(res.body.data[0].unit).toBeDefined();
      expect(res.body.data[0].property).toBeDefined();
      // Tenant must not see other tenants' data
      expect(res.body.data[0].unit.rentAmount).toBeDefined();
    });

    it('200 — tenant with no leases gets empty array', async () => {
      const newTenant = await registerAndLogin(app, {
        email: 'new@test.com',
        role: Role.TENANT,
      });

      const res = await request(app)
        .get('/api/v1/me/leases')
        .set(authHeader(newTenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // ── GET /me/invoices ─────────────────────────────────────

  describe('GET /api/v1/me/invoices', () => {
    it('200 — tenant sees their invoices', async () => {
      const res = await request(app)
        .get('/api/v1/me/invoices')
        .set(authHeader(tenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].remainingBalance).toBe('10000.00');
    });

    it('200 — invoices include remainingBalance field', async () => {
      // Make a partial payment first
      await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({ invoiceId, amount: '3000.00', method: PaymentMethod.CASH });

      const res = await request(app)
        .get('/api/v1/me/invoices')
        .set(authHeader(tenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data[0].remainingBalance).toBe('7000.00');
      expect(res.body.data[0].paidAmount).toBe('3000.00');
    });
  });

  // ── GET /me/invoices/:id ─────────────────────────────────

  describe('GET /api/v1/me/invoices/:invoiceId', () => {
    it('200 — tenant gets invoice detail with payments', async () => {
      const res = await request(app)
        .get(`/api/v1/me/invoices/${invoiceId}`)
        .set(authHeader(tenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data.invoice.id).toBe(invoiceId);
      expect(res.body.data.payments).toBeInstanceOf(Array);
    });

    it('404 — tenant cannot access another tenant invoice by probing ID', async () => {
      const otherTenant = await registerAndLogin(app, {
        email: 'other-tenant@test.com',
        role: Role.TENANT,
      });

      // otherTenant probes invoiceId that belongs to tenant
      const res = await request(app)
        .get(`/api/v1/me/invoices/${invoiceId}`)
        .set(authHeader(otherTenant.accessToken));

      // 404 not 403 — does not reveal existence
      expect(res.status).toBe(404);
    });
  });

  // ── GET /me/payments ─────────────────────────────────────

  describe('GET /api/v1/me/payments', () => {
    it('200 — returns payment history enriched with invoice info', async () => {
      await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({ invoiceId, amount: '5000.00', method: PaymentMethod.CASH });

      const res = await request(app)
        .get('/api/v1/me/payments')
        .set(authHeader(tenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].invoice).toBeDefined();
      expect(res.body.data[0].invoice.totalAmount).toBe('10000.00');
    });

    it('200 — tenant with no payments gets empty array', async () => {
      const res = await request(app)
        .get('/api/v1/me/payments')
        .set(authHeader(tenant.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });
  });
});
