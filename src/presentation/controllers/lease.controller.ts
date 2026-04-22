// src/presentation/controllers/lease.controller.ts
import { Request, Response, NextFunction } from 'express';
import { CreateLeaseUseCase } from '@application/lease/use-cases/create-lease.use-case';
import { EndLeaseUseCase } from '@application/lease/use-cases/end-lease.use-case';
import { ILeaseRepository } from '@domain/repositories/lease.repository';

export class LeaseController {
  constructor(
    private readonly createLeaseUseCase: CreateLeaseUseCase,
    private readonly endLeaseUseCase: EndLeaseUseCase,
    private readonly leaseRepository: ILeaseRepository,
  ) {}

  createLease = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lease = await this.createLeaseUseCase.execute(
        req.body,
        req.user.sub,
        req.user.sub,
      );
      res.status(201).json({ success: true, data: lease });
    } catch (err) {
      next(err);
    }
  };

  getLeases = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { status } = req.query as { status?: string };
      const leases = await this.leaseRepository.findAllByOwner(
        req.user.sub,
        status as any,
      );
      res.status(200).json({ success: true, data: leases });
    } catch (err) {
      next(err);
    }
  };

  getLease = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lease = await this.leaseRepository.findByIdOrThrow(
        req.params['leaseId']!,
        req.user.sub,
      );
      res.status(200).json({ success: true, data: lease });
    } catch (err) {
      next(err);
    }
  };

  endLease = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lease = await this.endLeaseUseCase.execute(
        req.params['leaseId']!,
        req.body,
        req.user.sub,
      );
      res.status(200).json({ success: true, data: lease });
    } catch (err) {
      next(err);
    }
  };
}
