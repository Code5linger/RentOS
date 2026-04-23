// src/presentation/controllers/invoice.controller.ts
import { Request, Response, NextFunction } from 'express';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';
import { InvoiceStatus } from '@domain/enums';

export class InvoiceController {
  constructor(private readonly rentInvoiceRepository: IRentInvoiceRepository) {}

  getInvoices = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const { status, leaseId } = req.query as {
        status?: InvoiceStatus;
        leaseId?: string;
      };

      const invoices = leaseId
        ? await this.rentInvoiceRepository.findAllByLease(leaseId, req.user.sub)
        : await this.rentInvoiceRepository.findAllByOwner(req.user.sub, status);

      res.status(200).json({ success: true, data: invoices });
    } catch (err) {
      next(err);
    }
  };

  getInvoice = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const invoice = await this.rentInvoiceRepository.findByIdOrThrow(
        req.params['invoiceId']!,
        req.user.sub,
      );
      res.status(200).json({ success: true, data: invoice });
    } catch (err) {
      next(err);
    }
  };
}
