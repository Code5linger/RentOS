// tests/integration/api/property.test.ts
import request from 'supertest';
import { createApp } from '../../../src/app';
import { clearDatabase } from '../../helpers/db.helper';
import {
  registerAndLogin,
  authHeader,
  TestUser,
} from '../../helpers/auth.helper';
import { createProperty, createUnit } from '../../helpers/seed.helper';
import { Role } from '../../../src/domain/enums';
import { Application } from 'express';

describe('Property API', () => {
  let app: Application;
  let owner: TestUser;
  let otherOwner: TestUser;

  beforeAll(() => {
    app = createApp();
  });
  beforeEach(async () => {
    await clearDatabase();
    owner = await registerAndLogin(app, {
      email: 'owner@test.com',
      role: Role.OWNER,
    });
    otherOwner = await registerAndLogin(app, {
      email: 'other@test.com',
      role: Role.OWNER,
    });
  });

  // ── POST /properties ─────────────────────────────────────

  describe('POST /api/v1/properties', () => {
    it('201 — OWNER creates a property', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .set(authHeader(owner.accessToken))
        .send({ name: 'Green Villa', address: '45 Mirpur Road, Dhaka' });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Green Villa');
      expect(res.body.data.ownerId).toBe(owner.id);
    });

    it('401 — unauthenticated request is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/properties')
        .send({ name: 'Test', address: 'Test Address' });

      expect(res.status).toBe(401);
    });

    it('403 — TENANT cannot create a property', async () => {
      const tenant = await registerAndLogin(app, {
        email: 'tenant@test.com',
        role: Role.TENANT,
      });

      const res = await request(app)
        .post('/api/v1/properties')
        .set(authHeader(tenant.accessToken))
        .send({ name: 'Test', address: 'Test Address' });

      expect(res.status).toBe(403);
    });
  });

  // ── GET /properties ──────────────────────────────────────

  describe('GET /api/v1/properties', () => {
    it('200 — OWNER only sees their own properties', async () => {
      await createProperty(app, owner, { name: 'Mine' });
      await createProperty(app, otherOwner, { name: 'Not Mine' });

      const res = await request(app)
        .get('/api/v1/properties')
        .set(authHeader(owner.accessToken));

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Mine');
    });
  });

  // ── PATCH /properties/:id ────────────────────────────────

  describe('PATCH /api/v1/properties/:propertyId', () => {
    it('200 — owner can update their property', async () => {
      const property = await createProperty(app, owner);

      const res = await request(app)
        .patch(`/api/v1/properties/${property.id}`)
        .set(authHeader(owner.accessToken))
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Name');
    });

    it("404 — owner cannot update another owner's property", async () => {
      const otherProperty = await createProperty(app, otherOwner);

      const res = await request(app)
        .patch(`/api/v1/properties/${otherProperty.id}`)
        .set(authHeader(owner.accessToken))
        .send({ name: 'Hijacked' });

      // Returns 404 not 403 — prevents property ID enumeration
      expect(res.status).toBe(404);
    });
  });

  // ── DELETE /properties/:id ───────────────────────────────

  describe('DELETE /api/v1/properties/:propertyId', () => {
    it('200 — soft deletes a property with no active leases', async () => {
      const property = await createProperty(app, owner);

      const res = await request(app)
        .delete(`/api/v1/properties/${property.id}`)
        .set(authHeader(owner.accessToken));

      expect(res.status).toBe(200);

      // Verify it no longer appears in list
      const listRes = await request(app)
        .get('/api/v1/properties')
        .set(authHeader(owner.accessToken));

      expect(listRes.body.data).toHaveLength(0);
    });
  });

  // ── POST /properties/:id/units ───────────────────────────

  describe('POST /api/v1/properties/:propertyId/units', () => {
    it('201 — creates unit under owner property', async () => {
      const property = await createProperty(app, owner);

      const res = await request(app)
        .post(`/api/v1/properties/${property.id}/units`)
        .set(authHeader(owner.accessToken))
        .send({ unitNumber: 'A1', rentAmount: '12000.00' });

      expect(res.status).toBe(201);
      expect(res.body.data.unitNumber).toBe('A1');
      expect(res.body.data.rentAmount).toBe('12000.00');
    });

    it('409 — duplicate unit number in same property', async () => {
      const property = await createProperty(app, owner);
      await createUnit(app, owner, property.id, { unitNumber: 'A1' });

      const res = await request(app)
        .post(`/api/v1/properties/${property.id}/units`)
        .set(authHeader(owner.accessToken))
        .send({ unitNumber: 'A1', rentAmount: '5000.00' });

      expect(res.status).toBe(409);
    });

    it("404 — cannot add unit to another owner's property", async () => {
      const otherProperty = await createProperty(app, otherOwner);

      const res = await request(app)
        .post(`/api/v1/properties/${otherProperty.id}/units`)
        .set(authHeader(owner.accessToken))
        .send({ unitNumber: 'B1', rentAmount: '5000.00' });

      expect(res.status).toBe(404);
    });
  });
});
