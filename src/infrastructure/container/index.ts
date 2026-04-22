// src/infrastructure/container/index.ts
import { prisma } from '@infrastructure/database/prismaClient';
import { getRedisClient } from '@infrastructure/redis/redis.client';

// Repositories
import { PrismaUserRepository } from '@infrastructure/database/repositories/PrismaUserRepository';
import { PrismaPropertyRepository } from '@infrastructure/database/repositories/PrismaPropertyRepository';
import { PrismaLeaseRepository } from '@infrastructure/database/repositories/PrismaLeaseRepository';
import { PrismaInvoiceRepository } from '@infrastructure/database/repositories/PrismaInvoiceRepository';
import { PrismaPaymentRepository } from '@infrastructure/database/repositories/PrismaPaymentRepository';

// Services (application layer)
import { AuthService } from '@application/auth/AuthService';
import { PropertyService } from '@application/property/PropertyService';
import { LeaseService } from '@application/lease/LeaseService';
import { InvoiceService } from '@application/invoice/InvoiceService';
import { PaymentService } from '@application/payment/PaymentService';

// Repositories (instantiated once)
const userRepository = new PrismaUserRepository(prisma);
const propertyRepository = new PrismaPropertyRepository(prisma);
const leaseRepository = new PrismaLeaseRepository(prisma);
const invoiceRepository = new PrismaInvoiceRepository(prisma);
const paymentRepository = new PrismaPaymentRepository(prisma);

const redis = getRedisClient();

// Services (instantiated once — singletons)
const authService = new AuthService(userRepository, prisma, redis);
const propertyService = new PropertyService(propertyRepository);
const leaseService = new LeaseService(leaseRepository, propertyRepository);
const invoiceService = new InvoiceService(invoiceRepository, leaseRepository);
const paymentService = new PaymentService(
  paymentRepository,
  invoiceRepository,
  prisma,
  redis,
);

export const container = {
  // Repositories
  userRepository,
  propertyRepository,
  leaseRepository,
  invoiceRepository,
  paymentRepository,
  // Services
  authService,
  propertyService,
  leaseService,
  invoiceService,
  paymentService,
} as const;

export type Container = typeof container;
