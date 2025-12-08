/**
 * VM Lifecycle Management - Database-backed Implementation
 * 
 * Implements full GPU VM lifecycle state machine using Prisma:
 * TEMPLATE → PROVISIONING → BOOTING → READY → IN_USE → DRAINING → ERROR/TERMINATED
 */

import { prisma } from '@strike/shared-db';
import type { VMDTO } from '@strike/shared-types';
import { emitVMProvisioned, emitVMReady } from './events';
import { retryVMProvisioning, retryVMBoot, handleVMError as handleVMErrorWithRetry } from './retry-pipeline';

export type VMStatus =
  | 'TEMPLATE'           // Base image, not used directly
  | 'PENDING'            // VM creation requested, waiting to start
  | 'PROVISIONING'       // VM is being created from template
  | 'BOOTING'            // OS starting, agents initializing
  | 'READY'              // Ready to accept sessions
  | 'ASSIGNING_SESSION'  // Currently assigning a session (transitional)
  | 'IN_USE'             // Running one or multiple user sessions (alias: RUNNING)
  | 'RUNNING'            // Alias for IN_USE (Master Prompt compatibility)
  | 'DRAINING'           // No new sessions, waiting for active ones to finish
  | 'TERMINATING'        // VM is being terminated
  | 'ERROR'              // Something went wrong
  | 'TERMINATED';        // VM destroyed

export interface VM {
  id: string;
  templateId: string;
  region: string;
  status: VMStatus;
  currentSessions: number;
  maxSessions: number;
  createdAt: Date;
  updatedAt: Date;
  errorCode?: string;
  errorMessage?: string;
  lastHeartbeat?: Date;
}

export interface VMTemplate {
  id: string;
  name: string;
  gpuType: string; // e.g., 'L4-360', 'A10', 'RTX-4080'
  vcpu: number;
  ramGb: number;
  vramGb: number;
  maxConcurrentSessions: number;
  suggestedFpsRange?: { min: number; max: number };
  suggestedBitrateRange?: { min: number; max: number };
}

// Initialize default GPU templates in database
export async function initializeTemplates(): Promise<void> {
  const defaultTemplates = [
    {
      id: 'l4-360',
      name: 'NVIDIA L4 360GB',
      gpuType: 'L4-360',
      vcpu: 8,
      ramGb: 32,
      vramGb: 24,
      maxConcurrentSessions: 4,
      suggestedFpsRange: { min: 60, max: 120 },
      suggestedBitrateRange: { min: 8000, max: 15000 },
    },
    {
      id: 'l4-90',
      name: 'NVIDIA L4 90GB',
      gpuType: 'L4-90',
      vcpu: 4,
      ramGb: 16,
      vramGb: 12,
      maxConcurrentSessions: 2,
      suggestedFpsRange: { min: 60, max: 60 },
      suggestedBitrateRange: { min: 5000, max: 10000 },
    },
    {
      id: 'a10',
      name: 'NVIDIA A10',
      gpuType: 'A10',
      vcpu: 12,
      ramGb: 48,
      vramGb: 24,
      maxConcurrentSessions: 4,
      suggestedFpsRange: { min: 60, max: 120 },
      suggestedBitrateRange: { min: 10000, max: 20000 },
    },
    {
      id: 'a16',
      name: 'NVIDIA A16',
      gpuType: 'A16',
      vcpu: 16,
      ramGb: 64,
      vramGb: 64,
      maxConcurrentSessions: 6,
      suggestedFpsRange: { min: 120, max: 240 },
      suggestedBitrateRange: { min: 15000, max: 30000 },
    },
    {
      id: 'rtx-4060',
      name: 'NVIDIA RTX 4060',
      gpuType: 'RTX-4060',
      vcpu: 6,
      ramGb: 16,
      vramGb: 8,
      maxConcurrentSessions: 2,
      suggestedFpsRange: { min: 60, max: 60 },
      suggestedBitrateRange: { min: 5000, max: 8000 },
    },
    {
      id: 'rtx-4080',
      name: 'NVIDIA RTX 4080',
      gpuType: 'RTX-4080',
      vcpu: 12,
      ramGb: 32,
      vramGb: 16,
      maxConcurrentSessions: 4,
      suggestedFpsRange: { min: 60, max: 120 },
      suggestedBitrateRange: { min: 10000, max: 20000 },
    },
    {
      id: 'rtx-4090',
      name: 'NVIDIA RTX 4090',
      gpuType: 'RTX-4090',
      vcpu: 16,
      ramGb: 48,
      vramGb: 24,
      maxConcurrentSessions: 4,
      suggestedFpsRange: { min: 120, max: 240 },
      suggestedBitrateRange: { min: 15000, max: 30000 },
    },
  ];

  for (const template of defaultTemplates) {
    await prisma.vMTemplate.upsert({
      where: { id: template.id },
      create: {
        id: template.id,
        name: template.name,
        gpuType: template.gpuType,
        vcpu: template.vcpu,
        ramGb: template.ramGb,
        vramGb: template.vramGb,
        maxConcurrentSessions: template.maxConcurrentSessions,
        suggestedFpsRange: template.suggestedFpsRange as any,
        suggestedBitrateRange: template.suggestedBitrateRange as any,
      },
      update: {
        name: template.name,
        gpuType: template.gpuType,
        vcpu: template.vcpu,
        ramGb: template.ramGb,
        vramGb: template.vramGb,
        maxConcurrentSessions: template.maxConcurrentSessions,
        suggestedFpsRange: template.suggestedFpsRange as any,
        suggestedBitrateRange: template.suggestedBitrateRange as any,
      },
    });
  }
}

