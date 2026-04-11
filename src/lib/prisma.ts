import { PrismaClient } from '@prisma/client';

if (!process.env.DATABASE_URL) {
  console.warn('DATABASE_URL is not set. Prisma-backed API routes will not function until it is configured.');
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
