// src/domain/repositories/IUserRepository.ts
import { User } from '@domain/entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  softDelete(id: string): Promise<void>;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: import('@domain/enums').Role;
  createdBy: string | null;
}
