// src/domain/entities/User.ts
import { Role } from '@domain/enums';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  deletedAt: Date | null;
}

export type PublicUser = Omit<User, 'passwordHash' | 'deletedAt'>;