// VM Lifecycle Operations

export async function getTemplate(templateId: string): Promise<VMTemplate | null> {
  const template = await prisma.vMTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) return null;

  return {
    id: template.id,
    name: template.name,
    gpuType: template.gpuType,
    vcpu: template.vcpu,
    ramGb: template.ramGb,
    vramGb: template.vramGb,
    maxConcurrentSessions: template.maxConcurrentSessions,
    suggestedFpsRange: template.suggestedFpsRange as { min: number; max: number } | undefined,
    suggestedBitrateRange: template.suggestedBitrateRange as { min: number; max: number } | undefined,
  };
}

export async function getAllTemplates(): Promise<VMTemplate[]> {
  const templates = await prisma.vMTemplate.findMany();
  return templates.map((t) => ({
    id: t.id,
    name: t.name,
    gpuType: t.gpuType,
    vcpu: t.vcpu,
    ramGb: t.ramGb,
    vramGb: t.vramGb,
    maxConcurrentSessions: t.maxConcurrentSessions,
    suggestedFpsRange: t.suggestedFpsRange as { min: number; max: number } | undefined,
    suggestedBitrateRange: t.suggestedBitrateRange as { min: number; max: number } | undefined,
  }));
}

export async function createVM(
  templateId: string,
  region: string
): Promise<VM> {
  const template = await getTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  // Create VM in database (start with PENDING, then PROVISIONING)
  const vm = await prisma.vM.create({
    data: {
      templateId,
      region,
      status: 'PENDING', // Master Prompt: PENDING before PROVISIONING
      currentSessions: 0,
      maxSessions: template.maxConcurrentSessions,
    },
  });

  // Immediately transition to PROVISIONING
  await prisma.vM.update({
    where: { id: vm.id },
    data: { status: 'PROVISIONING' },
  });

  emitVMProvisioned(vm.id, templateId, region);

  // Simulate provisioning (in production, this would call cloud provider API)
  // Wrap in try-catch to handle provisioning failures with retry
  setTimeout(async () => {
    try {
      await markVMStatus(vm.id, 'BOOTING');
      // Simulate booting
      setTimeout(async () => {
        try {
          await markVMReady(vm.id);
        } catch (error) {
          // Boot failed, trigger retry
          await retryVMBoot(vm.id);
        }
      }, 5000); // 5 seconds boot time
    } catch (error) {
      // Provisioning failed, trigger retry
      await retryVMProvisioning(vm.id, templateId, region);
    }
  }, 10000); // 10 seconds provisioning time

  return {
    id: vm.id,
    templateId: vm.templateId,
    region: vm.region,
    status: vm.status as VMStatus,
    currentSessions: vm.currentSessions,
    maxSessions: vm.maxSessions,
    createdAt: vm.createdAt,
    updatedAt: vm.updatedAt,
    errorCode: vm.errorCode || undefined,
    errorMessage: vm.errorMessage || undefined,
    lastHeartbeat: vm.lastHeartbeat || undefined,
  };
}

export async function getVM(vmId: string): Promise<VM | null> {
  const vm = await prisma.vM.findUnique({
    where: { id: vmId },
  });

  if (!vm) return null;

  return {
    id: vm.id,
    templateId: vm.templateId,
    region: vm.region,
    status: vm.status as VMStatus,
    currentSessions: vm.currentSessions,
    maxSessions: vm.maxSessions,
    createdAt: vm.createdAt,
    updatedAt: vm.updatedAt,
    errorCode: vm.errorCode || undefined,
    errorMessage: vm.errorMessage || undefined,
    lastHeartbeat: vm.lastHeartbeat || undefined,
  };
}

