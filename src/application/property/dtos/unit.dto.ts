// src/application/property/dtos/unit.dto.ts
import { z } from 'zod';

export const CreateUnitSchema = z.object({
  unitNumber: z.string().min(1).max(20),
  rentAmount: z
    .string()
    .regex(
      /^\d+(\.\d{1,2})?$/,
      'Invalid amount format — use "5000" or "5000.00"',
    ),
});

export const UpdateUnitSchema = z
  .object({
    unitNumber: z.string().min(1).max(20).optional(),
    rentAmount: z
      .string()
      .regex(/^\d+(\.\d{1,2})?$/, 'Invalid amount format')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreateUnitDto = z.infer<typeof CreateUnitSchema>;
export type UpdateUnitDto = z.infer<typeof UpdateUnitSchema>;
