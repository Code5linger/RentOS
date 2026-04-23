// src/application/tenant/dtos/tenant.dto.ts
import { z } from 'zod';
import { InvoiceStatus } from '@domain/enums';

export const TenantGetInvoicesQuerySchema = z.object({
  status:  z.nativeEnum(InvoiceStatus).optional(),
  leaseId: z.string().uuid().optional(),
});

export type TenantGetInvoicesQueryDto = z.infer<typeof TenantGetInvoicesQuerySchema>;