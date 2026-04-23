import { prisma } from '@infrastructure/database/prisma.client';

// Repository implementations
import { UserRepositoryImpl } from '@infrastructure/database/repositories/user.repository.impl';
import { LeaseRepositoryImpl } from '@infrastructure/database/repositories/lease.repository.impl';
import { RentInvoiceRepositoryImpl } from '@infrastructure/database/repositories/rent-invoice.repository.impl';
import { PaymentRepositoryImpl } from '@infrastructure/database/repositories/payment.repository.impl';

// Use cases (wired in Phase 3)
// import { RegisterUseCase } from '@application/auth/use-cases/register.use-case';

// Repositories — instantiated once, shared
export const userRepository = new UserRepositoryImpl(prisma);
export const leaseRepository = new LeaseRepositoryImpl(prisma);
export const rentInvoiceRepository = new RentInvoiceRepositoryImpl(prisma);
export const paymentRepository = new PaymentRepositoryImpl(prisma);

// Use cases are exported from here so controllers never import infrastructure directly
// export const registerUseCase = new RegisterUseCase(userRepository);
