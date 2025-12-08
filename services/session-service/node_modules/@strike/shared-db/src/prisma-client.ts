/**
 * Prisma Client Singleton
 * 
 * Provides a single instance of PrismaClient for all services
 */

import { PrismaClient } from '@prisma/client';

// Prevent multiple instances in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// DEBUG: Log all Prisma calls to find legacy session code
if (process.env.DEBUG_PRISMA === 'true') {
  prisma.$use(async (params, next) => {
    const start = Date.now();
    console.log('[PRISMA DEBUG] ========================================');
    console.log('[PRISMA DEBUG] Model:', params.model);
    console.log('[PRISMA DEBUG] Action:', params.action);
    console.log('[PRISMA DEBUG] Args:', JSON.stringify(params.args, null, 2));

    // Get stack trace to see where this is being called from
    const stack = new Error().stack;
    const relevantStack = stack?.split('\n').slice(2, 8).join('\n');
    console.log('[PRISMA DEBUG] Called from:\n', relevantStack);

    const result = await next(params);
    const duration = Date.now() - start;
    console.log('[PRISMA DEBUG] Duration:', duration, 'ms');
    console.log('[PRISMA DEBUG] ========================================');
    return result;
  });
}

