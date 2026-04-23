// src/application/payment/dtos/payment.dto.ts
import { z } from 'zod';
import { PaymentMethod } from '@domain/enums';

export const InitiatePaymentSchema = z.object({
  invoiceId: z.string().uuid('Invalid invoice ID'),
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount — use "5000" or "5000.50"')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than zero'),
  method: z.nativeEnum(PaymentMethod),
});

export const ConfirmPaymentSchema = z.object({
  transactionRef: z
    .string()
    .min(1, 'Transaction reference is required')
    .max(255),
});

export type InitiatePaymentDto = z.infer<typeof InitiatePaymentSchema>;
export type ConfirmPaymentDto = z.infer<typeof ConfirmPaymentSchema>;
