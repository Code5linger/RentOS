// src/presentation/routes/auth.routes.ts
import { Router } from 'express';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { RegisterSchema } from '@application/auth/dtos/register.dto';
import { LoginSchema } from '@application/auth/dtos/login.dto';
import { RefreshTokenSchema } from '@application/auth/dtos/refresh-token.dto';
import { authController } from '@container';

const router = Router();

router.post('/register', validate(RegisterSchema), authController.register);
router.post('/login', validate(LoginSchema), authController.login);
router.post('/refresh', validate(RefreshTokenSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);

export { router as authRouter };
