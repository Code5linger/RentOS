// tests/unit/use-cases/get-my-invoices.use-case.test.ts
import { GetMyInvoicesUseCase } from '@application/tenant/use-cases/get-my-invoices.use-case';
import { InvoiceStatus, LeaseStatus } from '@domain/enums';

const mockTenantContextService = {
  resolve: jest.fn(),
  assertLeaseAccess: jest.fn(),
};

const mockInvoiceRepo = {
  findAllByTenant: jest.fn(),
  findByIdOrThrowAsTenant: jest.fn(),
  findByIdAsTenant: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findByLeasePeriod: jest.fn(),
  findOverdueUnpaid: jest.fn(),
  findAllByOwner: jest.fn(),
  findAllByLease: jest.fn(),
  create: jest.fn(),
  updatePaidAmount: jest.fn(),
  bulkUpdateStatus: jest.fn(),
};

const tenantContext = {
  tenantId: 'tenant-1',
  leases: [{ id: 'lease-1', status: LeaseStatus.ACTIVE }],
  leaseIds: ['lease-1'],
};

const makeUseCase = () =>
  new GetMyInvoicesUseCase(
    mockTenantContextService as any,
    mockInvoiceRepo as any,
  );

describe('GetMyInvoicesUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns empty array when tenant has no leases', async () => {
    mockTenantContextService.resolve.mockResolvedValue({
      ...tenantContext,
      leases: [],
      leaseIds: [],
    });

    const result = await makeUseCase().execute('tenant-1', {});
    expect(result).toEqual([]);
    expect(mockInvoiceRepo.findAllByTenant).not.toHaveBeenCalled();
  });

  it('returns empty array when leaseId filter is not in tenant scope', async () => {
    mockTenantContextService.resolve.mockResolvedValue(tenantContext);

    const result = await makeUseCase().execute('tenant-1', {
      leaseId: 'lease-999-not-mine',
    });

    expect(result).toEqual([]);
    expect(mockInvoiceRepo.findAllByTenant).not.toHaveBeenCalled();
  });

  it('filters invoices by status in memory', async () => {
    mockTenantContextService.resolve.mockResolvedValue(tenantContext);
    mockInvoiceRepo.findAllByTenant.mockResolvedValue([
      {
        id: 'inv-1',
        status: InvoiceStatus.PAID,
        totalAmount: '10000.00',
        paidAmount: '10000.00',
        leaseId: 'lease-1',
        ownerId: 'owner-1',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        deletedAt: null,
      },
      {
        id: 'inv-2',
        status: InvoiceStatus.PENDING,
        totalAmount: '10000.00',
        paidAmount: '0.00',
        leaseId: 'lease-1',
        ownerId: 'owner-1',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        deletedAt: null,
      },
    ]);

    const result = await makeUseCase().execute('tenant-1', {
      status: InvoiceStatus.PENDING,
    });

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('inv-2');
  });

  it('enriches invoices with remainingBalance', async () => {
    mockTenantContextService.resolve.mockResolvedValue(tenantContext);
    mockInvoiceRepo.findAllByTenant.mockResolvedValue([
      {
        id: 'inv-1',
        status: InvoiceStatus.PARTIAL,
        totalAmount: '10000.00',
        paidAmount: '3000.00',
        leaseId: 'lease-1',
        ownerId: 'owner-1',
        billingPeriodStart: new Date(),
        billingPeriodEnd: new Date(),
        dueDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system',
        deletedAt: null,
      },
    ]);

    const result = await makeUseCase().execute('tenant-1', {});

    expect(result[0]!.remainingBalance).toBe('7000.00');
  });
});
