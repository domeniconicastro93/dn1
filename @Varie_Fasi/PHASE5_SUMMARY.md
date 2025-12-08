# PHASE 5 - Orchestrator & Streaming - COMPLETED

## Overview

Full GPU VM lifecycle management, WebRTC streaming, and integration with session-service have been implemented.

## Components Implemented

### 1. Orchestrator Service - Full VM Lifecycle

#### VM State Machine
- **TEMPLATE** → Base image, not used directly
- **PROVISIONING** → VM is being created from template
- **BOOTING** → OS starting, agents initializing
- **READY** → Ready to accept sessions
- **IN_USE** → Running one or multiple user sessions
- **DRAINING** → No new sessions, waiting for active ones to finish
- **ERROR** → Something went wrong
- **TERMINATED** → VM destroyed

#### Operations Implemented
- `createVM(templateId, region)` - Create new VM from template
- `markVMReady(vmId)` - Mark VM as ready for sessions
- `assignSessionToVM(vmId, sessionId)` - Assign session to VM
- `releaseSessionFromVM(vmId, sessionId)` - Release session from VM
- `markVMDraining(vmId)` - Mark VM as draining
- `handleVMError(vmId, errorCode, errorMessage)` - Handle VM errors
- `terminateVM(vmId, reason?)` - Terminate VM

#### GPU Templates
- **L4-360** - 8 vCPU, 32GB RAM, 24GB VRAM, 4 concurrent sessions
- **L4-90** - 4 vCPU, 16GB RAM, 12GB VRAM, 2 concurrent sessions
- **A10** - 12 vCPU, 48GB RAM, 24GB VRAM, 4 concurrent sessions
- **A16** - 16 vCPU, 64GB RAM, 64GB VRAM, 6 concurrent sessions
- **RTX-4060** - 6 vCPU, 16GB RAM, 8GB VRAM, 2 concurrent sessions
- **RTX-4080** - 12 vCPU, 32GB RAM, 16GB VRAM, 4 concurrent sessions

### 2. Region Fallback Logic

- Pre-defined regions: us-east-1, us-west-2, eu-west-1, eu-central-1, ap-southeast-1, ap-northeast-1
- Fallback chain for each region (ordered by preference)
- Capacity metrics per region (available VMs, provisioning VMs, queue time)
- Automatic fallback when target region has no capacity

### 3. Per-Game Streaming Presets

- **default-high** - 1440p@120fps, 15-25 Mbps, 2 sessions/VM
- **default-standard** - 1080p@60fps, 8-15 Mbps, 4 sessions/VM
- **default-competitive** - 1080p@240fps, 10-20 Mbps, 1 session/VM
- Game-specific presets can override template defaults
- Automatic VM template selection based on game requirements

### 4. Event System

Events emitted for VM lifecycle:
- **VMProvisioned** - VM creation started
- **VMReady** - VM ready for sessions
- **VMError** - VM encountered error
- **VMPoolLowCapacity** - Region running low on capacity
- **VMTerminated** - VM terminated
- **SessionAssigned** - Session assigned to VM
- **SessionReleased** - Session released from VM

Event emitter structure ready for Kafka/NATS integration.

### 5. Metrics & Logging

- Total VMs count
- VMs by status
- VMs by region
- Total/used/available capacity
- Region capacity metrics
- Periodic metrics logging (every 30 seconds)

### 6. Streaming Ingest Service

#### WebRTC Signaling
- WebSocket server for signaling (SDP offer/answer, ICE candidates)
- Connection management per session
- STUN server configuration
- Ready for TURN server integration

#### Control Channel
- WebSocket server for game control input
- Keyboard, mouse, gamepad input handling
- Forward to VM (structure ready)

#### API Endpoints
- `POST /api/streaming/v1/session/:sessionId/stream-url` - Get WebRTC URLs
- `GET /api/streaming/v1/session/:sessionId/status` - Get connection status

### 7. Session Service Integration

- Calls orchestrator-service to find/allocate VM
- Creates new VM if no capacity available
- Gets streaming URLs from streaming-ingest-service
- Assigns session to VM
- Returns complete session with WebRTC URLs

## API Endpoints

### Orchestrator Service
- `POST /api/orchestrator/v1/vm` - Create VM
- `POST /api/orchestrator/v1/vm/assign` - Assign session to VM
- `GET /api/orchestrator/v1/vm/:vmId` - Get VM status
- `POST /api/orchestrator/v1/vm/:vmId/ready` - Mark VM ready
- `POST /api/orchestrator/v1/vm/:vmId/draining` - Mark VM draining
- `POST /api/orchestrator/v1/vm/:vmId/error` - Handle VM error
- `POST /api/orchestrator/v1/vm/:vmId/terminate` - Terminate VM
- `POST /api/orchestrator/v1/vm/:vmId/release` - Release session
- `POST /api/orchestrator/v1/find-vm` - Find available VM with fallback
- `GET /api/orchestrator/v1/regions/:region/capacity` - Get region capacity
- `GET /api/orchestrator/v1/regions/capacity` - Get all region capacities
- `GET /api/orchestrator/v1/metrics` - Get orchestrator metrics

### Streaming Ingest Service
- `POST /api/streaming/v1/session/:sessionId/stream-url` - Get WebRTC URLs
- `GET /api/streaming/v1/session/:sessionId/status` - Get connection status

## Flow Example

1. **User requests session** → `POST /api/session/v1`
2. **Session service** calls orchestrator to find/allocate VM
3. **Orchestrator** finds available VM or creates new one
4. **Session service** gets WebRTC URLs from streaming service
5. **Session service** assigns session to VM
6. **Client** connects to WebRTC signaling URL
7. **WebRTC** connection established
8. **Client** sends control input via control channel
9. **Streaming** flows from VM to client

## Notes

- VM provisioning is simulated (10s provisioning + 5s boot)
- In production, this would call cloud provider APIs (AWS, GCP, Azure)
- WebRTC signaling is structured but needs full peer connection implementation
- Events are logged to console (ready for Kafka/NATS)
- Metrics are logged every 30 seconds (ready for Prometheus)
- Replay buffer NOT implemented (Phase 6)

## Next Steps (Phase 6)

- Implement circular buffer (90-120s) in replay engine
- Implement NVENC encoding
- Implement video rendering pipeline

