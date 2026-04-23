// src/presentation/routes/health.routes.ts
import { Router } from 'express';
import { prisma } from '@infrastructure/database/prisma.client';
import { getRedisClient } from '@infrastructure/redis/redis.client';
import { invoiceQueue, markLateQueue } from '@infrastructure/queue/queues';

const router = Router();

interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  checks: {
    database: CheckResult;
    redis: CheckResult;
    queues: CheckResult;
  };
}

interface CheckResult {
  status: 'ok' | 'down';
  latency: number;
  error?: string;
}

async function checkDatabase(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown',
    };
  }
}

async function checkRedis(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await getRedisClient().ping();
    return { status: 'ok', latency: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown',
    };
  }
}

async function checkQueues(): Promise<CheckResult> {
  const start = Date.now();
  try {
    await Promise.all([invoiceQueue.getWorkers(), markLateQueue.getWorkers()]);
    return { status: 'ok', latency: Date.now() - start };
  } catch (err) {
    return {
      status: 'down',
      latency: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown',
    };
  }
}

router.get('/health', async (_req, res) => {
  const [database, redis, queues] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkQueues(),
  ]);

  const allOk = [database, redis, queues].every((c) => c.status === 'ok');

  const anyDown = [database, redis, queues].some((c) => c.status === 'down');

  const overallStatus: HealthStatus['status'] = allOk
    ? 'ok'
    : anyDown
      ? 'down'
      : 'degraded';

  const body: HealthStatus = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    checks: { database, redis, queues },
  };

  // 200 = healthy, 503 = any check failed
  res.status(overallStatus === 'ok' ? 200 : 503).json(body);
});

export { router as healthRouter };
