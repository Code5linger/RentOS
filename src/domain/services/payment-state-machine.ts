// src/domain/services/payment-state-machine.ts
import { PaymentStatus } from '@domain/enums';
import { BusinessRuleError } from '@domain/errors/domain.errors';

// Valid transitions only
const ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
  [PaymentStatus.INITIATED]: [PaymentStatus.SUCCESS, PaymentStatus.FAILED],
  [PaymentStatus.SUCCESS]: [], // terminal
  [PaymentStatus.FAILED]: [], // terminal
};

export class PaymentStateMachine {
  assertTransition(from: PaymentStatus, to: PaymentStatus): void {
    const allowed = ALLOWED_TRANSITIONS[from];

    if (!allowed.includes(to)) {
      throw new BusinessRuleError(
        `Invalid payment transition: ${from} → ${to}. ` +
          `Allowed from ${from}: [${allowed.join(', ') || 'none — terminal state'}]`,
      );
    }
  }

  isTerminal(status: PaymentStatus): boolean {
    return ALLOWED_TRANSITIONS[status].length === 0;
  }
}
