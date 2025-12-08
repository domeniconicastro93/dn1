/**
 * Retry Pipeline for VM Provisioning Failures
 * 
 * Implements exponential backoff retry logic for:
 * - VM provisioning failures
 * - Boot failures
 * - Network errors
 * - Cloud provider API errors
 */

import { prisma } from '@strike/shared-db';
import { emitVMError } from './events';
import { markVMStatus } from './vm-lifecycle';

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
  vmId: string;
  attempt: number;
  lastError?: string;
  lastErrorCode?: string;
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
 * Retry VM provisioning with exponential backoff
 */
export async function retryVMProvisioning(
  vmId: string,
  templateId: string,
  region: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  const context = retryContexts.get(vmId) || { vmId, attempt: 0 };
  context.attempt += 1;

  if (context.attempt > config.maxRetries) {
    // Max retries exceeded, mark VM as ERROR and terminate
    await handleVMError(
      vmId,
      'PROVISIONING_FAILED',
      `VM provisioning failed after ${config.maxRetries} retries`
    );
    retryContexts.delete(vmId);
    return;
  }

  retryContexts.set(vmId, context);

  const delay = calculateRetryDelay(context.attempt, config);

  // Wait before retry
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    // Retry provisioning (in production, this would call cloud provider API)
    // For now, we simulate by transitioning to BOOTING
    await markVMStatus(vmId, 'PROVISIONING');

    // Simulate provisioning attempt
    setTimeout(async () => {
      try {
        await markVMStatus(vmId, 'BOOTING');
        // If successful, clear retry context
        retryContexts.delete(vmId);
      } catch (error) {
        // Boot failed, retry again
        await retryVMProvisioning(vmId, templateId, region, config);
      }
    }, 10000);
  } catch (error) {
    // Provisioning failed again, retry
    context.lastError = error instanceof Error ? error.message : 'Unknown error';
    context.lastErrorCode = 'PROVISIONING_ERROR';
    retryContexts.set(vmId, context);

    await retryVMProvisioning(vmId, templateId, region, config);
  }
}

/**
 * Retry VM boot with exponential backoff
 */
export async function retryVMBoot(
  vmId: string,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  const context = retryContexts.get(vmId) || { vmId, attempt: 0 };
  context.attempt += 1;

  if (context.attempt > config.maxRetries) {
    // Max retries exceeded, mark VM as ERROR
    await handleVMError(
      vmId,
      'BOOT_FAILED',
      `VM boot failed after ${config.maxRetries} retries`
    );
    retryContexts.delete(vmId);
    return;
  }

  retryContexts.set(vmId, context);

  const delay = calculateRetryDelay(context.attempt, config);

  // Wait before retry
  await new Promise((resolve) => setTimeout(resolve, delay));

  try {
    // Retry boot (in production, this would check VM status via cloud provider API)
    const vm = await prisma.vM.findUnique({ where: { id: vmId } });
    if (!vm) {
      throw new Error('VM not found');
    }

    // Simulate boot attempt
    setTimeout(async () => {
      try {
        await markVMStatus(vmId, 'READY');
        // If successful, clear retry context
        retryContexts.delete(vmId);
      } catch (error) {
        // Boot failed again, retry
        await retryVMBoot(vmId, config);
      }
    }, 5000);
  } catch (error) {
    // Boot failed again, retry
    context.lastError = error instanceof Error ? error.message : 'Unknown error';
    context.lastErrorCode = 'BOOT_ERROR';
    retryContexts.set(vmId, context);

    await retryVMBoot(vmId, config);
  }
}

/**
 * Handle VM error and determine if retry is appropriate
 * (Internal function used by vm-lifecycle.ts)
 */
export async function handleVMError(
  vmId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  const vm = await prisma.vM.findUnique({ where: { id: vmId } });
  if (!vm) {
    return;
  }

  // Update VM with error
  await prisma.vM.update({
    where: { id: vmId },
    data: {
      status: 'ERROR',
      errorCode,
      errorMessage,
    },
  });

  emitVMError(vmId, errorCode, errorMessage);

  // Determine if error is retryable
  const retryableErrors = [
    'PROVISIONING_TIMEOUT',
    'BOOT_TIMEOUT',
    'NETWORK_ERROR',
    'CLOUD_API_ERROR',
  ];

  if (retryableErrors.includes(errorCode) && vm.status === 'PROVISIONING') {
    // Retry provisioning
    await retryVMProvisioning(vmId, vm.templateId, vm.region);
  } else if (retryableErrors.includes(errorCode) && vm.status === 'BOOTING') {
    // Retry boot
    await retryVMBoot(vmId);
  } else {
    // Non-retryable error or max retries exceeded
    // VM will remain in ERROR state for manual intervention
  }
}

/**
 * Clear retry context for a VM
 */
export function clearRetryContext(vmId: string): void {
  retryContexts.delete(vmId);
}

/**
 * Get retry context for a VM
 */
export function getRetryContext(vmId: string): RetryContext | undefined {
  return retryContexts.get(vmId);
}

