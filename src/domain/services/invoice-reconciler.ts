// src/domain/services/invoice-reconciler.ts
import { InvoiceStatus } from '@domain/enums';
import { BusinessRuleError } from '@domain/errors/domain.errors';
import Decimal from 'decimal.js';

export interface ReconciliationResult {
  newPaidAmount: string;
  newStatus: InvoiceStatus;
}

export class InvoiceReconciler {
  /**
   * Computes new paidAmount and status after applying a payment.
   * All arithmetic uses Decimal — no floats.
   */
  apply(
    currentPaidAmount: string,
    totalAmount: string,
    paymentAmount: string,
  ): ReconciliationResult {
    const paid = new Decimal(currentPaidAmount);
    const total = new Decimal(totalAmount);
    const payment = new Decimal(paymentAmount);

    // Guard: payment must be positive
    if (payment.lte(0)) {
      throw new BusinessRuleError('Payment amount must be greater than zero');
    }

    const remaining = total.minus(paid);

    // Guard: cannot overpay
    if (payment.gt(remaining)) {
      throw new BusinessRuleError(
        `Payment amount ${payment.toFixed(2)} exceeds remaining balance ` +
          `${remaining.toFixed(2)}. Overpayment is not allowed.`,
      );
    }

    const newPaidAmount = paid.plus(payment);
    const newStatus = newPaidAmount.gte(total)
      ? InvoiceStatus.PAID
      : InvoiceStatus.PARTIAL;

    return {
      newPaidAmount: newPaidAmount.toFixed(2),
      newStatus,
    };
  }

  /**
   * Computes remaining balance on an invoice.
   */
  getRemainingBalance(totalAmount: string, paidAmount: string): string {
    return new Decimal(totalAmount).minus(new Decimal(paidAmount)).toFixed(2);
  }

  /**
   * Whether an invoice is fully settled.
   */
  isFullyPaid(totalAmount: string, paidAmount: string): boolean {
    return new Decimal(paidAmount).gte(new Decimal(totalAmount));
  }
}
