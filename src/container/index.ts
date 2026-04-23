// src/container/index.ts — full wiring through Phase 4
import { prisma } from '@infrastructure/database/prisma.client';

// Repositories
import { UserRepositoryImpl } from '@infrastructure/database/repositories/user.repository.impl';
import { RefreshTokenRepositoryImpl } from '@infrastructure/database/repositories/refresh-token.repository.impl';
import { PropertyRepositoryImpl } from '@infrastructure/database/repositories/property.repository.impl';
import { UnitRepositoryImpl } from '@infrastructure/database/repositories/unit.repository.impl';
import { LeaseRepositoryImpl } from '@infrastructure/database/repositories/lease.repository.impl';
import { PaymentRepositoryImpl } from '@infrastructure/database/repositories/payment.repository.impl';

// Services
import { PasswordService } from '@infrastructure/auth/password.service';
import { TokenService } from '@infrastructure/auth/token.service';

// Auth use cases
import { RegisterUseCaseImpl } from '@application/auth/use-cases/register.use-case';
import { LoginUseCaseImpl } from '@application/auth/use-cases/login.use-case';
import { RefreshTokenUseCaseImpl } from '@application/auth/use-cases/refresh-token.use-case';

// Property use cases
import { CreatePropertyUseCase } from '@application/property/use-cases/create-property.use-case';
import { GetPropertiesUseCase } from '@application/property/use-cases/get-properties.use-case';
import { UpdatePropertyUseCase } from '@application/property/use-cases/update-property.use-case';
import { DeletePropertyUseCase } from '@application/property/use-cases/delete-property.use-case';
import { CreateUnitUseCase } from '@application/property/use-cases/create-unit.use-case';
import { DeleteUnitUseCase } from '@application/property/use-cases/delete-unit.use-case';

// Lease use cases
import { CreateLeaseUseCase } from '@application/lease/use-cases/create-lease.use-case';
import { EndLeaseUseCase } from '@application/lease/use-cases/end-lease.use-case';

// Controllers
import { AuthController } from '@presentation/controllers/auth.controller';
import { PropertyController } from '@presentation/controllers/property.controller';
import { LeaseController } from '@presentation/controllers/lease.controller';

import { RentInvoiceRepositoryImpl } from '@infrastructure/database/repositories/rent-invoice.repository.impl';
import { GenerateInvoiceUseCase } from '@application/invoice/use-cases/generate-invoice.use-case';
import { MarkLateInvoicesUseCase } from '@application/invoice/use-cases/mark-late-invoices.use-case';
import { InvoiceScheduler } from '@infrastructure/scheduler/invoice.scheduler';
import { InvoiceController } from '@presentation/controllers/invoice.controller';
import { createInvoiceWorker } from '@infrastructure/queue/workers/invoice.worker';
import { createMarkLateWorker } from '@infrastructure/queue/workers/mark-late.worker';

// ── Repositories ────────────────────────────────────────────
export const userRepository = new UserRepositoryImpl(prisma);
export const refreshTokenRepository = new RefreshTokenRepositoryImpl(prisma);
export const propertyRepository = new PropertyRepositoryImpl(prisma);
export const unitRepository = new UnitRepositoryImpl(prisma);
export const leaseRepository = new LeaseRepositoryImpl(prisma);
export const rentInvoiceRepository = new RentInvoiceRepositoryImpl(prisma);
export const paymentRepository = new PaymentRepositoryImpl(prisma);

// ── Services ────────────────────────────────────────────────
export const passwordService = new PasswordService();
export const tokenService = new TokenService();

// ── Auth Use Cases ───────────────────────────────────────────
export const registerUseCase = new RegisterUseCaseImpl(
  userRepository,
  refreshTokenRepository,
  passwordService,
  tokenService,
);
export const loginUseCase = new LoginUseCaseImpl(
  userRepository,
  refreshTokenRepository,
  passwordService,
  tokenService,
);
export const refreshTokenUseCase = new RefreshTokenUseCaseImpl(
  userRepository,
  refreshTokenRepository,
  tokenService,
);

// ── Property Use Cases ───────────────────────────────────────
export const createPropertyUseCase = new CreatePropertyUseCase(
  propertyRepository,
);
export const getPropertiesUseCase = new GetPropertiesUseCase(
  propertyRepository,
);
export const updatePropertyUseCase = new UpdatePropertyUseCase(
  propertyRepository,
);
export const deletePropertyUseCase = new DeletePropertyUseCase(
  propertyRepository,
  unitRepository,
);
export const createUnitUseCase = new CreateUnitUseCase(
  unitRepository,
  propertyRepository,
);
export const deleteUnitUseCase = new DeleteUnitUseCase(unitRepository);

