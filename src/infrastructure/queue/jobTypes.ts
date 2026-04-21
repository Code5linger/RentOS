// src/infrastructure/queue/jobTypes.ts

export type InvoiceJobType = 'GENERATE_INVOICE' | 'MARK_LATE';
export type PaymentJobType = 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED';
export type NotificationJobType = 'RENT_LATE' | 'PAYMENT_RECEIVED';

export interface GenerateInvoiceJobData {
  leaseId: string;
  ownerId: string;
  billingPeriodStart: string; // ISO string — dates don't serialize safely in queues
  billingPeriodEnd: string;
  dueDate: string;
}

export interface MarkLateJobData {
  invoiceId: string;
  ownerId: string;
}

export interface PaymentSuccessJobData {
  paymentId: string;
  invoiceId: string;
  ownerId: string;
  amount: string; // Decimal serialized as string
}

export interface PaymentFailedJobData {
  paymentId: string;
  invoiceId: string;
  ownerId: string;
  reason: string;
}

export interface RentLateNotificationData {
  invoiceId: string;
  tenantId: string;
  ownerId: string;
  daysLate: number;
}
