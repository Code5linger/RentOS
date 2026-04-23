// src/application/property/dtos/property.dto.ts
import { z } from 'zod';

export const CreatePropertySchema = z.object({
  name: z.string().min(1).max(100),
  address: z.string().min(5).max(300),
});

export const UpdatePropertySchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    address: z.string().min(5).max(300).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export type CreatePropertyDto = z.infer<typeof CreatePropertySchema>;
export type UpdatePropertyDto = z.infer<typeof UpdatePropertySchema>;
