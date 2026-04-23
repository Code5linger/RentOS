// tests/unit/services/tenant-context.service.test.ts
import { TenantContextService } from '@application/tenant/services/tenant-context.service';
import { NotFoundError } from '@domain/errors/domain.errors';
import { LeaseStatus } from '@domain/enums';

const mockLeaseRepo = {
  findAllByTenant: jest.fn(),
  findByIdOrThrowAsTenant: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findActiveByUnit: jest.fn(),
  findAllByOwner: jest.fn(),
  findAllActive: jest.fn(),
  create: jest.fn(),
  updateStatus: jest.fn(),
  findByIdAsTenant: jest.fn(),
};

const makeService = () => new TenantContextService(mockLeaseRepo as any);

describe('TenantContextService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolve returns correct context with leaseIds', async () => {
    const leases = [
      { id: 'lease-1', status: LeaseStatus.ACTIVE },
      { id: 'lease-2', status: LeaseStatus.ENDED },
    ];
    mockLeaseRepo.findAllByTenant.mockResolvedValue(leases);

    const context = await makeService().resolve('tenant-1');

    expect(context.tenantId).toBe('tenant-1');
    expect(context.leaseIds).toEqual(['lease-1', 'lease-2']);
    expect(context.leases).toHaveLength(2);
  });

  it('resolve returns empty context when tenant has no leases', async () => {
    mockLeaseRepo.findAllByTenant.mockResolvedValue([]);

    const context = await makeService().resolve('tenant-1');

    expect(context.leaseIds).toEqual([]);
    expect(context.leases).toHaveLength(0);
  });

  it('assertLeaseAccess delegates to repository and throws on miss', async () => {
    mockLeaseRepo.findByIdOrThrowAsTenant.mockRejectedValue(
      new NotFoundError('Lease', 'lease-999'),
    );

    await expect(
      makeService().assertLeaseAccess('tenant-1', 'lease-999'),
    ).rejects.toThrow(NotFoundError);
  });
});
