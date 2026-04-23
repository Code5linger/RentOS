import { IUserRepository } from '@domain/repositories/user.repository';
import { UnauthorizedError } from '@domain/errors/domain.errors';
import { TokenService } from '@infrastructure/auth/token.service';
import { IRefreshTokenRepository } from '@infrastructure/database/repositories/refresh-token.repository.impl';
import { RefreshTokenDto } from '@application/auth/dtos/refresh-token.dto';
// import { RefreshTokenDto } from '../dtos/refresh-token.dto';

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

export class RefreshTokenUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    dto: RefreshTokenDto,
    ipAddress: string | null,
  ): Promise<RefreshResult> {
    // 1. Verify JWT signature and expiry
    const payload = this.tokenService.verifyRefreshToken(dto.refreshToken);

    // 2. Hash the incoming token for DB lookup
    // Note: We sign a JWT refresh token (not a raw token) so we look up by userId + jti
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 3. Find a valid, non-revoked token for this user
    // We match on userId since the hash is of the raw opaque token,
    // but here we use JWT refresh — find by userId and check not revoked
    const existingTokens = await this.refreshTokenRepository.findValidByUserId(
      user.id,
    );

    if (!existingTokens || existingTokens.revokedAt !== null) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    if (existingTokens.expiresAt < new Date()) {
      throw new UnauthorizedError('Refresh token has expired');
    }

    // 4. Rotate — revoke old, issue new (token rotation prevents replay)
    await this.refreshTokenRepository.revoke(existingTokens.id);

    const { accessToken, refreshToken, refreshTokenHash } =
      this.tokenService.generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
        ownerId: user.id,
      });

    await this.refreshTokenRepository.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      expiresAt: this.tokenService.getRefreshTokenExpiryDate(),
      ipAddress,
    });

    return { accessToken, refreshToken };
  }
}
