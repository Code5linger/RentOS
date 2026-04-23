// src/presentation/routes/payment.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { requireIdempotencyKey } from '../middleware/require-idempotency.middleware';
import { idempotency } from '../middleware/idempotency.middleware';
import { Role } from '@domain/enums';
import { InitiatePaymentSchema } from '@application/payment/dtos/payment.dto';
import { paymentController, idempotencyKeyRepository } from '@container';

const router = Router();

router.use(authenticate, authorize(Role.OWNER));

// POST /payments
// Requires: Bearer token, Idempotency-Key header
router.post(
  '/',
  requireIdempotencyKey,
  idempotency(idempotencyKeyRepository),
  validate(InitiatePaymentSchema),
  paymentController.initiatePayment,
);

// GET /payments/:paymentId
router.get('/:paymentId', paymentController.getPayment);

// GET /invoices/:invoiceId/payments
// Invoice payment history + balance summary
router.get('/invoices/:invoiceId/summary', paymentController.getInvoiceSummary);

router.get(
  '/invoices/:invoiceId/payments',
  paymentController.getPaymentsByInvoice,
);

export { router as paymentRouter };
