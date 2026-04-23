// src/infrastructure/scheduler/cron.ts
import cron from 'node-cron';
import { invoiceScheduler } from '@container';

export function startCronJobs(): void {
  // Run at midnight every day
  // Enqueues invoice generation jobs for all active leases
  cron.schedule('0 0 * * *', async () => {
    try {
      await invoiceScheduler.scheduleInvoiceGeneration();
    } catch (err) {
      console.error('[Cron] Invoice scheduling failed:', err);
    }
  });

  // Run at 01:00 daily — after generation sweep
  // Marks overdue invoices as LATE
  cron.schedule('0 1 * * *', async () => {
    try {
      await invoiceScheduler.scheduleLateDetection();
    } catch (err) {
      console.error('[Cron] Late detection scheduling failed:', err);
    }
  });

  console.log('✅ Cron jobs registered');
}
