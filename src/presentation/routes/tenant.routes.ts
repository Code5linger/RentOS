// src/presentation/routes/tenant.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { Role } from '@domain/enums';
import { tenantController } from '@container';

const router = Router();

// All tenant routes require TENANT role
router.use(authenticate, authorize(Role.TENANT));

// Dashboard
router.get('/dashboard', tenantController.getMyDashboard);

// Leases
router.get('/leases', tenantController.getMyLeases);
router.get('/leases/:leaseId', tenantController.getMyLease);

// Invoices
router.get('/invoices', tenantController.getMyInvoices);
router.get('/invoices/:invoiceId', tenantController.getMyInvoiceDetail);

// Payment history
router.get('/payments', tenantController.getMyPaymentHistory);

export { router as tenantRouter };