// ── Lease Use Cases ──────────────────────────────────────────
export const createLeaseUseCase = new CreateLeaseUseCase(
  leaseRepository,
  unitRepository,
  userRepository,
);
export const endLeaseUseCase = new EndLeaseUseCase(leaseRepository);

// ── Controllers ──────────────────────────────────────────────
export const authController = new AuthController(
  registerUseCase,
  loginUseCase,
  refreshTokenUseCase,
);

export const propertyController = new PropertyController(
  createPropertyUseCase,
  getPropertiesUseCase,
  updatePropertyUseCase,
  deletePropertyUseCase,
  createUnitUseCase,
  deleteUnitUseCase,
);

export const leaseController = new LeaseController(
  createLeaseUseCase,
  endLeaseUseCase,
  leaseRepository,
);

// ── Invoice Use Cases ────────────────────────────────────────
export const generateInvoiceUseCase = new GenerateInvoiceUseCase(
  rentInvoiceRepository,
  leaseRepository,
);

export const markLateInvoicesUseCase = new MarkLateInvoicesUseCase(
  rentInvoiceRepository,
);

// ── Scheduler ────────────────────────────────────────────────
export const invoiceScheduler = new InvoiceScheduler(
  leaseRepository,
  rentInvoiceRepository,
);

// ── Workers (started in server.ts, not here) ─────────────────
export const invoiceWorker = createInvoiceWorker(generateInvoiceUseCase);
export const markLateWorker = createMarkLateWorker(markLateInvoicesUseCase);

// ── Controllers ──────────────────────────────────────────────
export const invoiceController = new InvoiceController(rentInvoiceRepository);

// Additions to src/container/index.ts

import { IdempotencyKeyRepositoryImpl } from '@infrastructure/database/repositories/idempotency-key.repository.impl';
import { InitiatePaymentUseCase } from '@application/payment/use-cases/initiate-payment.use-case';
import { GetPaymentsUseCase } from '@application/payment/use-cases/get-payments.use-case';
import { PaymentController } from '@presentation/controllers/payment.controller';

// ── Repositories ─────────────────────────────────────────────
export const idempotencyKeyRepository = new IdempotencyKeyRepositoryImpl(
  prisma,
);

// ── Payment Use Cases ────────────────────────────────────────
export const initiatePaymentUseCase = new InitiatePaymentUseCase(
  paymentRepository, // PaymentRepositoryImpl — needs createWithInvoiceUpdate
  rentInvoiceRepository,
  idempotencyKeyRepository,
);

export const getPaymentsUseCase = new GetPaymentsUseCase(
  paymentRepository,
  rentInvoiceRepository,
);

// ── Controllers ──────────────────────────────────────────────
export const paymentController = new PaymentController(
  initiatePaymentUseCase,
  getPaymentsUseCase,
  rentInvoiceRepository,
);

// Additions to src/container/index.ts

import { TenantContextService } from '@application/tenant/services/tenant-context.service';
import { GetMyLeasesUseCase } from '@application/tenant/use-cases/get-my-leases.use-case';
import { GetMyInvoicesUseCase } from '@application/tenant/use-cases/get-my-invoices.use-case';
import { GetMyInvoiceDetailUseCase } from '@application/tenant/use-cases/get-my-invoice-detail.use-case';
import { GetMyPaymentHistoryUseCase } from '@application/tenant/use-cases/get-my-payment-history.use-case';
import { GetMyDashboardUseCase } from '@application/tenant/use-cases/get-my-dashboard.use-case';
import { TenantController } from '@presentation/controllers/tenant.controller';

// ── Tenant Services ──────────────────────────────────────────
export const tenantContextService = new TenantContextService(leaseRepository);

// ── Tenant Use Cases ─────────────────────────────────────────
export const getMyLeasesUseCase = new GetMyLeasesUseCase(
  tenantContextService,
  unitRepository,
  propertyRepository,
);

export const getMyInvoicesUseCase = new GetMyInvoicesUseCase(
  tenantContextService,
  rentInvoiceRepository,
);

export const getMyInvoiceDetailUseCase = new GetMyInvoiceDetailUseCase(
  tenantContextService,
  rentInvoiceRepository,
  paymentRepository,
);

export const getMyPaymentHistoryUseCase = new GetMyPaymentHistoryUseCase(
  tenantContextService,
  rentInvoiceRepository,
  paymentRepository,
);

export const getMyDashboardUseCase = new GetMyDashboardUseCase(
  tenantContextService,
  rentInvoiceRepository,
);

// ── Tenant Controller ────────────────────────────────────────
export const tenantController = new TenantController(
  getMyLeasesUseCase,
  getMyInvoicesUseCase,
  getMyInvoiceDetailUseCase,
  getMyPaymentHistoryUseCase,
  getMyDashboardUseCase,
);
