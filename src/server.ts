// src/server.ts
import { createApp } from './app';
import { env } from '@config/env';
import { prisma } from '@infrastructure/database/prismaClient';
import { getRedisClient } from '@infrastructure/redis/redisClient';

async function bootstrap(): Promise<void> {
  // Verify DB connection before accepting traffic
  await prisma.$connect();
  console.log('[DB] Connected');

  const redis = getRedisClient();
  await redis.connect();

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log(
      `[Server] RentOS running on port ${env.PORT} (${env.NODE_ENV})`,
    );
  });

  // Graceful shutdown
  const shutdown = async (signal: string): Promise<void> => {
    console.log(`[Server] ${signal} received — shutting down gracefully`);
    server.close(async () => {
      await prisma.$disconnect();
      await redis.quit();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
