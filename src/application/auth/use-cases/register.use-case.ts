// src/application/auth/use-cases/register.use-case.ts
import { RegisterDto } from '../dtos/register.dto';

export interface RegisterUseCase {
  execute(data: RegisterDto, ip: string | null): Promise<any>;
}

export class RegisterUseCaseImpl implements RegisterUseCase {
  constructor(
    private userRepository: any,
    private refreshTokenRepository: any,
    private passwordService: any,
    private tokenService: any,
  ) {}

  async execute(data: RegisterDto, ip: string | null): Promise<any> {
    // TODO: Implement registration logic
    return { message: 'Registration not implemented yet' };
  }
}
