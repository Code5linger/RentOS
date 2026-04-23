// src/infrastructure/scheduler/invoice.scheduler.ts
import { ILeaseRepository } from '@domain/repositories/lease.repository';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { InvoiceDateCalculator } from '@domain/services/invoice-date-calculator';
import { LeaseStatus } from '@domain/enums';
import { invoiceQueue, markLateQueue } from '@infrastructure/queue/queues';

export class InvoiceScheduler {
  private readonly calculator = new InvoiceDateCalculator();

  constructor(
    private readonly leaseRepository: ILeaseRepository,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
  ) {}

  /**
   * Called once per day (by node-cron or system cron).
   *
   * Strategy:
   * 1. Load all ACTIVE leases
   * 2. For each lease, compute which periods are missing up to today
   * 3. Enqueue a generation job for each missing period
   * 4. Worker handles idempotency — safe to enqueue duplicates
   */
  async scheduleInvoiceGeneration(): Promise<void> {
    const today = new Date();
    console.log(
      `[Scheduler] Running invoice schedule at ${today.toISOString()}`,
    );

    // Load all active leases across ALL owners
    // This is a system-level operation — not owner-scoped
    const activeLeases = await this.leaseRepository.findAllActive();

    let enqueued = 0;
    let skipped = 0;

    for (const lease of activeLeases) {
      // Compute all periods from lease start to today
      const missingPeriods = this.calculator.getMissingPeriods(
        lease.startDate,
        lease.billingDay,
        today,
      );

      for (const period of missingPeriods) {
        // Check if invoice already exists — skip enqueue if so
        const existing = await this.rentInvoiceRepository.findByLeasePeriod(
          lease.id,
          period.billingPeriodStart,
        );

        if (existing) {
          skipped++;
          continue;
        }

        // Deterministic jobId — BullMQ deduplicates if already queued
        const jobId = `invoice::${lease.id}::${period.billingPeriodStart.toISOString()}`;

        await invoiceQueue.add(
          'generate-invoice',
          {
            leaseId: lease.id,
            ownerId: lease.ownerId,
            billingPeriodStart: period.billingPeriodStart.toISOString(),
          },
          {
            jobId,
            // Don't overwrite if already queued (BullMQ default)
          },
        );

        enqueued++;
      }
    }

    console.log(
      `[Scheduler] Invoice schedule complete. Enqueued: ${enqueued}, Skipped (exists): ${skipped}`,
    );
  }

  /**
   * Enqueues the late detection job.
   * Should run once daily, after invoice generation.
   */
  async scheduleLateDetection(): Promise<void> {
    const today = new Date();
    const jobId = `late-detection::${today.toISOString().slice(0, 10)}`;

    await markLateQueue.add(
      'mark-late-invoices',
      { asOf: today.toISOString() },
      {
        jobId, // One job per day max
      },
    );

    console.log(`[Scheduler] Late detection job enqueued: ${jobId}`);
  }
}
