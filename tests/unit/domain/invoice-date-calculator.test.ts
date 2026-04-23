// tests/unit/domain/invoice-date-calculator.test.ts
import { InvoiceDateCalculator } from '@domain/services/invoice-date-calculator';

describe('InvoiceDateCalculator', () => {
  const calc = new InvoiceDateCalculator();

  describe('getBillingPeriod', () => {
    it('returns correct period for a mid-month reference date', () => {
      const result = calc.getBillingPeriod(new Date('2025-03-15'), 5);

      expect(result.billingPeriodStart).toEqual(new Date('2025-03-01'));
      expect(result.billingPeriodEnd).toEqual(new Date('2025-03-31'));
      expect(result.dueDate).toEqual(new Date('2025-03-05'));
    });

    it('caps billing day to last day of February', () => {
      const result = calc.getBillingPeriod(new Date('2025-02-01'), 28);

      expect(result.dueDate).toEqual(new Date('2025-02-28'));
      expect(result.billingPeriodEnd).toEqual(new Date('2025-02-28'));
    });

    it('handles leap year February correctly', () => {
      const result = calc.getBillingPeriod(new Date('2024-02-01'), 28);

      expect(result.billingPeriodEnd).toEqual(new Date('2024-02-29'));
      expect(result.dueDate).toEqual(new Date('2024-02-28'));
    });

    it('returns correct period for billing day 1', () => {
      const result = calc.getBillingPeriod(new Date('2025-06-20'), 1);

      expect(result.dueDate).toEqual(new Date('2025-06-01'));
    });
  });

  describe('getMissingPeriods', () => {
    it('returns single period for lease starting and ending in same month', () => {
      const periods = calc.getMissingPeriods(
        new Date('2025-01-15'),
        5,
        new Date('2025-01-31'),
      );
      expect(periods).toHaveLength(1);
      expect(periods[0]!.billingPeriodStart).toEqual(new Date('2025-01-01'));
    });

    it('returns multiple periods for multi-month lease', () => {
      const periods = calc.getMissingPeriods(
        new Date('2025-01-01'),
        5,
        new Date('2025-03-31'),
      );
      expect(periods).toHaveLength(3);
    });

    it('is idempotent — same inputs always produce same output', () => {
      const a = calc.getMissingPeriods(
        new Date('2025-01-01'),
        5,
        new Date('2025-06-01'),
      );
      const b = calc.getMissingPeriods(
        new Date('2025-01-01'),
        5,
        new Date('2025-06-01'),
      );
      expect(a).toEqual(b);
    });
  });

  describe('isOverdue', () => {
    it('returns true when due date is before asOf', () => {
      expect(
        calc.isOverdue(new Date('2025-01-05'), new Date('2025-01-10')),
      ).toBe(true);
    });

    it('returns false when due date is after asOf', () => {
      expect(
        calc.isOverdue(new Date('2025-01-10'), new Date('2025-01-05')),
      ).toBe(false);
    });

    it('returns false when due date equals asOf', () => {
      const date = new Date('2025-01-05');
      expect(calc.isOverdue(date, date)).toBe(false);
    });
  });
});
