// src/application/auth/use-cases/login.use-case.ts
import { LoginDto } from '../dtos/login.dto';

export interface LoginUseCase {
  execute(data: LoginDto, ip: string | null): Promise<any>;
}

export class LoginUseCaseImpl implements LoginUseCase {
  constructor(
    private userRepository: any,
    private refreshTokenRepository: any,
    private passwordService: any,
    private tokenService: any,
  ) {}

  async execute(data: LoginDto, ip: string | null): Promise<any> {
    // TODO: Implement login logic
    return { message: 'Login not implemented yet' };
  }
}
