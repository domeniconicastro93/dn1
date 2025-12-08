/**
 * Payments Service - Complete Implementation with Database
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import Stripe from 'stripe';
import {
  successResponse,
  errorResponse,
  ErrorCodes,
  RateLimitConfigs,
  rateLimiter,
  authMiddleware,
  createCheckoutSessionRequestSchema,
  publishEvent,
  EventTopics,
  EventTypes,
} from '@strike/shared-utils';
import { prisma } from '@strike/shared-db';
import type {
  CreateCheckoutSessionRequestDTO,
  CheckoutSessionResponseDTO,
  PaymentWebhookDTO,
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

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-11-20.acacia',
});

// Health check
app.get('/health', async () => {
  return successResponse({ status: 'ok', service: 'payments-service' });
});

// Rate limiting middleware
const rateLimitMiddleware = async (request: any, reply: any) => {
  const clientId = request.ip || 'unknown';
  const result = rateLimiter.check(
    `payments:${clientId}`,
    RateLimitConfigs.PAYMENT
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

// Geo rules check
const checkGeoRules = async (country: string) => {
  // Block payments from Russia
  if (country === 'RU') {
    throw new Error('Payments from Russia are not allowed');
  }
  // Special handling for China (diaspora only)
  // TODO: Implement CN-specific logic
};

// POST /api/payments/v1/checkout-session
app.post<{ Body: CreateCheckoutSessionRequestDTO }>(
  '/api/payments/v1/checkout-session',
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

      // Validate input
      const validationResult = createCheckoutSessionRequestSchema.safeParse(request.body);
      if (!validationResult.success) {
        return reply.status(400).send(
          errorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Invalid input',
            validationResult.error.errors
          )
        );
      }

      const { userId, planId, locale, currency, country } = validationResult.data;

      // Verify user matches authenticated user
      if (userId !== request.user.userId) {
        return reply.status(403).send(
          errorResponse(ErrorCodes.FORBIDDEN, 'Cannot create checkout for other users')
        );
      }

      // Check geo rules
      try {
        await checkGeoRules(country);
      } catch (error) {
        return reply.status(403).send(
          errorResponse(
            ErrorCodes.PAYMENT_BLOCKED,
            error instanceof Error ? error.message : 'Payment blocked'
          )
        );
      }

      // Get plan details (from config or database)
      const planAmount = 999; // $9.99 in cents
      const planName = 'Strike Premium';

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: planName,
              },
              unit_amount: planAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3002'}/payment/cancel`,
        customer_email: request.user.email,
        metadata: {
          userId,
          planId,
          locale,
        },
      });

      // Store payment record
      await prisma.payment.create({
        data: {
          userId,
          planId,
          stripeSessionId: session.id,
          amount: planAmount,
          currency: currency.toUpperCase(),
          country,
          status: 'pending',
        },
      });

      const response: CheckoutSessionResponseDTO = {
        sessionId: session.id,
        url: session.url || '',
      };

      return reply.status(200).send(successResponse(response));
    } catch (error) {
      app.log.error('Error creating checkout session:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to create checkout session')
      );
    }
  }
);

// POST /api/payments/v1/webhook/stripe
app.post<{ Body: PaymentWebhookDTO }>(
  '/api/payments/v1/webhook/stripe',
  async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;

    if (!sig) {
      return reply.status(400).send(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Missing stripe-signature header')
      );
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        JSON.stringify(request.body),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (error) {
      app.log.error('Webhook signature verification failed:', error);
      return reply.status(400).send(
        errorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid webhook signature')
      );
    }

    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (!userId || !planId) {
          app.log.error('Missing metadata in checkout session:', session.id);
          return reply.status(400).send(
            errorResponse(ErrorCodes.VALIDATION_ERROR, 'Missing required metadata')
          );
        }

        // Update payment status
        await prisma.payment.updateMany({
          where: { stripeSessionId: session.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
          },
        });

        // Update user premium status
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month subscription

        await prisma.user.update({
          where: { id: userId },
          data: {
            premiumTier: 'premium',
            premiumExpiresAt: expiresAt,
          },
        });

        // Credit wallet if needed
        const wallet = await prisma.wallet.findUnique({
          where: { userId },
        });

        if (wallet) {
          await prisma.transaction.create({
            data: {
              walletId: wallet.id,
              userId,
              type: 'credit',
              amount: 0, // No credit for subscription, just premium access
              currency: 'USD',
              status: 'completed',
              description: 'Premium subscription activated',
            },
          });
        }

        // Emit PaymentCompleted event
        await publishEvent(
          EventTopics.PAYMENTS,
          EventTypes.PAYMENT_COMPLETED,
          {
            userId,
            planId,
            amount: session.amount_total || 0,
            currency: session.currency || 'usd',
          },
          'payments-service'
        );
      } else if (event.type === 'payment_intent.payment_failed') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = (paymentIntent.metadata as any)?.userId;

        if (userId) {
          await prisma.payment.updateMany({
            where: {
              userId,
              status: 'pending',
            },
            data: {
              status: 'failed',
            },
          });

          // Emit PaymentFailed event
          await publishEvent(
            EventTopics.PAYMENTS,
            EventTypes.PAYMENT_FAILED,
            {
              userId,
              paymentIntentId: paymentIntent.id,
            },
            'payments-service'
          );
        }
      }

      return reply.status(200).send(successResponse({ received: true }));
    } catch (error) {
      app.log.error('Error processing webhook:', error);
      return reply.status(500).send(
        errorResponse(ErrorCodes.INTERNAL_ERROR, 'Failed to process webhook')
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

const PORT = parseInt(process.env.PORT || '3009', 10);
const HOST = process.env.HOST || '0.0.0.0';

app.listen({ port: PORT, host: HOST }, (err) => {
  if (err) {
    app.log.error(err);
    process.exit(1);
  }
  app.log.info(`Payments service listening on ${HOST}:${PORT}`);
});
