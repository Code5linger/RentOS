// src/config/constants.ts

export const CONSTANTS = {
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  INVOICE: {
    // Grace period before PENDING → LATE (days after due date)
    LATE_GRACE_PERIOD_DAYS: 0,
    // How far back the scheduler looks for missed invoices
    SCHEDULER_LOOKBACK_MONTHS: 3,
  },

  IDEMPOTENCY: {
    // Header name — lowercase for Express header normalization
    HEADER: 'idempotency-key',
    TTL_HOURS: 24,
  },

  QUEUE: {
    INVOICE_CONCURRENCY: 5,
    MARK_LATE_CONCURRENCY: 1,
    PAYMENT_CONCURRENCY: 10,
  },

  BCRYPT: {
    MIN_ROUNDS: 10,
    DEFAULT_ROUNDS: 12,
  },
} as const;
