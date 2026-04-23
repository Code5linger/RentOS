// tests/helpers/auth.helper.ts
import request from 'supertest';
import { Application } from 'express';
import { Role } from '../../src/domain/enums';

export interface TestUser {
  id: string;
  email: string;
  accessToken: string;
  refreshToken: string;
}

export async function registerAndLogin(
  app: Application,
  overrides: { email?: string; role?: Role } = {},
): Promise<TestUser> {
  const email = overrides.email ?? `test-${Date.now()}@rentos.test`;
  const password = 'Password1';
  const role = overrides.role ?? Role.OWNER;

  // Register
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password, role });

  if (registerRes.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(registerRes.body)}`);
  }

  return {
    id: registerRes.body.data.user.id,
    email,
    accessToken: registerRes.body.data.accessToken,
    refreshToken: registerRes.body.data.refreshToken,
  };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
