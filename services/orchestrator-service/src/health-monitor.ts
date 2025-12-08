/**
 * Health Monitor for VMs
 * 
 * Monitors VM health by checking heartbeat timestamps.
 * Detects unresponsive VMs and marks them as ERROR.
 * 
 * Master Prompt Section 7: "Health checks: heartbeat from VM, detect unresponsive VMs"
 */

import { getVMsByStatus, getVM, handleVMError } from './vm-lifecycle';

const HEARTBEAT_TIMEOUT_MS = 60000; // 60 seconds - VM should heartbeat at least every 60s
const HEALTH_CHECK_INTERVAL_MS = 30000; // Check every 30 seconds

/**
 * Check VM health based on last heartbeat
 */
export async function checkVMHealth(vmId: string): Promise<{
  healthy: boolean;
  lastHeartbeat?: Date;
  timeSinceLastHeartbeat?: number;
}> {
  const vm = await getVM(vmId);
  if (!vm) {
    return { healthy: false };
  }

  // VMs in terminal states don't need health checks
  if (vm.status === 'TERMINATED' || vm.status === 'ERROR') {
    return { healthy: true }; // Not applicable
  }

  // VMs that haven't started yet don't need health checks
  if (vm.status === 'TEMPLATE' || vm.status === 'PENDING' || vm.status === 'PROVISIONING') {
    return { healthy: true }; // Not applicable yet
  }

  if (!vm.lastHeartbeat) {
    // VM has never sent a heartbeat - might be starting up
    // Give it grace period if it's in BOOTING
    if (vm.status === 'BOOTING') {
      return { healthy: true }; // Still booting, no heartbeat expected yet
    }
    
    // Otherwise, mark as unhealthy if it's been running for a while
    const ageMs = Date.now() - vm.createdAt.getTime();
    if (ageMs > 120000) { // 2 minutes without heartbeat = unhealthy
      return { healthy: false, timeSinceLastHeartbeat: ageMs };
    }
    
    return { healthy: true }; // Still in grace period
  }

  const timeSinceLastHeartbeat = Date.now() - vm.lastHeartbeat.getTime();
  const healthy = timeSinceLastHeartbeat < HEARTBEAT_TIMEOUT_MS;

  return {
    healthy,
    lastHeartbeat: vm.lastHeartbeat,
    timeSinceLastHeartbeat,
  };
}

/**
 * Check all active VMs and mark unresponsive ones as ERROR
 */
export async function checkAllVMHealth(): Promise<void> {
  // Get all VMs that should be sending heartbeats
  const activeVMs = await getVMsByStatus('READY');
  const inUseVMs = await getVMsByStatus('IN_USE');
  const runningVMs = await getVMsByStatus('RUNNING');
  const bootingVMs = await getVMsByStatus('BOOTING');

  const allVMsToCheck = [...activeVMs, ...inUseVMs, ...runningVMs, ...bootingVMs];

  for (const vm of allVMsToCheck) {
    const health = await checkVMHealth(vm.id);
    
    if (!health.healthy) {
      console.warn(
        `[HEALTH] VM ${vm.id} is unresponsive (last heartbeat: ${health.timeSinceLastHeartbeat}ms ago)`
      );
      
      // Mark VM as ERROR
      await handleVMError(
        vm.id,
        'HEARTBEAT_TIMEOUT',
        `VM has not sent heartbeat in ${Math.floor((health.timeSinceLastHeartbeat || 0) / 1000)} seconds`
      );
    }
  }
}

/**
 * Start health monitoring (runs periodically)
 */
export function startHealthMonitoring(): void {
  if (process.env.NODE_ENV === 'test') {
    return; // Don't run in tests
  }

  // Run health check every 30 seconds
  setInterval(() => {
    checkAllVMHealth().catch((error) => {
      console.error('[HEALTH] Error checking VM health:', error);
    });
  }, HEALTH_CHECK_INTERVAL_MS);

  console.log('[HEALTH] VM health monitoring started');
}

