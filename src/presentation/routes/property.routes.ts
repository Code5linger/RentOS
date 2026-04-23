// src/presentation/routes/property.routes.ts
import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { Role } from '@domain/enums';
import {
  CreatePropertySchema,
  UpdatePropertySchema,
} from '@application/property/dtos/property.dto';
import { CreateUnitSchema } from '@application/property/dtos/unit.dto';
import { propertyController } from '@container';

const router = Router();

// All property routes require auth + OWNER role
router.use(authenticate, authorize(Role.OWNER));

// Properties
router.post(
  '/',
  validate(CreatePropertySchema),
  propertyController.createProperty,
);

router.get('/', propertyController.getProperties);

router.patch(
  '/:propertyId',
  validate(UpdatePropertySchema),
  propertyController.updateProperty,
);

router.delete('/:propertyId', propertyController.deleteProperty);

// Units — nested under properties
router.post(
  '/:propertyId/units',
  validate(CreateUnitSchema),
  propertyController.createUnit,
);

router.delete('/:propertyId/units/:unitId', propertyController.deleteUnit);

export { router as propertyRouter };
