// tests/unit/domain/payment-state-machine.test.ts
import { PaymentStateMachine } from '@domain/services/payment-state-machine';
import { PaymentStatus } from '@domain/enums';
import { BusinessRuleError } from '@domain/errors/domain.errors';

describe('PaymentStateMachine', () => {
  const machine = new PaymentStateMachine();

  it('allows INITIATED → SUCCESS', () => {
    expect(() =>
      machine.assertTransition(PaymentStatus.INITIATED, PaymentStatus.SUCCESS),
    ).not.toThrow();
  });

  it('allows INITIATED → FAILED', () => {
    expect(() =>
      machine.assertTransition(PaymentStatus.INITIATED, PaymentStatus.FAILED),
    ).not.toThrow();
  });

  it('rejects SUCCESS → FAILED (terminal)', () => {
    expect(() =>
      machine.assertTransition(PaymentStatus.SUCCESS, PaymentStatus.FAILED),
    ).toThrow(BusinessRuleError);
  });

  it('rejects FAILED → SUCCESS (terminal)', () => {
    expect(() =>
      machine.assertTransition(PaymentStatus.FAILED, PaymentStatus.SUCCESS),
    ).toThrow(BusinessRuleError);
  });

  it('rejects SUCCESS → INITIATED (terminal)', () => {
    expect(() =>
      machine.assertTransition(PaymentStatus.SUCCESS, PaymentStatus.INITIATED),
    ).toThrow(BusinessRuleError);
  });

  it('identifies terminal states correctly', () => {
    expect(machine.isTerminal(PaymentStatus.INITIATED)).toBe(false);
    expect(machine.isTerminal(PaymentStatus.SUCCESS)).toBe(true);
    expect(machine.isTerminal(PaymentStatus.FAILED)).toBe(true);
  });
});
