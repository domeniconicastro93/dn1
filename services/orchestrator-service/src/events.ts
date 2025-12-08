/**
 * Event System for Orchestrator
 * 
 * Emits events for VM lifecycle changes.
 * In production, this would use Kafka/NATS.
 * For Phase 5, we use an in-memory event emitter.
 */

import { EventEmitter } from 'events';
import type { VM } from './vm-lifecycle';

export interface VMProvisionedEvent {
  vmId: string;
  templateId: string;
  region: string;
  timestamp: string;
}

export interface VMReadyEvent {
  vmId: string;
  timestamp: string;
}

export interface VMErrorEvent {
  vmId: string;
  errorCode: string;
  errorMessage: string;
  timestamp: string;
}

export interface VMPoolLowCapacityEvent {
  region: string;
  availableVMs: number;
  timestamp: string;
}

export interface VMTerminatedEvent {
  vmId: string;
  reason?: string;
  timestamp: string;
}

export interface SessionAssignedEvent {
  vmId: string;
  sessionId: string;
  timestamp: string;
}

export interface SessionReleasedEvent {
  vmId: string;
  sessionId: string;
  timestamp: string;
}

class OrchestratorEventEmitter extends EventEmitter {
  emitVMProvisioned(event: VMProvisionedEvent): void {
    this.emit('vm-provisioned', event);
    console.log('[EVENT] VMProvisioned:', event);
  }

  emitVMReady(event: VMReadyEvent): void {
    this.emit('vm-ready', event);
    console.log('[EVENT] VMReady:', event);
  }

  emitVMError(event: VMErrorEvent): void {
    this.emit('vm-error', event);
    console.log('[EVENT] VMError:', event);
  }

  emitVMPoolLowCapacity(event: VMPoolLowCapacityEvent): void {
    this.emit('vm-pool-low-capacity', event);
    console.log('[EVENT] VMPoolLowCapacity:', event);
  }

  emitVMTerminated(event: VMTerminatedEvent): void {
    this.emit('vm-terminated', event);
    console.log('[EVENT] VMTerminated:', event);
  }

  emitSessionAssigned(event: SessionAssignedEvent): void {
    this.emit('session-assigned', event);
    console.log('[EVENT] SessionAssigned:', event);
  }

  emitSessionReleased(event: SessionReleasedEvent): void {
    this.emit('session-released', event);
    console.log('[EVENT] SessionReleased:', event);
  }
}

export const orchestratorEvents = new OrchestratorEventEmitter();

/**
 * Helper to emit events with timestamp
 */
export function emitVMProvisioned(vmId: string, templateId: string, region: string): void {
  orchestratorEvents.emitVMProvisioned({
    vmId,
    templateId,
    region,
    timestamp: new Date().toISOString(),
  });
}

export function emitVMReady(vmId: string): void {
  orchestratorEvents.emitVMReady({
    vmId,
    timestamp: new Date().toISOString(),
  });
}

export function emitVMError(vmId: string, errorCode: string, errorMessage: string): void {
  orchestratorEvents.emitVMError({
    vmId,
    errorCode,
    errorMessage,
    timestamp: new Date().toISOString(),
  });
}

export function emitVMPoolLowCapacity(region: string, availableVMs: number): void {
  orchestratorEvents.emitVMPoolLowCapacity({
    region,
    availableVMs,
    timestamp: new Date().toISOString(),
  });
}

export function emitVMTerminated(vmId: string, reason?: string): void {
  orchestratorEvents.emitVMTerminated({
    vmId,
    reason,
    timestamp: new Date().toISOString(),
  });
}

export function emitSessionAssigned(vmId: string, sessionId: string): void {
  orchestratorEvents.emitSessionAssigned({
    vmId,
    sessionId,
    timestamp: new Date().toISOString(),
  });
}

export function emitSessionReleased(vmId: string, sessionId: string): void {
  orchestratorEvents.emitSessionReleased({
    vmId,
    sessionId,
    timestamp: new Date().toISOString(),
  });
}

