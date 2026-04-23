// src/application/auth/dtos/register.dto.ts
import { z } from 'zod';
import { Role } from '@domain/enums';

export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: z.nativeEnum(Role).refine((val) => val === Role.OWNER || val === Role.TENANT, {
    message: 'Role must be OWNER or TENANT',
  }),
  // ADMIN cannot self-register — only created by another ADMIN
});

export type RegisterDto = z.infer<typeof RegisterSchema>;
