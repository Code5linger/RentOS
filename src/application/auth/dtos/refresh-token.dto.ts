// src/application/auth/dtos/refresh-token.dto.ts
import { z } from 'zod';

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export type RefreshTokenDto = z.infer<typeof RefreshTokenSchema>;
