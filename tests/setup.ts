// tests/setup.ts
import { prisma } from '../src/infrastructure/database/prisma.client';
import { disconnectRedis } from '../src/infrastructure/redis/redis.client';

beforeAll(async () => {
  // Verify test DB is being used — hard fail if not
  const dbUrl = process.env['DATABASE_URL'] ?? '';
  if (!dbUrl.includes('test') && !dbUrl.includes('_test')) {
    throw new Error(
      '❌ DATABASE_URL does not appear to be a test database. ' +
        'Refusing to run integration tests against a non-test DB.',
    );
  }
});

afterAll(async () => {
  await prisma.$disconnect();
  await disconnectRedis();
});
