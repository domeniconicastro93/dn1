/**
 * Wallet Service - Complete Implementation with Database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  authMiddleware,
  walletTransactionQuerySchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  WalletDTO,
  TransactionDTO,
  TransactionListResponseDTO,
} from '@strike/shared-types';
import type { AuthenticatedRequest } from '@strike/shared-utils';

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(cors, {
  origin: true,
  credentials: true,
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'wallet-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `wallet:${clientId}`,
    RateLimitConfigs.AUTHENTICATED
  );

  if (!result.allowed) {
    reply.status(429).send(
      errorResponse(
        ErrorCodes.RATE_LIMIT_EXCEEDED,
        'Too many requests. Please try again later.'
      )
    );
    return;
  }

  reply.header('X-RateLimit-Remaining', result.remaining.toString());
  reply.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
};

// GET /api/wallet/v1 - Get wallet balance
app.get(
  '/api/wallet/v1',
  {
    preHandler: [rateLimitMiddleware, authMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Get or create wallet
      let wallet = await prisma.wallet.findUnique({
        where: { userId: request.user.userId },
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId: request.user.userId,
            balance: 0,
            currency: 'USD',
          },
        });
      }

      const walletDTO: WalletDTO = {
        userId: wallet.userId,
        balance: wallet.balance,
        currency: wallet.currency,
        updatedAt: wallet.updatedAt.toISOString(),
      };

      return reply.status(200).send(successResponse(walletDTO));
    } catch (error) {
      app.log.error('Error fetching wallet:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch wallet')
      );
    }
  }
);

// GET /api/wallet/v1/transactions - List transactions
app.get<{
  Querystring: {
    page?: string;
    pageSize?: string;
    type?: string;
  };
}>(
  '/api/wallet/v1/transactions',
  {
    preHandler: [rateLimitMiddleware, authMiddleware],
  },
  async (request: AuthenticatedRequest, reply) => {
    try {
      if (!request.user) {
        return reply.status(401).send(
          errorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
        );
      }

      // Validate query params
      const validationResult = walletTransactionQuerySchema.safeParse(request.query);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid query parameters',
            validationResult.error.errors
          )
        );
      }

      const { page, pageSize, type } = validationResult.data;

      // Get wallet
      const wallet = await prisma.wallet.findUnique({
        where: { userId: request.user.userId },
      });

      if (!wallet) {
        return reply.status(404).send(
          errorResponse(ErrorCodes.NOT_FOUND, 'Wallet not found')
        );
      }

      // Build where clause
      const where: any = {
        walletId: wallet.id,
        userId: request.user.userId,
      };

      if (type && type !== 'all') {
        where.type = type;
      }

      // Get total count
      const total = await prisma.transaction.count({ where });

      // Get transactions
      const transactions = await prisma.transaction.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      });

      const transactionDTOs: TransactionDTO[] = transactions.map((tx) => ({
        id: tx.id,
        type: tx.type as 'credit' | 'debit',
        amount: tx.amount,
        currency: tx.currency,
        description: tx.description || undefined,
        status: tx.status as 'pending' | 'completed' | 'failed',
        createdAt: tx.createdAt.toISOString(),
      }));

      const response: TransactionListResponseDTO = {
        transactions: transactionDTOs,
        total,
        page,
        pageSize,
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error fetching transactions:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to fetch transactions')
      );
    }
  }
);

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error);
  reply.status(500).send(
    errorResponse(ErrorCodes.INTERNAL_ERROR, 'Internal server error')
  );
});

const PORT = parseInt(process.env.PORT || '3010', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Wallet service listening on ${HOST}:${PORT}`);
});
