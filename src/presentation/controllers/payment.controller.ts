// src/presentation/controllers/payment.controller.ts
import { Request, Response, NextFunction } from 'express';
import { InitiatePaymentUseCase } from '@application/payment/use-cases/initiate-payment.use-case';
import { GetPaymentsUseCase } from '@application/payment/use-cases/get-payments.use-case';
import { InvoiceReconciler } from '@domain/services/invoice-reconciler';
import { IRentInvoiceRepository } from '@domain/repositories/rent-invoice.repository';

export class PaymentController {
  private readonly reconciler = new InvoiceReconciler();

  constructor(
    private readonly initiatePaymentUseCase: InitiatePaymentUseCase,
    private readonly getPaymentsUseCase: GetPaymentsUseCase,
    private readonly rentInvoiceRepository: IRentInvoiceRepository,
  ) {}

  initiatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payment = await this.initiatePaymentUseCase.execute(
        req.body,
        req.user.sub,
        req.user.sub,
        req.idempotencyKeyId,
      );

      res.status(201).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  };

  getPaymentsByInvoice = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payments = await this.getPaymentsUseCase.getByInvoice(
        req.params['invoiceId']!,
        req.user.sub,
      );
      res.status(200).json({ success: true, data: payments });
    } catch (err) {
      next(err);
    }
  };

  getPayment = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const payment = await this.getPaymentsUseCase.getById(
        req.params['paymentId']!,
        req.user.sub,
      );
      res.status(200).json({ success: true, data: payment });
    } catch (err) {
      next(err);
    }
  };

  getInvoiceSummary = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const invoice = await this.rentInvoiceRepository.findByIdOrThrow(
        req.params['invoiceId']!,
        req.user.sub,
      );

      const remaining = this.reconciler.getRemainingBalance(
        invoice.totalAmount,
        invoice.paidAmount,
      );

      res.status(200).json({
        success: true,
        data: {
          invoiceId: invoice.id,
          totalAmount: invoice.totalAmount,
          paidAmount: invoice.paidAmount,
          remainingBalance: remaining,
          status: invoice.status,
          dueDate: invoice.dueDate,
        },
      });
    } catch (err) {
      next(err);
    }
  };
}
