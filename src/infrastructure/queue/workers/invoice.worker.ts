// src/infrastructure/queue/workers/invoice.worker.ts
import { Worker, Job, UnrecoverableError } from 'bullmq';
import { getRedisClient } from '@infrastructure/redis/redis.client';
import { QueueNames, GenerateInvoiceJobData } from '../queues';
import { GenerateInvoiceUseCase } from '@application/invoice/use-cases/generate-invoice.use-case';
import { BusinessRuleError } from '@domain/errors/domain.errors';

export function createInvoiceWorker(
  generateInvoiceUseCase: GenerateInvoiceUseCase,
): Worker {
  const worker = new Worker<GenerateInvoiceJobData>(
    QueueNames.INVOICE,
    async (job: Job<GenerateInvoiceJobData>) => {
      const { leaseId, ownerId, billingPeriodStart } = job.data;

      console.log(
        `[InvoiceWorker] Processing job ${job.id} — lease: ${leaseId}, period: ${billingPeriodStart}`,
      );

      await generateInvoiceUseCase.execute({
        leaseId,
        ownerId,
        billingPeriodStart: new Date(billingPeriodStart),
      });

      console.log(`[InvoiceWorker] Job ${job.id} completed`);
    },
    {
      connection: getRedisClient(),
      concurrency: 5, // Process 5 invoices in parallel
    },
  );

  worker.on('failed', (job, err) => {
    if (err instanceof BusinessRuleError) {
      // Lease ended mid-cycle, etc. — don't retry, not a transient error
      console.warn(
        `[InvoiceWorker] Job ${job?.id} failed with business rule error (no retry): ${err.message}`,
      );
    } else {
      console.error(
        `[InvoiceWorker] Job ${job?.id} failed (attempt ${job?.attemptsMade}): ${err.message}`,
      );
    }
  });

  worker.on('error', (err) => {
    console.error('[InvoiceWorker] Worker error:', err);
  });

  return worker;
}