export async function markVMReady(vmId: string): Promise<VM | null> {
  const vm = await getVM(vmId);
  if (!vm) return null;

  if (vm.status !== 'BOOTING' && vm.status !== 'PROVISIONING') {
    throw new Error(`Cannot mark VM ${vmId} as ready from status ${vm.status}`);
  }

  const updated = await prisma.vM.update({
    where: { id: vmId },
    data: { status: 'READY' },
  });

  emitVMReady(vmId);

  return {
    id: updated.id,
    templateId: updated.templateId,
    region: updated.region,
    status: updated.status as VMStatus,
    currentSessions: updated.currentSessions,
    maxSessions: updated.maxSessions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    errorCode: updated.errorCode || undefined,
    errorMessage: updated.errorMessage || undefined,
    lastHeartbeat: updated.lastHeartbeat || undefined,
  };
}

export async function assignSessionToVM(
  vmId: string,
  sessionId: string
): Promise<VM | null> {
  const vm = await getVM(vmId);
  if (!vm) return null;

  if (vm.status !== 'READY' && vm.status !== 'IN_USE' && vm.status !== 'RUNNING') {
    throw new Error(`Cannot assign session to VM ${vmId} with status ${vm.status}`);
  }

  if (vm.currentSessions >= vm.maxSessions) {
    throw new Error(`VM ${vmId} is at capacity (${vm.currentSessions}/${vm.maxSessions})`);
  }

  // Transition to ASSIGNING_SESSION (transitional state)
  await prisma.vM.update({
    where: { id: vmId },
    data: { status: 'ASSIGNING_SESSION' },
  });

  // Assign session and transition to IN_USE/RUNNING
  const updated = await prisma.vM.update({
    where: { id: vmId },
    data: {
      status: 'IN_USE', // Also compatible with RUNNING
      currentSessions: { increment: 1 },
    },
  });

  return {
    id: updated.id,
    templateId: updated.templateId,
    region: updated.region,
    status: updated.status as VMStatus,
    currentSessions: updated.currentSessions,
    maxSessions: updated.maxSessions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    errorCode: updated.errorCode || undefined,
    errorMessage: updated.errorMessage || undefined,
    lastHeartbeat: updated.lastHeartbeat || undefined,
  };
}

export async function releaseSessionFromVM(
  vmId: string,
  sessionId: string
): Promise<VM | null> {
  const vm = await getVM(vmId);
  if (!vm) return null;

  if (vm.currentSessions <= 0) {
    return vm;
  }

  const newSessions = vm.currentSessions - 1;
  const newStatus = newSessions === 0 ? 'READY' : 'IN_USE';

  const updated = await prisma.vM.update({
    where: { id: vmId },
    data: {
      status: newStatus,
      currentSessions: { decrement: 1 },
    },
  });

  return {
    id: updated.id,
    templateId: updated.templateId,
    region: updated.region,
    status: updated.status as VMStatus,
    currentSessions: updated.currentSessions,
    maxSessions: updated.maxSessions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    errorCode: updated.errorCode || undefined,
    errorMessage: updated.errorMessage || undefined,
    lastHeartbeat: updated.lastHeartbeat || undefined,
  };
}

export async function markVMDraining(vmId: string): Promise<VM | null> {
  const vm = await getVM(vmId);
  if (!vm) return null;

  if (vm.status !== 'READY' && vm.status !== 'IN_USE') {
    throw new Error(`Cannot mark VM ${vmId} as draining from status ${vm.status}`);
  }

  const updated = await prisma.vM.update({
    where: { id: vmId },
    data: { status: 'DRAINING' },
  });

  return {
    id: updated.id,
    templateId: updated.templateId,
    region: updated.region,
    status: updated.status as VMStatus,
    currentSessions: updated.currentSessions,
    maxSessions: updated.maxSessions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    errorCode: updated.errorCode || undefined,
    errorMessage: updated.errorMessage || undefined,
    lastHeartbeat: updated.lastHeartbeat || undefined,
  };
}

