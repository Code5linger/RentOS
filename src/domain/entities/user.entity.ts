// user.entity.ts
import { Role } from '../enums';

export interface UserEntity {
  id: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
  deletedAt: Date | null;
}

// Safe public projection — never expose passwordHash over the wire
export type PublicUser = Omit<UserEntity, 'passwordHash' | 'deletedAt'>;
