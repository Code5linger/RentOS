// import 'dotenv/config';
// import app from './app';

// const PORT: number = Number(process.env.PORT) || 5000;

// const bootstrap = () => {
//   try {
//     app.listen(PORT, '0.0.0.0', () => {
//       console.log(
//         `RentOS Backend Server is running on http://localhost:${process.env.PORT}`,
//       );
//     });
//   } catch (error) {
//     console.log(`Failed to start server! Cause of: ${error}`);
//   }
// };

// // module.exports = app;
// export default app;
// bootstrap();

// src/server.ts
import 'dotenv/config';
import { env } from '@config/env';
import { createApp } from './app';
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
import { Server } from 'http';

let server: Server;

async function bootstrap(): Promise<void> {
  console.log(`[Bootstrap] Starting RentOS in ${env.NODE_ENV} mode...`);

  // ── 1. Database ────────────────────────────────────────────
  await connectDatabase();

  // ── 2. Redis ──────────────────────────────────────────────
  const redis = getRedisClient();
  await redis.ping(); // fail fast if Redis is unreachable
  console.log('✅ Redis reachable');

  // ── 3. HTTP Server ────────────────────────────────────────
  const app = createApp();
  server = app.listen(env.PORT, () => {
    console.log(`✅ HTTP server listening on port ${env.PORT}`);
  });

  // ── 4. BullMQ Workers ─────────────────────────────────────
  // Workers are already instantiated in the container.
  // Logging here confirms they are active.
  console.log('✅ Invoice worker active');
  console.log('✅ Mark-late worker active');

  // ── 5. Cron Jobs ──────────────────────────────────────────
  if (env.NODE_ENV !== 'test') {
    startCronJobs();
  }

  console.log('[Bootstrap] RentOS fully started ✅');
}

// ── Graceful Shutdown ──────────────────────────────────────────

async function shutdown(signal: string): Promise<void> {
  console.log(`\n[Shutdown] Received ${signal}. Shutting down gracefully...`);

  // 1. Stop accepting new HTTP connections
  if (server) {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('[Shutdown] HTTP server closed');
  }

  // 2. Close BullMQ workers — wait for in-progress jobs to finish
  await Promise.all([invoiceWorker.close(), markLateWorker.close()]);
  console.log('[Shutdown] BullMQ workers drained');

  // 3. Close BullMQ queues
  await Promise.all([
    invoiceQueue.close(),
    markLateQueue.close(),
    paymentQueue.close(),
  ]);
  console.log('[Shutdown] BullMQ queues closed');

  // 4. Disconnect Redis
  await disconnectRedis();
  console.log('[Shutdown] Redis disconnected');

  // 5. Disconnect DB — last, so workers can finish any final writes
  await disconnectDatabase();
  console.log('[Shutdown] Database disconnected');

  console.log('[Shutdown] Clean exit ✅');
  process.exit(0);
}

// ── Signal Handlers ────────────────────────────────────────────
// SIGTERM — sent by Docker/Kubernetes on container stop
// SIGINT  — sent by Ctrl+C in development
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ── Unhandled Rejections ───────────────────────────────────────
// Crash loudly — never swallow unhandled rejections silently
process.on('unhandledRejection', (reason) => {
  console.error('[Fatal] Unhandled rejection:', reason);
  shutdown('unhandledRejection').catch(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
  console.error('[Fatal] Uncaught exception:', err);
  shutdown('uncaughtException').catch(() => process.exit(1));
});

// ── Start ──────────────────────────────────────────────────────
bootstrap().catch((err) => {
  console.error('[Bootstrap] Fatal startup error:', err);
  process.exit(1);
});
