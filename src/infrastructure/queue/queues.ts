// src/infrastructure/queue/queues.ts
import { Queue } from 'bullmq';
import { getRedisClient } from '@infrastructure/redis/redisClient';

export const QUEUE_NAMES = {
  INVOICE: 'invoice',
  PAYMENT: 'payment',
  NOTIFICATION: 'notification',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

const connection = getRedisClient();

export const invoiceQueue = new Queue(QUEUE_NAMES.INVOICE, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const paymentQueue = new Queue(QUEUE_NAMES.PAYMENT, {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'fixed', delay: 10000 },
    removeOnComplete: { count: 50 },
    removeOnFail: { count: 200 },
  },
});
