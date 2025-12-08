/**
 * Metrics and Logging for Orchestrator - Database-backed Implementation
 * 
 * Tracks VM metrics, capacity, and performance.
 * In production, this would integrate with Prometheus/Grafana.
 */

import { getAllVMs, getVMsByRegion } from './vm-lifecycle';
import { getAllRegionCapacities } from './region-fallback';

export interface OrchestratorMetrics {
  totalVMs: number;
  vmsByStatus: Record<string, number>;
  vmsByRegion: Record<string, number>;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  regionCapacities: Array<{
    region: string;
    availableVMs: number;
    vmsInProvisioning: number;
    averageQueueTime: number;
  }>;
  timestamp: string;
}

/**
 * Get current orchestrator metrics
 */
export async function getOrchestratorMetrics(): Promise<OrchestratorMetrics> {
  const allVMs = await getAllVMs();

  // Count VMs by status
  const vmsByStatus: Record<string, number> = {};
  const vmsByRegion: Record<string, number> = {};

  let totalCapacity = 0;
  let usedCapacity = 0;

  for (const vm of allVMs) {
    // Count by status
    vmsByStatus[vm.status] = (vmsByStatus[vm.status] || 0) + 1;

    // Count by region
    vmsByRegion[vm.region] = (vmsByRegion[vm.region] || 0) + 1;

    // Calculate capacity
    totalCapacity += vm.maxSessions;
    usedCapacity += vm.currentSessions;
  }

  const availableCapacity = totalCapacity - usedCapacity;

  const regionCapacities = await getAllRegionCapacities();

  return {
    totalVMs: allVMs.length,
    vmsByStatus,
    vmsByRegion,
    totalCapacity,
    usedCapacity,
    availableCapacity,
    regionCapacities,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Log metrics periodically (in production, this would be sent to monitoring system)
 */
export async function logMetrics(): Promise<void> {
  const metrics = await getOrchestratorMetrics();
  console.log('[METRICS]', JSON.stringify(metrics, null, 2));
}

// Log metrics every 30 seconds (in production, use proper metrics collection)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    logMetrics().catch((error) => {
      console.error('Error logging metrics:', error);
    });
  }, 30000);
}
