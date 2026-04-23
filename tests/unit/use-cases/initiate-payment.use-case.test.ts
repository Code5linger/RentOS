// tests/unit/use-cases/initiate-payment.use-case.test.ts
import { InitiatePaymentUseCase } from '@application/payment/use-cases/initiate-payment.use-case';
import { BusinessRuleError } from '@domain/errors/domain.errors';
import { InvoiceStatus, PaymentMethod, PaymentStatus } from '@domain/enums';

const mockPaymentRepo = {
  createWithInvoiceUpdate: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByInvoice: jest.fn(),
  findByTransactionRef: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};

const mockInvoiceRepo = {
  findByIdOrThrow: jest.fn(),
  findById: jest.fn(),
  findByLeasePeriod: jest.fn(),
  findOverdueUnpaid: jest.fn(),
  findAllByOwner: jest.fn(),
  findAllByLease: jest.fn(),
  create: jest.fn(),
  updatePaidAmount: jest.fn(),
  bulkUpdateStatus: jest.fn(),
};

const mockIdempotencyRepo = {
  findByKey: jest.fn(),
  create: jest.fn(),
  setResponseHash: jest.fn(),
  deleteExpired: jest.fn(),
};

const pendingInvoice = {
  id: 'inv-1',
  leaseId: 'lease-1',
  ownerId: 'owner-1',
  totalAmount: '10000.00',
  paidAmount: '0.00',
  status: InvoiceStatus.PENDING,
  deletedAt: null,
  dueDate: new Date(),
  billingPeriodStart: new Date(),
  billingPeriodEnd: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'system',
};

const makeUseCase = () =>
  new InitiatePaymentUseCase(
    mockPaymentRepo as any,
    mockInvoiceRepo as any,
    mockIdempotencyRepo as any,
  );

describe('InitiatePaymentUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws BusinessRuleError when invoice is already PAID', async () => {
    mockInvoiceRepo.findByIdOrThrow.mockResolvedValue({
      ...pendingInvoice,
      status: InvoiceStatus.PAID,
    });

    await expect(
      makeUseCase().execute(
        { invoiceId: 'inv-1', amount: '1000.00', method: PaymentMethod.CASH },
        'owner-1',
        'owner-1',
        null,
      ),
    ).rejects.toThrow(BusinessRuleError);

    expect(mockPaymentRepo.createWithInvoiceUpdate).not.toHaveBeenCalled();
  });

  it('throws BusinessRuleError on overpayment', async () => {
    mockInvoiceRepo.findByIdOrThrow.mockResolvedValue({
      ...pendingInvoice,
      paidAmount: '9000.00',
    });

    await expect(
      makeUseCase().execute(
        { invoiceId: 'inv-1', amount: '2000.00', method: PaymentMethod.CASH },
        'owner-1',
        'owner-1',
        null,
      ),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('creates payment and reconciles invoice for partial payment', async () => {
    mockInvoiceRepo.findByIdOrThrow.mockResolvedValue(pendingInvoice);
    mockPaymentRepo.createWithInvoiceUpdate.mockResolvedValue({
      id: 'pay-1',
      invoiceId: 'inv-1',
      ownerId: 'owner-1',
      amount: '5000.00',
      method: PaymentMethod.CASH,
      status: PaymentStatus.SUCCESS,
      transactionRef: null,
      idempotencyKeyId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'owner-1',
    });

    const result = await makeUseCase().execute(
      { invoiceId: 'inv-1', amount: '5000.00', method: PaymentMethod.CASH },
      'owner-1',
      'owner-1',
      null,
    );

    expect(result.id).toBe('pay-1');
    expect(mockPaymentRepo.createWithInvoiceUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        newPaidAmount: '5000.00',
        newInvoiceStatus: InvoiceStatus.PARTIAL,
      }),
    );
  });

  it('marks idempotency key as consumed after successful payment', async () => {
    mockInvoiceRepo.findByIdOrThrow.mockResolvedValue(pendingInvoice);
    mockPaymentRepo.createWithInvoiceUpdate.mockResolvedValue({
      id: 'pay-2',
      amount: '10000.00',
      status: PaymentStatus.SUCCESS,
      invoiceId: 'inv-1',
      ownerId: 'owner-1',
      method: PaymentMethod.CASH,
      transactionRef: null,
      idempotencyKeyId: 'key-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'owner-1',
    });
    mockIdempotencyRepo.setResponseHash.mockResolvedValue(undefined);

    await makeUseCase().execute(
      { invoiceId: 'inv-1', amount: '10000.00', method: PaymentMethod.CASH },
      'owner-1',
      'owner-1',
      'key-1',
    );

    expect(mockIdempotencyRepo.setResponseHash).toHaveBeenCalledWith(
      'key-1',
      'pay-2',
    );
  });
});
