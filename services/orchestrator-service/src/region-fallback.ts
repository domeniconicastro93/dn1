/**
 * Region Fallback Logic - Database-backed Implementation
 * 
 * Implements region selection with fallback to nearest region
 * when target region has no capacity.
 */

import { findAvailableVM, getVMsByRegion } from './vm-lifecycle';

export interface RegionConfig {
  code: string; // e.g., 'us-east-1'
  name: string;
  continent: string;
  fallbackRegions: string[]; // Ordered by preference
  legalConstraints?: string[]; // Countries that cannot use this region
}

// Pre-defined region configurations
const REGION_CONFIGS: RegionConfig[] = [
  {
    code: 'us-east-1',
    name: 'US East (N. Virginia)',
    continent: 'NA',
    fallbackRegions: ['us-west-2', 'eu-west-1'],
  },
  {
    code: 'us-west-2',
    name: 'US West (Oregon)',
    continent: 'NA',
    fallbackRegions: ['us-east-1', 'us-west-1'],
  },
  {
    code: 'eu-west-1',
    name: 'EU (Ireland)',
    continent: 'EU',
    fallbackRegions: ['eu-central-1', 'us-east-1'],
  },
  {
    code: 'eu-central-1',
    name: 'EU (Frankfurt)',
    continent: 'EU',
    fallbackRegions: ['eu-west-1', 'us-east-1'],
  },
  {
    code: 'ap-southeast-1',
    name: 'Asia Pacific (Singapore)',
    continent: 'AS',
    fallbackRegions: ['ap-northeast-1', 'us-west-2'],
  },
  {
    code: 'ap-northeast-1',
    name: 'Asia Pacific (Tokyo)',
    continent: 'AS',
    fallbackRegions: ['ap-southeast-1', 'us-west-2'],
  },
];

const regionConfigMap = new Map<string, RegionConfig>();
for (const config of REGION_CONFIGS) {
  regionConfigMap.set(config.code, config);
}

export interface RegionCapacity {
  region: string;
  availableVMs: number;
  vmsInProvisioning: number;
  averageQueueTime: number; // seconds
}

/**
 * Get capacity metrics for a region
 */
export async function getRegionCapacity(region: string): Promise<RegionCapacity> {
  const vms = await getVMsByRegion(region);
  const readyVMs = vms.filter((vm) => vm.status === 'READY');
  const inUseVMs = vms.filter((vm) => vm.status === 'IN_USE');
  const provisioningVMs = vms.filter(
    (vm) => vm.status === 'PROVISIONING' || vm.status === 'BOOTING'
  );

  // Calculate available capacity (ready VMs with free slots)
  const availableCapacity = readyVMs.reduce((sum, vm) => {
    return sum + (vm.maxSessions - vm.currentSessions);
  }, 0);

  // Estimate queue time (simplified: based on provisioning VMs)
  const averageQueueTime = provisioningVMs.length * 15; // 15 seconds per VM in queue

  return {
    region,
    availableVMs: readyVMs.length,
    vmsInProvisioning: provisioningVMs.length,
    averageQueueTime,
  };
}

/**
 * Find available VM in target region, with fallback to nearest region
 */
export async function findVMWithFallback(
  targetRegion: string,
  maxSessions: number = 1
): Promise<{ vmId: string; region: string } | null> {
  // Try target region first
  const targetVM = await findAvailableVM(targetRegion, maxSessions);
  if (targetVM) {
    return { vmId: targetVM.id, region: targetVM.region };
  }

  // Check capacity of target region
  const targetCapacity = await getRegionCapacity(targetRegion);
  if (targetCapacity.availableVMs > 0 || targetCapacity.vmsInProvisioning > 0) {
    // Region has capacity but no available VM right now
    // Could trigger VM creation or wait
    return null; // For now, return null (could implement queue)
  }

  // Try fallback regions
  const config = regionConfigMap.get(targetRegion);
  if (!config) {
    return null; // Unknown region
  }

  for (const fallbackRegion of config.fallbackRegions) {
    const fallbackVM = await findAvailableVM(fallbackRegion, maxSessions);
    if (fallbackVM) {
      return { vmId: fallbackVM.id, region: fallbackVM.region };
    }
  }

  return null; // No capacity in any region
}

/**
 * Get all region capacities
 */
export async function getAllRegionCapacities(): Promise<RegionCapacity[]> {
  const capacities = await Promise.all(
    REGION_CONFIGS.map((config) => getRegionCapacity(config.code))
  );
  return capacities;
}
