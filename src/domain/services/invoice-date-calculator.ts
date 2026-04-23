// src/domain/services/invoice-date-calculator.ts

export interface BillingPeriod {
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
}

/**
 * Computes billing period and due date deterministically from
 * a lease start date and billing day.
 *
 * Rules:
 * - billingPeriodStart = first day of the billing month
 * - billingPeriodEnd   = last day of the billing month
 * - dueDate            = billingDay of the billing month (capped at month end)
 *
 * Example: lease starts 2025-01-15, billingDay=5
 *   → period: 2025-01-01 to 2025-01-31, due: 2025-01-05
 *
 * Example: lease starts 2025-01-15, billingDay=28
 *   → February period: 2025-02-01 to 2025-02-28, due: 2025-02-28
 */
export class InvoiceDateCalculator {
  /**
   * Returns the billing period for a given reference date and billing day.
   * The reference date determines WHICH month we're billing for.
   */
  getBillingPeriod(referenceDate: Date, billingDay: number): BillingPeriod {
    const year = referenceDate.getUTCFullYear();
    const month = referenceDate.getUTCMonth(); // 0-indexed

    const billingPeriodStart = new Date(Date.UTC(year, month, 1));
    const billingPeriodEnd = new Date(Date.UTC(year, month + 1, 0)); // day 0 = last day of month

    // Cap billingDay to the actual last day of month (handles Feb, 30-day months)
    const lastDayOfMonth = billingPeriodEnd.getUTCDate();
    const effectiveBillingDay = Math.min(billingDay, lastDayOfMonth);

    const dueDate = new Date(Date.UTC(year, month, effectiveBillingDay));

    return { billingPeriodStart, billingPeriodEnd, dueDate };
  }

  /**
   * Returns the next billing period start date after a given period.
   */
  getNextBillingPeriodStart(currentPeriodStart: Date): Date {
    const year = currentPeriodStart.getUTCFullYear();
    const month = currentPeriodStart.getUTCMonth();
    return new Date(Date.UTC(year, month + 1, 1));
  }

  /**
   * Returns all billing period starts between a lease start date and now.
   * Used by the recovery mechanism to backfill missed invoices.
   */
  getMissingPeriods(
    leaseStartDate: Date,
    billingDay: number,
    upToDate: Date,
  ): BillingPeriod[] {
    const periods: BillingPeriod[] = [];
    let cursor = new Date(
      Date.UTC(
        leaseStartDate.getUTCFullYear(),
        leaseStartDate.getUTCMonth(),
        1,
      ),
    );

    while (cursor <= upToDate) {
      periods.push(this.getBillingPeriod(cursor, billingDay));
      cursor = this.getNextBillingPeriodStart(cursor);
    }

    return periods;
  }

  /**
   * Determines if an invoice is overdue as of a given date.
   */
  isOverdue(dueDate: Date, asOf: Date): boolean {
    return dueDate < asOf;
  }
}
