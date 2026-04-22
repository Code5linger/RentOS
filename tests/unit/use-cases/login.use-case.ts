import { IUserRepository } from '@domain/repositories/user.repository';
import { UnauthorizedError } from '@domain/errors/domain.errors';
import { PasswordService } from '@infrastructure/auth/password.service';
import { TokenService } from '@infrastructure/auth/token.service';
import { IRefreshTokenRepository } from '@infrastructure/database/repositories/refresh-token.repository.impl';
import { LoginDto } from '../dtos/login.dto';
import { PublicUser } from '@domain/entities/user.entity';

export interface LoginResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto, ipAddress: string | null): Promise<LoginResult> {
    // 1. Find user — same error for not found vs wrong password (no enumeration)
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 2. Verify password
    const isValid = await this.passwordService.verify(
      dto.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // 3. Revoke all existing refresh tokens for this user (single session)
    // Remove this line if you want multi-device support
    await this.refreshTokenRepository.revokeAllForUser(user.id);

    // 4. Generate fresh token pair
    const { accessToken, refreshToken, refreshTokenHash } =
      this.tokenService.generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
        ownerId: user.id,
      });

    // 5. Persist new refresh token
    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiryDate(),
      ipAddress,
    });

    const { passwordHash: _, deletedAt: __, ...publicUser } = user;

    return { user: publicUser, accessToken, refreshToken };
  }
}
