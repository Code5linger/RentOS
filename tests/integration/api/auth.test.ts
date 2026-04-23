// tests/integration/api/auth.test.ts
import request from 'supertest';
import { createApp } from '../../../src/app';
import { clearDatabase } from '../../helpers/db.helper';
import { Role } from '../../../src/domain/enums';
import { Application } from 'express';

describe('Auth API', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });
  beforeEach(async () => {
    await clearDatabase();
  });

  // ── POST /auth/register ──────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('201 — registers an OWNER successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'owner@test.com',
        password: 'Password1',
        role: Role.OWNER,
      });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('owner@test.com');
      expect(res.body.data.user.role).toBe(Role.OWNER);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // Critical — password must never appear in response
      expect(JSON.stringify(res.body)).not.toContain('password');
      expect(JSON.stringify(res.body)).not.toContain('hash');
    });

    it('201 — registers a TENANT successfully', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'tenant@test.com',
        password: 'Password1',
        role: Role.TENANT,
      });

      expect(res.status).toBe(201);
      expect(res.body.data.user.role).toBe(Role.TENANT);
    });

    it('409 — duplicate email returns conflict', async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'dup@test.com',
        password: 'Password1',
        role: Role.OWNER,
      });

      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'dup@test.com',
        password: 'Password1',
        role: Role.OWNER,
      });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('400 — weak password fails validation', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'weak@test.com', password: 'weak', role: Role.OWNER });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.fields.password).toBeDefined();
    });

    it('400 — invalid email format fails validation', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'not-an-email',
        password: 'Password1',
        role: Role.OWNER,
      });

      expect(res.status).toBe(400);
    });

    it('400 — ADMIN role cannot self-register', async () => {
      const res = await request(app).post('/api/v1/auth/register').send({
        email: 'admin@test.com',
        password: 'Password1',
        role: Role.ADMIN,
      });

      expect(res.status).toBe(400);
    });
  });

  // ── POST /auth/login ─────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/v1/auth/register').send({
        email: 'user@test.com',
        password: 'Password1',
        role: Role.OWNER,
      });
    });

    it('200 — returns token pair on valid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@test.com', password: 'Password1' });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
    });

    it('401 — wrong password returns invalid credentials', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'user@test.com', password: 'WrongPass1' });

      expect(res.status).toBe(401);
      // Must not reveal whether email exists (no enumeration)
      expect(res.body.error.message).toBe('Invalid credentials');
    });

    it('401 — non-existent email returns same error as wrong password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'ghost@test.com', password: 'Password1' });

      expect(res.status).toBe(401);
      expect(res.body.error.message).toBe('Invalid credentials');
    });
  });

  // ── POST /auth/refresh ───────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('200 — issues new token pair from valid refresh token', async () => {
      const register = await request(app).post('/api/v1/auth/register').send({
        email: 'refresh@test.com',
        password: 'Password1',
        role: Role.OWNER,
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: register.body.data.refreshToken });

      expect(res.status).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      expect(res.body.data.refreshToken).toBeDefined();
      // New tokens must differ from original
      expect(res.body.data.accessToken).not.toBe(
        register.body.data.accessToken,
      );
    });

    it('401 — invalid refresh token is rejected', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'not.a.valid.token' });

      expect(res.status).toBe(401);
    });
  });
});
