// src/infrastructure/queue/workers/mark-late.worker.ts
import { Worker, Job } from 'bullmq';
import { getRedisClient } from '@infrastructure/redis/redis.client';
import { QueueNames, MarkLateInvoicesJobData } from '../queues';
import { MarkLateInvoicesUseCase } from '@application/invoice/use-cases/mark-late-invoices.use-case';

export function createMarkLateWorker(
  markLateInvoicesUseCase: MarkLateInvoicesUseCase,
): Worker {
  const worker = new Worker<MarkLateInvoicesJobData>(
    QueueNames.MARK_LATE,
    async (job: Job<MarkLateInvoicesJobData>) => {
      const asOf = new Date(job.data.asOf);

      console.log(
        `[MarkLateWorker] Processing late detection as of ${asOf.toISOString()}`,
      );

      const result = await markLateInvoicesUseCase.execute(asOf);

      console.log(
        `[MarkLateWorker] Marked ${result.markedCount} invoices as LATE`,
      );

      return result;
    },
    {
      connection: getRedisClient(),
      concurrency: 1, // Late detection is a single global sweep — no parallelism needed
    },
  );

  worker.on('failed', (job, err) => {
    console.error(
      `[MarkLateWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
    );
  });

  worker.on('error', (err) => {
    console.error('[MarkLateWorker] Worker error:', err);
  });

  return worker;
}
