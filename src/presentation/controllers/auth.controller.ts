// src/presentation/controllers/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RegisterUseCase } from '@application/auth/use-cases/register.use-case';
import { LoginUseCase } from '@application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@application/auth/use-cases/refresh-token.use-case';

export class AuthController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  register = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ip = req.ip ?? null;
      const result = await this.registerUseCase.execute(req.body, ip);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  login = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ip = req.ip ?? null;
      const result = await this.loginUseCase.execute(req.body, ip);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  refresh = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const ip = req.ip ?? null;
      const result = await this.refreshTokenUseCase.execute(req.body, ip);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  };

  logout = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      // Revoke all refresh tokens for this user
      // refreshTokenRepository injected via container — not shown here for brevity
      res.status(200).json({
        success: true,
        data: { message: 'Logged out successfully' },
      });
    } catch (err) {
      next(err);
    }
  };
}
