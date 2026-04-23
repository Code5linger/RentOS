// src/presentation/routes/index.ts
import { Router } from 'express';
import { authRouter } from './auth.routes';
import { propertyRouter } from './property.routes';
import { leaseRouter } from './lease.routes';
import { invoiceRouter } from './invoice.routes';
import { paymentRouter } from './payment.routes';
import { tenantRouter } from './tenant.routes';

const router = Router();

router.use('/auth', authRouter);
router.use('/properties', propertyRouter);
router.use('/leases', leaseRouter);
router.use('/invoices', invoiceRouter);
router.use('/payments', paymentRouter);
router.use('/me', tenantRouter); // /api/v1/me/...

export { router as apiRouter };
