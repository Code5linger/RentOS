// src/presentation/controllers/tenant.controller.ts
import { Request, Response, NextFunction } from 'express';
import { GetMyLeasesUseCase } from '@application/tenant/use-cases/get-my-leases.use-case';
import { GetMyInvoicesUseCase } from '@application/tenant/use-cases/get-my-invoices.use-case';
import { GetMyInvoiceDetailUseCase } from '@application/tenant/use-cases/get-my-invoice-detail.use-case';
import { GetMyPaymentHistoryUseCase } from '@application/tenant/use-cases/get-my-payment-history.use-case';
import { GetMyDashboardUseCase } from '@application/tenant/use-cases/get-my-dashboard.use-case';
import { TenantGetInvoicesQuerySchema } from '@application/tenant/dtos/tenant.dto';

export class TenantController {
  constructor(
    private readonly getMyLeasesUseCase: GetMyLeasesUseCase,
    private readonly getMyInvoicesUseCase: GetMyInvoicesUseCase,
    private readonly getMyInvoiceDetailUseCase: GetMyInvoiceDetailUseCase,
    private readonly getMyPaymentHistoryUseCase: GetMyPaymentHistoryUseCase,
    private readonly getMyDashboardUseCase: GetMyDashboardUseCase,
  ) {}

  getMyDashboard = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dashboard = await this.getMyDashboardUseCase.execute(req.user.sub);
      res.status(200).json({ success: true, data: dashboard });
    } catch (err) {
      next(err);
    }
  };

  getMyLeases = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const leases = await this.getMyLeasesUseCase.execute(req.user.sub);
      res.status(200).json({ success: true, data: leases });
    } catch (err) {
      next(err);
    }
  };

  getMyLease = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const lease = await this.getMyLeasesUseCase.execute(req.user.sub);
      const target = lease.find((l) => l.id === req.params['leaseId']);

      if (!target) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Lease not found' },
        });
        return;
      }

      res.status(200).json({ success: true, data: target });
    } catch (err) {
      next(err);
    }
  };

  getMyInvoices = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = TenantGetInvoicesQuerySchema.safeParse(req.query);
      const filters = query.success ? query.data : {};

      const invoices = await this.getMyInvoicesUseCase.execute(
        req.user.sub,
        filters,
      );
      res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  };

  getMyInvoiceDetail = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const detail = await this.getMyInvoiceDetailUseCase.execute(
        req.user.sub,
        req.params['invoiceId']!,
      );
      res.status(200).json({ success: true, data: detail });
    } catch (err) {
      next(err);
    }
  };

  getMyPaymentHistory = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payments = await this.getMyPaymentHistoryUseCase.execute(
        req.user.sub,
      );
      res.status(200).json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  };
}
