/**
 * Session Orchestration
 * 
 * Manages multi-user sessions per VM:
 * - Assign sessions to VMs
 * - Release sessions from VMs
 * - Track session count per VM
 * - Enforce maximum concurrent sessions per VM template
 * - Handle session migration (future)
 */

import { prisma } from '@strike/shared-db';
import { assignSessionToVM, releaseSessionFromVM, getVM } from './vm-lifecycle';
import { emitSessionAssigned, emitSessionReleased } from './events';

export interface SessionAssignment {
  sessionId: string;
  vmId: string;
  userId: string;
  gameId: string;
  assignedAt: Date;
}

/**
 * Assign a session to a VM with capacity checking
 */
export async function assignSessionToVMWithCapacity(
  sessionId: string,
  vmId: string
): Promise<{ success: boolean; vmId: string; error?: string }> {
  try {
    // Get VM and verify capacity
    const vm = await getVM(vmId);
    if (!vm) {
      return { success: false, vmId, error: 'VM not found' };
    }

    if (vm.status !== 'READY' && vm.status !== 'IN_USE' && vm.status !== 'RUNNING') {
      return {
        success: false,
        vmId,
        error: `VM is not ready (status: ${vm.status})`,
      };
    }

    if (vm.currentSessions >= vm.maxSessions) {
      return {
        success: false,
        vmId,
        error: `VM is at capacity (${vm.currentSessions}/${vm.maxSessions})`,
      };
    }

    // Assign session to VM
    const updatedVM = await assignSessionToVM(vmId, sessionId);
    if (!updatedVM) {
      return { success: false, vmId, error: 'Failed to assign session' };
    }

    // Update session record with VM ID
    await prisma.session.update({
      where: { id: sessionId },
      data: { vmId },
    });

    emitSessionAssigned(vmId, sessionId);

    return { success: true, vmId };
  } catch (error) {
    return {
      success: false,
      vmId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Release a session from a VM
 */
export async function releaseSessionFromVMWithCleanup(
  sessionId: string,
  vmId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify session exists and is assigned to this VM
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return { success: false, error: 'Session not found' };
    }

    if (session.vmId !== vmId) {
      return { success: false, error: 'Session is not assigned to this VM' };
    }

    // Release session from VM
    const updatedVM = await releaseSessionFromVM(vmId, sessionId);
    if (!updatedVM) {
      return { success: false, error: 'Failed to release session' };
    }

    // Update session record (clear VM ID)
    await prisma.session.update({
      where: { id: sessionId },
      data: { vmId: null },
    });

    emitSessionReleased(vmId, sessionId);

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all sessions assigned to a VM
 */
export async function getVMSessions(vmId: string): Promise<SessionAssignment[]> {
  const sessions = await prisma.session.findMany({
    where: {
      vmId,
      status: { in: ['starting', 'active', 'paused'] },
    },
    select: {
      id: true,
      userId: true,
      gameId: true,
      createdAt: true,
    },
  });

  return sessions.map((session) => ({
    sessionId: session.id,
    vmId,
    userId: session.userId,
    gameId: session.gameId,
    assignedAt: session.createdAt,
  }));
}

/**
 * Get VM capacity metrics
 */
export async function getVMCapacityMetrics(vmId: string): Promise<{
  currentSessions: number;
  maxSessions: number;
  availableSlots: number;
  utilizationPercent: number;
}> {
  const vm = await getVM(vmId);
  if (!vm) {
    throw new Error('VM not found');
  }

  const availableSlots = vm.maxSessions - vm.currentSessions;
  const utilizationPercent = (vm.currentSessions / vm.maxSessions) * 100;

  return {
    currentSessions: vm.currentSessions,
    maxSessions: vm.maxSessions,
    availableSlots,
    utilizationPercent,
  };
}

/**
 * Check if VM can accept more sessions
 */
export async function canVMAcceptSessions(
  vmId: string,
  requestedSessions: number = 1
): Promise<boolean> {
  const vm = await getVM(vmId);
  if (!vm) {
    return false;
  }

  if (vm.status !== 'READY' && vm.status !== 'IN_USE' && vm.status !== 'RUNNING') {
    return false;
  }

  return vm.currentSessions + requestedSessions <= vm.maxSessions;
}

/**
 * Get all VMs that can accept sessions
 */
export async function getAvailableVMsForSessions(
  region: string,
  requestedSessions: number = 1
): Promise<Array<{ vmId: string; availableSlots: number }>> {
  const vms = await prisma.vM.findMany({
    where: {
      region,
      status: { in: ['READY', 'IN_USE', 'RUNNING'] },
    },
  });

  return vms
    .filter((vm) => vm.currentSessions + requestedSessions <= vm.maxSessions)
    .map((vm) => ({
      vmId: vm.id,
      availableSlots: vm.maxSessions - vm.currentSessions,
    }))
    .sort((a, b) => b.availableSlots - a.availableSlots); // Sort by available slots (descending)
}

