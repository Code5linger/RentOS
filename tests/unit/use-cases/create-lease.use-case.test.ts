// tests/unit/use-cases/create-lease.use-case.test.ts
import { CreateLeaseUseCase } from '@application/lease/use-cases/create-lease.use-case';
import {
  BusinessRuleError,
  ForbiddenError,
} from '@domain/errors/domain.errors';
import { Role, LeaseStatus } from '@domain/enums';

const mockLeaseRepo = {
  findActiveByUnit: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
  findAllByOwner: jest.fn(),
  updateStatus: jest.fn(),
};

const mockUnitRepo = {
  findByIdOrThrow: jest.fn(),
  findActiveLeaseExists: jest.fn(),
  findById: jest.fn(),
  findAllByProperty: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
};

const mockUserRepo = {
  findByIdOrThrow: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  create: jest.fn(),
};

const makeUseCase = () =>
  new CreateLeaseUseCase(
    mockLeaseRepo as any,
    mockUnitRepo as any,
    mockUserRepo as any,
  );

const validDto = {
  unitId: 'unit-1',
  tenantId: 'tenant-1',
  startDate: '2025-01-01',
  monthlyRent: '10000.00',
  billingDay: 5,
};

describe('CreateLeaseUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws BusinessRuleError if unit already has an active lease', async () => {
    mockUnitRepo.findByIdOrThrow.mockResolvedValue({ id: 'unit-1' });
    mockLeaseRepo.findActiveByUnit.mockResolvedValue({ id: 'existing-lease' });

    await expect(
      makeUseCase().execute(validDto, 'owner-1', 'owner-1'),
    ).rejects.toThrow(BusinessRuleError);
  });

  it('throws ForbiddenError if tenant user has OWNER role', async () => {
    mockUnitRepo.findByIdOrThrow.mockResolvedValue({ id: 'unit-1' });
    mockLeaseRepo.findActiveByUnit.mockResolvedValue(null);
    mockUserRepo.findByIdOrThrow.mockResolvedValue({
      id: 'tenant-1',
      role: Role.OWNER, // wrong role
    });

    await expect(
      makeUseCase().execute(validDto, 'owner-1', 'owner-1'),
    ).rejects.toThrow(ForbiddenError);
  });

  it('creates lease successfully when all guards pass', async () => {
    mockUnitRepo.findByIdOrThrow.mockResolvedValue({ id: 'unit-1' });
    mockLeaseRepo.findActiveByUnit.mockResolvedValue(null);
    mockUserRepo.findByIdOrThrow.mockResolvedValue({
      id: 'tenant-1',
      role: Role.TENANT,
    });
    mockLeaseRepo.create.mockResolvedValue({
      id: 'lease-1',
      unitId: 'unit-1',
      tenantId: 'tenant-1',
      ownerId: 'owner-1',
      startDate: new Date('2025-01-01'),
      endDate: null,
      monthlyRent: '10000.00',
      billingDay: 5,
      status: LeaseStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'owner-1',
      deletedAt: null,
    });

    const result = await makeUseCase().execute(validDto, 'owner-1', 'owner-1');
    expect(result.id).toBe('lease-1');
    expect(mockLeaseRepo.create).toHaveBeenCalledTimes(1);
  });
});
