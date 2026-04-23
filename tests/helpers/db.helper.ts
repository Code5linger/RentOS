// tests/helpers/db.helper.ts
import { PrismaClient } from '@prisma/client';
import { prisma } from '../../src/infrastructure/database/prisma.client';

/**
 * Clears all tables in the correct FK order.
 * Called in beforeEach of each suite — not per-test (too slow).
 */
export async function clearDatabase(): Promise<void> {
  // Order matters — FK constraints
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      audit_logs,
      payments,
      idempotency_keys,
      rent_invoices,
      leases,
      units,
      properties,
      refresh_tokens,
      users
    RESTART IDENTITY CASCADE;
  `);
}

export { prisma };
