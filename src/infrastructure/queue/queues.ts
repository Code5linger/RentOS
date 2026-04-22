import { Queue } from 'bullmq';
import { getRedisClient } from '../redis/redis.client';

export const QueueNames = {
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  NOTIFICATION: 'notification',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

// Job payload types — strictly typed, no any
export interface GenerateInvoiceJobData {
  leaseId: string;
  ownerId: string;
  billingPeriodStart: string; // ISO string — dates don't serialize safely as Date
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

export const invoiceQueue = new Queue<GenerateInvoiceJobData>(
  QueueNames.INVOICE,
  {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000, // 5s, 10s, 20s
      },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  },
);

export const paymentQueue = new Queue<PaymentStatusJobData>(
  QueueNames.PAYMENT,
  {
    connection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: { count: 200 },
      removeOnFail: { count: 1000 },
    },
  },
);
