/**
 * VM Provider - Static VM Management
 * 
 * Phase 11.A1: Single static VM (20.31.130.73)
 * Future phases: Dynamic VM allocation, auto-scaling
 * 
 * Responsibilities:
 * - VM selection/allocation
 * - VM health monitoring
 * - Capacity management
 */

import type { CloudGamingSession } from '../types/webrtc';

/**
 * VM information
 */
export interface VMInfo {
    /** VM ID */
    id: string;
    /** VM hostname/IP */
    host: string;
    /** VM region */
    region: string;
    /** VM status */
    status: 'AVAILABLE' | 'BUSY' | 'OFFLINE' | 'ERROR';
    /** Current sessions */
    currentSessions: number;
    /** Maximum sessions */
    maxSessions: number;
    /** Last health check */
    lastHealthCheck?: Date;
}

/**
 * VM allocation request
 */
export interface VMAllocationRequest {
    /** User ID */
    userId: string;
    /** Game/App ID */
    appId: string;
    /** Preferred region (optional) */
    region?: string;
}

/**
 * VM allocation result
 */
export interface VMAllocationResult {
    /** VM info */
    vm: VMInfo;
    /** Allocated successfully */
    allocated: boolean;
    /** Error message (if allocation failed) */
    error?: string;
}

/**
 * VM Provider
 * 
 * Phase 11.A1: Static single VM implementation
 */
export class VMProvider {
    private static instance: VMProvider;
    private staticVM: VMInfo;

    private constructor() {
        // Initialize static VM from environment
        this.staticVM = {
            id: process.env.SUNSHINE_VM_ID || 'static-vm-001',
            host: process.env.SUNSHINE_VM_HOST || '20.31.130.73',
            region: process.env.SUNSHINE_VM_REGION || 'westeurope',
            status: 'AVAILABLE',
            currentSessions: 0,
            maxSessions: parseInt(process.env.SUNSHINE_VM_MAX_SESSIONS || '1', 10),
            lastHealthCheck: new Date(),
        };

        console.log('[VMProvider] Initialized with static VM:', {
            id: this.staticVM.id,
            host: this.staticVM.host,
            region: this.staticVM.region,
            maxSessions: this.staticVM.maxSessions,
        });
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): VMProvider {
        if (!VMProvider.instance) {
            VMProvider.instance = new VMProvider();
        }
        return VMProvider.instance;
    }

    /**
     * Allocate a VM for a session
     * 
     * Phase 11.A1: Always returns the static VM if available
     * Future: Implement dynamic VM selection based on load, region, etc.
     * 
     * @param request - Allocation request
     * @returns Allocation result
     */
    async allocateVM(request: VMAllocationRequest): Promise<VMAllocationResult> {
        console.log('[VMProvider] allocateVM() called');
        console.log('[VMProvider] Request:', request);

        // Check if static VM is available
        if (this.staticVM.status !== 'AVAILABLE') {
            return {
                vm: this.staticVM,
                allocated: false,
                error: `VM is ${this.staticVM.status}`,
            };
        }

        // Check capacity
        if (this.staticVM.currentSessions >= this.staticVM.maxSessions) {
            return {
                vm: this.staticVM,
                allocated: false,
                error: 'VM at maximum capacity',
            };
        }

        // Allocate VM
        this.staticVM.currentSessions++;
        this.staticVM.status = 'BUSY';

        console.log('[VMProvider] VM allocated:', {
            vmId: this.staticVM.id,
            currentSessions: this.staticVM.currentSessions,
            maxSessions: this.staticVM.maxSessions,
        });

        return {
            vm: { ...this.staticVM },
            allocated: true,
        };
    }

    /**
     * Release a VM after session ends
     * 
     * @param vmId - VM ID
     * @param sessionId - Session ID
     */
    async releaseVM(vmId: string, sessionId: string): Promise<void> {
        console.log('[VMProvider] releaseVM() called');
        console.log('[VMProvider] VM ID:', vmId);
        console.log('[VMProvider] Session ID:', sessionId);

        if (vmId !== this.staticVM.id) {
            console.warn('[VMProvider] Unknown VM ID:', vmId);
            return;
        }

        // Decrement session count
        if (this.staticVM.currentSessions > 0) {
            this.staticVM.currentSessions--;
        }

        // Update status
        if (this.staticVM.currentSessions === 0) {
            this.staticVM.status = 'AVAILABLE';
        }

        console.log('[VMProvider] VM released:', {
            vmId: this.staticVM.id,
            currentSessions: this.staticVM.currentSessions,
            status: this.staticVM.status,
        });
    }

    /**
     * Get VM information
     * 
     * @param vmId - VM ID
     * @returns VM info or null
     */
    async getVM(vmId: string): Promise<VMInfo | null> {
        if (vmId === this.staticVM.id) {
            return { ...this.staticVM };
        }
        return null;
    }

    /**
     * Get all available VMs
     * 
     * Phase 11.A1: Returns only the static VM
     * Future: Return list of all VMs in pool
     * 
     * @returns List of VMs
     */
    async getAvailableVMs(): Promise<VMInfo[]> {
        if (this.staticVM.status === 'AVAILABLE') {
            return [{ ...this.staticVM }];
        }
        return [];
    }

    /**
     * Health check for VM
     * 
     * Phase 11.A1: MOCKED - Always returns healthy
     * Future: Implement real health check (ping, Sunshine API, etc.)
     * 
     * @param vmId - VM ID
     * @returns Health status
     */
    async checkVMHealth(vmId: string): Promise<{ healthy: boolean; error?: string }> {
        console.log('[VMProvider] checkVMHealth() called (MOCKED)');
        console.log('[VMProvider] VM ID:', vmId);

        if (vmId !== this.staticVM.id) {
            return {
                healthy: false,
                error: 'Unknown VM ID',
            };
        }

        // TODO Phase 11.A2: Implement real health check
        // - Ping VM
        // - Check Sunshine API
        // - Verify network connectivity

        // Mock healthy status
        this.staticVM.lastHealthCheck = new Date();

        return {
            healthy: true,
        };
    }

    /**
     * Get VM capacity metrics
     * 
     * @param vmId - VM ID
     * @returns Capacity metrics
     */
    async getVMCapacity(vmId: string): Promise<{
        currentSessions: number;
        maxSessions: number;
        availableCapacity: number;
        utilizationPercent: number;
    } | null> {
        if (vmId !== this.staticVM.id) {
            return null;
        }

        const availableCapacity = this.staticVM.maxSessions - this.staticVM.currentSessions;
        const utilizationPercent = (this.staticVM.currentSessions / this.staticVM.maxSessions) * 100;

        return {
            currentSessions: this.staticVM.currentSessions,
            maxSessions: this.staticVM.maxSessions,
            availableCapacity,
            utilizationPercent,
        };
    }

    /**
     * Update VM status
     * 
     * @param vmId - VM ID
     * @param status - New status
     */
    async updateVMStatus(vmId: string, status: VMInfo['status']): Promise<void> {
        if (vmId === this.staticVM.id) {
            this.staticVM.status = status;
            console.log('[VMProvider] VM status updated:', {
                vmId,
                status,
            });
        }
    }

    /**
     * Get static VM info (for debugging)
     */
    public getStaticVM(): VMInfo {
        return { ...this.staticVM };
    }
}

/**
 * Get VM provider instance
 */
export function getVMProvider(): VMProvider {
    return VMProvider.getInstance();
}