export async function handleVMError(
  vmId: string,
  errorCode: string,
  errorMessage: string
): Promise<VM | null> {
  // Import retry pipeline handler
  const { handleVMError: handleVMErrorWithRetry } = await import('./retry-pipeline');

  // Use retry pipeline to handle errors with retry logic
  await handleVMErrorWithRetry(vmId, errorCode, errorMessage);

  // Return updated VM
  return await getVM(vmId);
}

export async function terminateVM(vmId: string, reason?: string): Promise<VM | null> {
  const vm = await getVM(vmId);
  if (!vm) return null;

  // First transition to TERMINATING (Master Prompt requirement)
  await prisma.vM.update({
    where: { id: vmId },
    data: { status: 'TERMINATING' },
  });

  // Then terminate (in production, this would wait for active sessions to finish)
  const updated = await prisma.vM.update({
    where: { id: vmId },
    data: { status: 'TERMINATED' },
  });

  return {
    id: updated.id,
    templateId: updated.templateId,
    region: updated.region,
    status: updated.status as VMStatus,
    currentSessions: updated.currentSessions,
    maxSessions: updated.maxSessions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    errorCode: updated.errorCode || undefined,
    errorMessage: updated.errorMessage || undefined,
    lastHeartbeat: updated.lastHeartbeat || undefined,
  };
}

export async function markVMStatus(
  vmId: string,
  status: VMStatus
): Promise<VM | null> {
  const updated = await prisma.vM.update({
    where: { id: vmId },
    data: { status },
  });

  return {
    id: updated.id,
    templateId: updated.templateId,
    region: updated.region,
    status: updated.status as VMStatus,
    currentSessions: updated.currentSessions,
    maxSessions: updated.maxSessions,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
    errorCode: updated.errorCode || undefined,
    errorMessage: updated.errorMessage || undefined,
    lastHeartbeat: updated.lastHeartbeat || undefined,
  };
}

export async function findAvailableVM(
  region: string,
  maxSessions: number = 1
): Promise<VM | null> {
  const vm = await prisma.vM.findFirst({
    where: {
      region,
      status: 'READY',
      currentSessions: { lt: prisma.vM.fields.maxSessions },
    },
  });

  if (!vm) return null;

  // Check if VM has capacity
  if (vm.currentSessions + maxSessions > vm.maxSessions) {
    return null;
  }

  return {
    id: vm.id,
    templateId: vm.templateId,
    region: vm.region,
    status: vm.status as VMStatus,
    currentSessions: vm.currentSessions,
    maxSessions: vm.maxSessions,
    createdAt: vm.createdAt,
    updatedAt: vm.updatedAt,
    errorCode: vm.errorCode || undefined,
    errorMessage: vm.errorMessage || undefined,
    lastHeartbeat: vm.lastHeartbeat || undefined,
  };
}

export async function getVMsByRegion(region: string): Promise<VM[]> {
  const vms = await prisma.vM.findMany({
    where: { region },
  });

  return vms.map((vm) => ({
    id: vm.id,
    templateId: vm.templateId,
    region: vm.region,
    status: vm.status as VMStatus,
    currentSessions: vm.currentSessions,
    maxSessions: vm.maxSessions,
    createdAt: vm.createdAt,
    updatedAt: vm.updatedAt,
    errorCode: vm.errorCode || undefined,
    errorMessage: vm.errorMessage || undefined,
    lastHeartbeat: vm.lastHeartbeat || undefined,
  }));
}

export async function getVMsByStatus(status: VMStatus): Promise<VM[]> {
  const vms = await prisma.vM.findMany({
    where: { status },
  });

  return vms.map((vm) => ({
    id: vm.id,
    templateId: vm.templateId,
    region: vm.region,
    status: vm.status as VMStatus,
    currentSessions: vm.currentSessions,
    maxSessions: vm.maxSessions,
    createdAt: vm.createdAt,
    updatedAt: vm.updatedAt,
    errorCode: vm.errorCode || undefined,
    errorMessage: vm.errorMessage || undefined,
    lastHeartbeat: vm.lastHeartbeat || undefined,
  }));
}

export async function getAllVMs(): Promise<VM[]> {
  const vms = await prisma.vM.findMany();

  return vms.map((vm) => ({
    id: vm.id,
    templateId: vm.templateId,
    region: vm.region,
    status: vm.status as VMStatus,
    currentSessions: vm.currentSessions,
    maxSessions: vm.maxSessions,
    createdAt: vm.createdAt,
    updatedAt: vm.updatedAt,
    errorCode: vm.errorCode || undefined,
    errorMessage: vm.errorMessage || undefined,
    lastHeartbeat: vm.lastHeartbeat || undefined,
  }));
}
