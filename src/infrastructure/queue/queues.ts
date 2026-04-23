// src/infrastructure/queue/queues.ts  — updated
import { Queue } from 'bullmq';
import { getRedisClient } from '../redis/redis.client';

export const QueueNames = {
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  MARK_LATE: 'mark-late',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

export interface GenerateInvoiceJobData {
  leaseId: string;
  ownerId: string;
  billingPeriodStart: string; // ISO string — never Date in job payloads
}

export interface MarkLateInvoicesJobData {
  asOf: string; // ISO string
}

export interface PaymentStatusJobData {
  paymentId: string;
  ownerId: string;
  transactionRef: string;
}

const connection = getRedisClient();

const defaultJobOptions = {
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

export const invoiceQueue = new Queue<GenerateInvoiceJobData>(
  QueueNames.INVOICE,
  {
    connection,
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
    },
  },
);

export const markLateQueue = new Queue<MarkLateInvoicesJobData>(
  QueueNames.MARK_LATE,
  {
    connection,
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 5,
      backoff: { type: 'exponential', delay: 10_000 },
    },
  },
);

export const paymentQueue = new Queue<PaymentStatusJobData>(
  QueueNames.PAYMENT,
  {
    connection,
    defaultJobOptions: {
      ...defaultJobOptions,
      attempts: 5,
      backoff: { type: 'exponential', delay: 2_000 },
    },
  },
);
