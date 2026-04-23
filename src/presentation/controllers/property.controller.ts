// src/presentation/controllers/property.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CreatePropertyUseCase } from '@application/property/use-cases/create-property.use-case';
import { GetPropertiesUseCase } from '@application/property/use-cases/get-properties.use-case';
import { UpdatePropertyUseCase } from '@application/property/use-cases/update-property.use-case';
import { DeletePropertyUseCase } from '@application/property/use-cases/delete-property.use-case';
import { CreateUnitUseCase } from '@application/property/use-cases/create-unit.use-case';
import { DeleteUnitUseCase } from '@application/property/use-cases/delete-unit.use-case';

export class PropertyController {
  constructor(
    private readonly createPropertyUseCase: CreatePropertyUseCase,
    private readonly getPropertiesUseCase: GetPropertiesUseCase,
    private readonly updatePropertyUseCase: UpdatePropertyUseCase,
    private readonly deletePropertyUseCase: DeletePropertyUseCase,
    private readonly createUnitUseCase: CreateUnitUseCase,
    private readonly deleteUnitUseCase: DeleteUnitUseCase,
  ) {}

  // ── Properties ───────────────────────────────────────────

  createProperty = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const property = await this.createPropertyUseCase.execute(
        req.body,
        req.user.sub,
      );
      res.status(201).json({ success: true, data: property });
    } catch (err) {
      next(err);
    }
  };

  getProperties = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const properties = await this.getPropertiesUseCase.execute(req.user.sub);
      res.status(200).json({ success: true, data: properties });
    } catch (err) {
      next(err);
    }
  };

  updateProperty = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const property = await this.updatePropertyUseCase.execute(
        req.params['propertyId']!,
        req.body,
        req.user.sub,
      );
      res.status(200).json({ success: true, data: property });
    } catch (err) {
      next(err);
    }
  };

  deleteProperty = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.deletePropertyUseCase.execute(
        req.params['propertyId']!,
        req.user.sub,
      );
      res.status(200).json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  };

  // ── Units ────────────────────────────────────────────────

  createUnit = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const unit = await this.createUnitUseCase.execute(
        req.params['propertyId']!,
        req.body,
        req.user.sub,
      );
      res.status(201).json({ success: true, data: unit });
    } catch (err) {
      next(err);
    }
  };

  deleteUnit = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.deleteUnitUseCase.execute(req.params['unitId']!, req.user.sub);
      res.status(200).json({ success: true, data: null });
    } catch (err) {
      next(err);
    }
  };
}
