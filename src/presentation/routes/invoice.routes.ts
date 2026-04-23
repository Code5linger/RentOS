// src/presentation/routes/invoice.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@domain/enums';
import { invoiceController } from '@container';

const router = Router();

router.use(authenticate, authorize(Role.OWNER, Role.ADMIN));

router.get('/', invoiceController.getInvoices);
router.get('/:invoiceId', invoiceController.getInvoice);

export { router as invoiceRouter };
