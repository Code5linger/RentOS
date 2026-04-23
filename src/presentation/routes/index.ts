// src/presentation/routes/index.ts  — updated
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { propertyRouter } from './property.routes';
import { leaseRouter } from './lease.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/properties', propertyRouter);
router.use('/leases', leaseRouter);

export { router as apiRouter };
