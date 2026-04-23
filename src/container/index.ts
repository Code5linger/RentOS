import { prisma } from '@infrastructure/database/prisma.client';

// Repositories
import { UserRepositoryImpl } from '@infrastructure/database/repositories/user.repository.impl';
import { RefreshTokenRepositoryImpl } from '@infrastructure/database/repositories/refresh-token.repository.impl';
import { LeaseRepositoryImpl } from '@infrastructure/database/repositories/lease.repository.impl';
import { RentInvoiceRepositoryImpl } from '@infrastructure/database/repositories/rent-invoice.repository.impl';
import { PaymentRepositoryImpl } from '@infrastructure/database/repositories/payment.repository.impl';

// Services
import { PasswordService } from '@infrastructure/auth/password.service';
import { TokenService } from '@infrastructure/auth/token.service';

// Use Cases
import { RegisterUseCase } from '@application/auth/use-cases/register.use-case';
import { LoginUseCase } from '@application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@application/auth/use-cases/refresh-token.use-case';

// Controllers
import { AuthController } from '@presentation/controllers/auth.controller';

// ── Repositories ────────────────────────────────────────────
export const userRepository = new UserRepositoryImpl(prisma);
export const refreshTokenRepository = new RefreshTokenRepositoryImpl(prisma);
export const leaseRepository = new LeaseRepositoryImpl(prisma);
export const rentInvoiceRepository = new RentInvoiceRepositoryImpl(prisma);
export const paymentRepository = new PaymentRepositoryImpl(prisma);

// ── Services ────────────────────────────────────────────────
export const passwordService = new PasswordService();
export const tokenService = new TokenService();

// ── Use Cases ───────────────────────────────────────────────
export const registerUseCase = new RegisterUseCase(
  userRepository,
  refreshTokenRepository,
  passwordService,
  tokenService,
);

export const loginUseCase = new LoginUseCase(
  userRepository,
  refreshTokenRepository,
  passwordService,
  tokenService,
);

export const refreshTokenUseCase = new RefreshTokenUseCase(
  userRepository,
  refreshTokenRepository,
  tokenService,
);

// ── Controllers ─────────────────────────────────────────────
export const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  refreshTokenUseCase,
);
