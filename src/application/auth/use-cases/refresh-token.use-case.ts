// src/application/auth/use-cases/refresh-token.use-case.ts
import { RefreshTokenDto } from '../dtos/refresh-token.dto';

export interface RefreshTokenUseCase {
  execute(data: RefreshTokenDto, ip: string | null): Promise<any>;
}

export class RefreshTokenUseCaseImpl implements RefreshTokenUseCase {
  constructor(
    private userRepository: any,
    private refreshTokenRepository: any,
    private tokenService: any,
  ) {}

  async execute(data: RefreshTokenDto, ip: string | null): Promise<any> {
    // TODO: Implement refresh token logic
    return { message: 'Refresh token not implemented yet' };
  }
}
