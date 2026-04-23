// tests/unit/use-cases/generate-invoice.use-case.test.ts
import { GenerateInvoiceUseCase } from '@application/invoice/use-cases/generate-invoice.use-case';
import { BusinessRuleError, ConflictError } from '@domain/errors/domain.errors';
import { LeaseStatus, InvoiceStatus } from '@domain/enums';

const mockRentInvoiceRepo = {
  findByLeasePeriod: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findOverdueUnpaid: jest.fn(),
  findAllByOwner: jest.fn(),
  findAllByLease: jest.fn(),
  updatePaidAmount: jest.fn(),
  bulkUpdateStatus: jest.fn(),
};

const mockLeaseRepo = {
  findByIdOrThrow: jest.fn(),
  findById: jest.fn(),
  findActiveByUnit: jest.fn(),
  findAllByOwner: jest.fn(),
  findAllActive: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
};

const activeLease = {
  id: 'lease-1',
  ownerId: 'owner-1',
  unitId: 'unit-1',
  tenantId: 'tenant-1',
  startDate: new Date('2025-01-01'),
  endDate: null,
  monthlyRent: '10000.00',
  billingDay: 5,
  status: LeaseStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'owner-1',
  deletedAt: null,
};

const makeUseCase = () =>
  new GenerateInvoiceUseCase(mockRentInvoiceRepo as any, mockLeaseRepo as any);

describe('GenerateInvoiceUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws BusinessRuleError for non-ACTIVE lease', async () => {
    mockLeaseRepo.findByIdOrThrow.mockResolvedValue({
      ...activeLease,
      status: LeaseStatus.ENDED,
    });

    await expect(
      makeUseCase().execute({
        leaseId: 'lease-1',
        ownerId: 'owner-1',
        billingPeriodStart: new Date('2025-01-01'),
      }),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('returns existing invoice without creating duplicate (idempotent)', async () => {
    mockLeaseRepo.findByIdOrThrow.mockResolvedValue(activeLease);
    const existingInvoice = { id: 'inv-1', status: InvoiceStatus.PENDING };
    mockRentInvoiceRepo.findByLeasePeriod.mockResolvedValue(existingInvoice);

    const result = await makeUseCase().execute({
      leaseId: 'lease-1',
      ownerId: 'owner-1',
      billingPeriodStart: new Date('2025-01-01'),
    });

    expect(result).toBe(existingInvoice);
    expect(mockRentInvoiceRepo.create).not.toHaveBeenCalled();
  });

  it('creates invoice when none exists', async () => {
    mockLeaseRepo.findByIdOrThrow.mockResolvedValue(activeLease);
    mockRentInvoiceRepo.findByLeasePeriod.mockResolvedValue(null);
    const newInvoice = { id: 'inv-2', status: InvoiceStatus.PENDING };
    mockRentInvoiceRepo.create.mockResolvedValue(newInvoice);

    const result = await makeUseCase().execute({
      leaseId: 'lease-1',
      ownerId: 'owner-1',
      billingPeriodStart: new Date('2025-01-01'),
    });

    expect(result.id).toBe('inv-2');
    expect(mockRentInvoiceRepo.create).toHaveBeenCalledTimes(1);
  });

  it('handles race condition — fetches existing on ConflictError', async () => {
    mockLeaseRepo.findByIdOrThrow.mockResolvedValue(activeLease);
    mockRentInvoiceRepo.findByLeasePeriod
      .mockResolvedValueOnce(null) // first check: not found
      .mockResolvedValueOnce({ id: 'inv-race' }); // second check after race: found
    mockRentInvoiceRepo.create.mockRejectedValue(
      new ConflictError('already exists'),
    );

    const result = await makeUseCase().execute({
      leaseId: 'lease-1',
      ownerId: 'owner-1',
      billingPeriodStart: new Date('2025-01-01'),
    });

    expect(result.id).toBe('inv-race');
  });
});
