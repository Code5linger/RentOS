// src/application/lease/dtos/lease.dto.ts
import { z } from 'zod';

export const CreateLeaseSchema = z
  .object({
    unitId: z.string().uuid('Invalid unit ID'),
    tenantId: z.string().uuid('Invalid tenant ID'),
    startDate: z.string().date('Invalid date — use YYYY-MM-DD'),
    endDate: z.string().date('Invalid date — use YYYY-MM-DD').optional(),
    monthlyRent: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid rent amount'),
    billingDay: z
      .number()
      .int()
      .min(1, 'Billing day must be between 1 and 28')
      .max(28, 'Billing day must be between 1 and 28'),
  })
  .refine(
    (data) => {
      if (!data.endDate) return true;
      return new Date(data.endDate) > new Date(data.startDate);
    },
    { message: 'End date must be after start date', path: ['endDate'] },
  );

export const EndLeaseSchema = z.object({
  endDate: z.string().date().optional(), // defaults to today if not provided
});

export type CreateLeaseDto = z.infer<typeof CreateLeaseSchema>;
export type EndLeaseDto = z.infer<typeof EndLeaseSchema>;
