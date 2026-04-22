// tests/unit/use-cases/register.use-case.test.ts
import { RegisterUseCase } from '@application/auth/use-cases/register.use-case';
import { ConflictError } from '@domain/errors/domain.errors';
import { Role } from '@domain/enums';

const mockUserRepo = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  findByIdOrThrow: jest.fn(),
};

const mockRefreshTokenRepo = {
  create: jest.fn(),
  findByHash: jest.fn(),
  revoke: jest.fn(),
  revokeAllForUser: jest.fn(),
  deleteExpired: jest.fn(),
  findValidByUserId: jest.fn(),
};

const mockPasswordService = {
  hash: jest.fn(),
  verify: jest.fn(),
};

const mockTokenService = {
  generateTokenPair: jest.fn(),
  verifyAccessToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  hashRawRefreshToken: jest.fn(),
  getRefreshTokenExpiryDate: jest.fn(),
};

const makeUseCase = () =>
  new RegisterUseCase(
    mockUserRepo as any,
    mockRefreshTokenRepo as any,
    mockPasswordService as any,
    mockTokenService as any,
  );

describe('RegisterUseCase', () => {
  beforeEach(() => jest.clearAllMocks());

  it('throws ConflictError if email already exists', async () => {
    mockUserRepo.findByEmail.mockResolvedValue({ id: 'existing' });

    await expect(
      makeUseCase().execute(
        { email: 'test@test.com', password: 'Password1', role: Role.OWNER },
        null,
      ),
    ).rejects.toThrow(ConflictError);
  });

  it('creates user and returns token pair on success', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashed');
    mockUserRepo.create.mockResolvedValue({
      id: 'user-1',
      email: 'test@test.com',
      role: Role.OWNER,
      passwordHash: 'hashed',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      deletedAt: null,
    });
    mockTokenService.generateTokenPair.mockReturnValue({
      accessToken: 'access',
      refreshToken: 'refresh',
      refreshTokenHash: 'hash',
      jti: 'jti-1',
    });
    mockTokenService.getRefreshTokenExpiryDate.mockReturnValue(new Date());
    mockRefreshTokenRepo.create.mockResolvedValue({});

    const result = await makeUseCase().execute(
      { email: 'test@test.com', password: 'Password1', role: Role.OWNER },
      '127.0.0.1',
    );

    expect(result.accessToken).toBe('access');
    expect(result.refreshToken).toBe('refresh');
    expect(result.user).not.toHaveProperty('passwordHash');
    expect(mockUserRepo.create).toHaveBeenCalledTimes(1);
  });

  it('never exposes passwordHash in returned user', async () => {
    mockUserRepo.findByEmail.mockResolvedValue(null);
    mockPasswordService.hash.mockResolvedValue('hashed');
    mockUserRepo.create.mockResolvedValue({
      id: 'user-1',
      email: 'x@x.com',
      role: Role.OWNER,
      passwordHash: 'must-not-appear',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: null,
      deletedAt: null,
    });
    mockTokenService.generateTokenPair.mockReturnValue({
      accessToken: 'a',
      refreshToken: 'r',
      refreshTokenHash: 'h',
      jti: 'j',
    });
    mockTokenService.getRefreshTokenExpiryDate.mockReturnValue(new Date());
    mockRefreshTokenRepo.create.mockResolvedValue({});

    const result = await makeUseCase().execute(
      { email: 'x@x.com', password: 'Password1', role: Role.OWNER },
      null,
    );

    expect(result.user).not.toHaveProperty('passwordHash');
    expect(JSON.stringify(result)).not.toContain('must-not-appear');
  });
});
