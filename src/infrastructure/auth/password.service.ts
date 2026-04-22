import bcrypt from 'bcryptjs';
import { env } from '@config/env';

export class PasswordService {
  async hash(plaintext: string): Promise<string> {
    return bcrypt.hash(plaintext, env.BCRYPT_ROUNDS);
  }

  async verify(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
  }
}
