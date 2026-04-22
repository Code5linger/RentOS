// src/presentation/routes/lease.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '@domain/enums';
import {
  CreateLeaseSchema,
  EndLeaseSchema,
} from '@application/lease/dtos/lease.dto';
import { leaseController } from '@container';

const router = Router();

router.use(authenticate, authorize(Role.OWNER));

router.post('/', validate(CreateLeaseSchema), leaseController.createLease);
router.get('/', leaseController.getLeases);
router.get('/:leaseId', leaseController.getLease);
router.patch(
  '/:leaseId/end',
  validate(EndLeaseSchema),
  leaseController.endLease,
);

export { router as leaseRouter };
