// user.repository.ts
import { UserEntity } from '../entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  create(data: CreateUserData): Promise<UserEntity>;
  findByIdOrThrow(id: string): Promise<UserEntity>;
}

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: import('../enums').Role;
  createdBy: string | null;
}
