// src/infrastructure/redis/redisClient.ts
import { Redis } from 'ioredis';
import { env } from '@config/env';

let redisInstance: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
      maxRetriesPerRequest: null, // required by BullMQ
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisInstance.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });

    redisInstance.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }

  return redisInstance;
}

export async function disconnectRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
