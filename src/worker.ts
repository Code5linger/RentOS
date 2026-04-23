// src/worker.ts
import 'dotenv/config';
import { env } from '@config/env';
import {
  connectDatabase,
  disconnectDatabase,
} from '@infrastructure/database/prisma.client';
import {
  getRedisClient,
  disconnectRedis,
} from '@infrastructure/redis/redis.client';
import { startCronJobs } from '@infrastructure/scheduler/cron';
import {
  invoiceWorker,
  markLateWorker,
  invoiceQueue,
  markLateQueue,
  paymentQueue,
} from '@container';

async function startWorker(): Promise<void> {
  console.log('[Worker] Starting RentOS worker process...');

  await connectDatabase();

  const redis = getRedisClient();
  await redis.ping();
  console.log('✅ Redis reachable');

  console.log('✅ Invoice worker active');
  console.log('✅ Mark-late worker active');

  startCronJobs();

  console.log('[Worker] Worker process ready ✅');
}

async function shutdown(signal: string): Promise<void> {
  console.log(`[Worker Shutdown] ${signal} received`);

  await Promise.all([invoiceWorker.close(), markLateWorker.close()]);

  await Promise.all([
    invoiceQueue.close(),
    markLateQueue.close(),
    paymentQueue.close(),
  ]);

  await disconnectRedis();
  await disconnectDatabase();

  console.log('[Worker Shutdown] Clean exit ✅');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  console.error('[Worker Fatal] Unhandled rejection:', reason);
  shutdown('unhandledRejection').catch(() => process.exit(1));
});

startWorker().catch((err) => {
  console.error('[Worker Fatal] Startup error:', err);
  process.exit(1);
});
