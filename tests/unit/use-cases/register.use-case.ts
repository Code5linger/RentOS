import { IUserRepository } from '@domain/repositories/user.repository';
import { Role } from '@domain/enums';
import { ConflictError } from '@domain/errors/domain.errors';
import { PasswordService } from '@infrastructure/auth/password.service';
import { TokenService } from '@infrastructure/auth/token.service';
import { IRefreshTokenRepository } from '@infrastructure/database/repositories/refresh-token.repository.impl';
import { RegisterDto } from '../dtos/register.dto';
import { PublicUser } from '@domain/entities/user.entity';

export interface RegisterResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export class RegisterUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(
    dto: RegisterDto,
    ipAddress: string | null,
  ): Promise<RegisterResult> {
    // 1. Check uniqueness
    const existing = await this.userRepository.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('An account with this email already exists');
    }

    // 2. Hash password
    const passwordHash = await this.passwordService.hash(dto.password);

    // 3. Create user
    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
      createdBy: null, // self-registered
    });

    // 4. Generate tokens
    const { accessToken, refreshToken, refreshTokenHash } =
      this.tokenService.generateTokenPair({
        sub: user.id,
        email: user.email,
        role: user.role,
        ownerId: user.role === Role.OWNER ? user.id : user.id, // resolved properly at lease assignment
      });

    // 5. Persist refresh token
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
