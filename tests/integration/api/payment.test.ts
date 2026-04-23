// tests/integration/api/payment.test.ts
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

describe('Payment API', () => {
  let app: Application;
  let owner: TestUser;
  let tenant: TestUser;
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

    // Create invoice directly — bypasses queue for test isolation
    const invoice = await createInvoiceDirectly(prisma, {
      leaseId: lease.id,
      ownerId: owner.id,
      billingPeriodStart: new Date('2025-01-01'),
      billingPeriodEnd: new Date('2025-01-31'),
      totalAmount: '10000.00',
      dueDate: new Date('2025-01-05'),
    });
    invoiceId = invoice.id;
  });

  // ── POST /payments ───────────────────────────────────────

  describe('POST /api/v1/payments', () => {
    it('201 — initiates a full payment successfully', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({
          invoiceId,
          amount: '10000.00',
          method: PaymentMethod.BANK_TRANSFER,
        });

      expect(res.status).toBe(201);
      expect(res.body.data.amount).toBe('10000.00');
      expect(res.body.data.status).toBe('SUCCESS');
    });

    it('201 — partial payment updates invoice to PARTIAL status', async () => {
      await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({
          invoiceId,
          amount: '4000.00',
          method: PaymentMethod.MOBILE_BANKING,
        });

      // Verify invoice reflects partial payment
      const invoiceRes = await request(app)
        .get(`/api/v1/invoices/${invoiceId}`)
        .set(authHeader(owner.accessToken));

      expect(invoiceRes.body.data.status).toBe('PARTIAL');
      expect(invoiceRes.body.data.paidAmount).toBe('4000.00');
    });

    it('422 — overpayment is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({
          invoiceId,
          amount: '99999.00', // more than total
          method: PaymentMethod.CASH,
        });

      expect(res.status).toBe(422);
      expect(res.body.error.code).toBe('BUSINESS_RULE_VIOLATION');
    });

    it('422 — cannot pay an already-paid invoice', async () => {
      // Pay in full
      await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({
          invoiceId,
          amount: '10000.00',
          method: PaymentMethod.CASH,
        });

      // Try to pay again
      const res = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({
          invoiceId,
          amount: '1000.00',
          method: PaymentMethod.CASH,
        });

      expect(res.status).toBe(422);
    });

    it('400 — missing Idempotency-Key header is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set(authHeader(owner.accessToken))
        .send({
          invoiceId,
          amount: '5000.00',
          method: PaymentMethod.CASH,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('MISSING_IDEMPOTENCY_KEY');
    });

    it('400 — non-UUID Idempotency-Key is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': 'not-a-uuid',
        })
        .send({
          invoiceId,
          amount: '5000.00',
          method: PaymentMethod.CASH,
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_IDEMPOTENCY_KEY');
    });

    // ── IDEMPOTENCY — the most important payment test ──────

    it('409 — duplicate Idempotency-Key on second request', async () => {
      const idempotencyKey = uuidv4();

      const first = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': idempotencyKey,
        })
        .send({
          invoiceId,
          amount: '5000.00',
          method: PaymentMethod.CASH,
        });

      expect(first.status).toBe(201);

      const second = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': idempotencyKey,
        })
        .send({
          invoiceId,
          amount: '5000.00',
          method: PaymentMethod.CASH,
        });

      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('IDEMPOTENCY_CONFLICT');
    });

    it('idempotency key is owner-scoped — same key different owner is allowed', async () => {
      const owner2 = await registerAndLogin(app, {
        email: 'owner2@test.com',
        role: Role.OWNER,
      });

      // Create a second invoice for owner2
      const prop2 = await createProperty(app, owner2);
      const unit2 = await createUnit(app, owner2, prop2.id);
      const tenant2 = await registerAndLogin(app, {
        email: 'tenant2@test.com',
        role: Role.TENANT,
      });
      const lease2 = await createLease(app, owner2, unit2.id, tenant2.id);
      const invoice2 = await createInvoiceDirectly(prisma, {
        leaseId: lease2.id,
        ownerId: owner2.id,
        billingPeriodStart: new Date('2025-01-01'),
        billingPeriodEnd: new Date('2025-01-31'),
        totalAmount: '10000.00',
        dueDate: new Date('2025-01-05'),
      });

      const sharedKey = uuidv4();

      const res1 = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner.accessToken),
          'Idempotency-Key': sharedKey,
        })
        .send({ invoiceId, amount: '5000.00', method: PaymentMethod.CASH });

      const res2 = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner2.accessToken),
          'Idempotency-Key': sharedKey, // same key, different owner
        })
        .send({
          invoiceId: invoice2.id,
          amount: '5000.00',
          method: PaymentMethod.CASH,
        });

      // Both should succeed — keys are owner-scoped
      expect(res1.status).toBe(201);
      expect(res2.status).toBe(201);
    });
  });

  // ── Multi-tenant isolation ───────────────────────────────

  describe('Multi-tenant isolation', () => {
    it("owner cannot pay another owner's invoice", async () => {
      const owner2 = await registerAndLogin(app, {
        email: 'owner2@test.com',
        role: Role.OWNER,
      });

      const res = await request(app)
        .post('/api/v1/payments')
        .set({
          ...authHeader(owner2.accessToken),
          'Idempotency-Key': uuidv4(),
        })
        .send({
          invoiceId, // belongs to owner, not owner2
          amount: '5000.00',
          method: PaymentMethod.CASH,
        });

      expect(res.status).toBe(404);
    });
  });
});
