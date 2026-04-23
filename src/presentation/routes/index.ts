// src/presentation/routes/index.ts
import { Router } from 'express';
import { authRouter } from './auth.routes';

const router = Router();

router.use('/auth', authRouter);
// Phase 4+: property, lease, invoice, payment routes added here

export { router as apiRouter };
