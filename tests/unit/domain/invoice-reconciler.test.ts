// tests/unit/domain/invoice-reconciler.test.ts
import { InvoiceReconciler } from '@domain/services/invoice-reconciler';
import { InvoiceStatus } from '@domain/enums';
import { BusinessRuleError } from '@domain/errors/domain.errors';

describe('InvoiceReconciler', () => {
  const reconciler = new InvoiceReconciler();

  describe('apply', () => {
    it('returns PARTIAL status when payment is less than total', () => {
      const result = reconciler.apply('0.00', '10000.00', '5000.00');

      expect(result.newPaidAmount).toBe('5000.00');
      expect(result.newStatus).toBe(InvoiceStatus.PARTIAL);
    });

    it('returns PAID status when payment equals remaining balance', () => {
      const result = reconciler.apply('5000.00', '10000.00', '5000.00');

      expect(result.newPaidAmount).toBe('10000.00');
      expect(result.newStatus).toBe(InvoiceStatus.PAID);
    });

    it('returns PAID status on full payment from zero', () => {
      const result = reconciler.apply('0.00', '10000.00', '10000.00');

      expect(result.newStatus).toBe(InvoiceStatus.PAID);
    });

    it('throws BusinessRuleError on overpayment attempt', () => {
      expect(() => reconciler.apply('9000.00', '10000.00', '2000.00')).toThrow(
        BusinessRuleError,
      );
    });

    it('throws BusinessRuleError on zero payment', () => {
      expect(() => reconciler.apply('0.00', '10000.00', '0.00')).toThrow(
        BusinessRuleError,
      );
    });

    it('throws BusinessRuleError on negative payment', () => {
      expect(() => reconciler.apply('0.00', '10000.00', '-100.00')).toThrow(
        BusinessRuleError,
      );
    });

    it('handles decimal precision correctly — no float rounding errors', () => {
      // Classic float trap: 0.1 + 0.2 !== 0.3 in IEEE 754
      const result = reconciler.apply('0.10', '0.30', '0.20');

      expect(result.newPaidAmount).toBe('0.30');
      expect(result.newStatus).toBe(InvoiceStatus.PAID);
    });

    it('accumulates multiple partial payments correctly', () => {
      let state = { paid: '0.00', total: '10000.00' };

      const p1 = reconciler.apply(state.paid, state.total, '3000.00');
      expect(p1.newStatus).toBe(InvoiceStatus.PARTIAL);
      state.paid = p1.newPaidAmount;

      const p2 = reconciler.apply(state.paid, state.total, '4000.00');
      expect(p2.newStatus).toBe(InvoiceStatus.PARTIAL);
      state.paid = p2.newPaidAmount;

      const p3 = reconciler.apply(state.paid, state.total, '3000.00');
      expect(p3.newStatus).toBe(InvoiceStatus.PAID);
      expect(p3.newPaidAmount).toBe('10000.00');
    });
  });

  describe('getRemainingBalance', () => {
    it('returns correct remaining balance', () => {
      expect(reconciler.getRemainingBalance('10000.00', '3500.00')).toBe(
        '6500.00',
      );
    });

    it('returns 0.00 when fully paid', () => {
      expect(reconciler.getRemainingBalance('10000.00', '10000.00')).toBe(
        '0.00',
      );
    });
  });
});
