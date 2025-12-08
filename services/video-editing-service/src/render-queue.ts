/**
 * Render Queue with Retry Logic
 * 
 * Manages render job queue with retry support for failed renders.
 * Implements exponential backoff retry strategy.
 */

import { prisma } from '@strike/shared-db';
import { processRender } from './render-pipeline';
import { publishEvent, EventTopics, EventTypes } from '@strike/shared-utils';
import type { RenderRequestDTO } from '@strike/shared-types';

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 5000, // 5 seconds
  maxDelayMs: 60000, // 60 seconds
  backoffMultiplier: 2,
};

export interface RetryContext {
  renderId: string;
  attempt: number;
  lastError?: string;
}

// Store retry contexts in memory (in production, use Redis or database)
const retryContexts = new Map<string, RetryContext>();

/**
 * Calculate delay for retry attempt using exponential backoff
 */
function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Retry render job with exponential backoff
 */
export async function retryRenderJob(
  renderId: string,
  request: RenderRequestDTO,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  const context = retryContexts.get(renderId) || { renderId, attempt: 0 };
  context.attempt += 1;

  if (context.attempt > config.maxRetries) {
    // Max retries exceeded, mark render as FAILED
    await prisma.renderJob.update({
      where: { id: renderId },
      data: {
        status: 'FAILED',
        errorMessage: `Render failed after ${config.maxRetries} retries`,
      },
    });

    await publishEvent(
      EventTopics.RENDERS,
      EventTypes.RENDER_FAILED,
      {
        renderId,
        replayId: request.replayId,
        userId: request.userId || '',
        error: `Render failed after ${config.maxRetries} retries`,
      },
      'video-editing-service'
    );

    retryContexts.delete(renderId);
    return;
  }

  retryContexts.set(renderId, context);

  const delay = calculateRetryDelay(context.attempt, config);

  // Wait before retry
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    // Update status to PROCESSING
    await prisma.renderJob.update({
      where: { id: renderId },
      data: { status: 'PROCESSING' },
    });

    // Retry render processing
    await processRender(renderId, request.userId || '', request);

    // If successful, clear retry context
    retryContexts.delete(renderId);
  } catch (error) {
    // Render failed again, retry
    context.lastError = error instanceof Error ? error.message : 'Unknown error';
    retryContexts.set(renderId, context);

    await retryRenderJob(renderId, request, config);
  }
}

/**
 * Clear retry context for a render job
 */
export function clearRetryContext(renderId: string): void {
  retryContexts.delete(renderId);
}

/**
 * Get retry context for a render job
 */
export function getRetryContext(renderId: string): RetryContext | undefined {
  return retryContexts.get(renderId);
}

/**
 * Process render queue
 * 
 * In production, this would be a worker that processes queued jobs.
 */
export async function processRenderQueue(): Promise<void> {
  // Get queued render jobs
  const queuedJobs = await prisma.renderJob.findMany({
    where: {
      status: 'QUEUED',
    },
    take: 10, // Process up to 10 jobs at a time
    orderBy: {
      createdAt: 'asc',
    },
  });

  for (const job of queuedJobs) {
    try {
      // Update status to PROCESSING
      await prisma.renderJob.update({
        where: { id: job.id },
        data: { status: 'PROCESSING' },
      });

      // Process render
      const request: RenderRequestDTO = {
        replayId: job.replayId,
        instructions: job.instructions as any,
      };

      await processRender(job.id, job.userId, request);
    } catch (error) {
      // Mark as failed and trigger retry
      await prisma.renderJob.update({
        where: { id: job.id },
        data: {
          status: 'FAILED',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      });

      // Trigger retry
      const request: RenderRequestDTO = {
        replayId: job.replayId,
        instructions: job.instructions as any,
        userId: job.userId,
      };

      await retryRenderJob(job.id, request);
    }
  }
}

/**
 * Start render queue processor (runs periodically)
 */
export function startRenderQueueProcessor(intervalMs: number = 5000): void {
  setInterval(async () => {
    try {
      await processRenderQueue();
    } catch (error) {
      console.error('[RENDER_QUEUE] Error processing queue:', error);
    }
  }, intervalMs);

  console.log('[RENDER_QUEUE] Render queue processor started');
}

