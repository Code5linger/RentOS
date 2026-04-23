// src/application/invoice/dtos/invoice.dto.ts
import { z } from 'zod';
import { InvoiceStatus } from '@domain/enums';

export const GetInvoicesQuerySchema = z.object({
  status: z.nativeEnum(InvoiceStatus).optional(),
  leaseId: z.string().uuid().optional(),
});

export type GetInvoicesQueryDto = z.infer<typeof GetInvoicesQuerySchema>;
