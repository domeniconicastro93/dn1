# PHASE 11 — GAMEPLAY FLOW INTEGRATION
## Implementation Summary & Architecture

**Status**: 🟡 PARTIAL IMPLEMENTATION
**Date**: 2025-12-05
**Priority**: HIGH

---

## 🎯 OBJECTIVE

Create a complete end-to-end cloud gaming session system connecting:
- Game Detail Page → Orchestrator Service → Azure VM → Sunshine → WebRTC Player

---

## 📊 ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                 │
│  ┌──────────────────┐         ┌──────────────────────────────────┐  │
│  │ Game Detail Page │────────▶│   /play/{sessionId}              │  │
│  │ /games/[slug]    │         │   - WebRTC Player                │  │
│  │ - "Play Now" btn │         │   - Gamepad Support              │  │
│  └──────────────────┘         │   - Keyboard/Mouse               │  │
│                                └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                    │                              ▲
                    │ POST /api/orchestrator/      │ WebRTC
                    │      v1/session/start        │ Stream
                    ▼                              │
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR SERVICE (Port 3012)                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Session Routes                                                │   │
│  │ - POST /session/start  → Allocate VM + Launch Game           │   │
│  │ - GET  /session/status/:id → Get session info                │   │
│  │ - POST /session/stop   → Cleanup session                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ Game Launcher                                                 │   │
│  │ - launchGameOnVM() → Execute steam://rungameid/<appId>        │   │
│  │ - stopGameOnVM()   → Stop running game                        │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                    │                              ▲
                    │ HTTP API                     │ WebRTC
                    │ Calls                        │ Signaling
                    ▼                              │
┌─────────────────────────────────────────────────────────────────────┐
│                    AZURE VM (20.31.130.73)                           │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ SUNSHINE (Port 47984)                                         │   │
│  │ - WebRTC Server                                               │   │
│  │ - Game Streaming                                              │   │
│  │ - Input Handling (Gamepad, Keyboard, Mouse)                   │   │
│  │ - Hardware Encoding (AMF)                                     │   │
│  └──────────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ STEAM CLIENT                                                  │   │
│  │ - Auto-login enabled                                          │   │
│  │ - Games installed                                             │   │
│  │ - Accepts steam:// URI protocol                               │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## ✅ COMPLETED COMPONENTS

### 1. Session Management Routes
**File**: `services/orchestrator-service/src/routes/session.ts`
**Status**: ✅ CREATED

**Endpoints**:
- `POST /api/orchestrator/v1/session/start`
  - Validates user & game
  - Checks Sunshine health
  - Creates session in database
  - Launches game via Steam URI
  - Returns session details for WebRTC

- `GET /api/orchestrator/v1/session/status/:sessionId`
  - Returns session status
  - Provides Sunshine connection details
  - Used by player page

- `POST /api/orchestrator/v1/session/stop`
  - Ends session
  - Releases VM resources
  - Updates database

### 2. Game Launcher Module
**File**: `services/orchestrator-service/src/game-launcher.ts`
**Status**: ✅ CREATED

**Functions**:
- `launchGameOnVM(vmHost, steamAppId)` - Launch via Steam URI
- `launchGameByIndex(vmHost, appIndex)` - Launch via Sunshine app index
- `stopGameOnVM(vmHost)` - Stop running game

**Configuration Options**:
1. Sunshine Steam Launcher App (Recommended)
2. WinRM PowerShell Remoting
3. Pre-configured Sunshine Apps

---

## 🟡 PENDING COMPONENTS

### 3. Orchestrator Service Integration
**File**: `services/orchestrator-service/src/index.ts`
**Status**: 🟡 NEEDS UPDATE

**Required Changes**:
```typescript
// Add at top of file
import { registerSessionRoutes } from './routes/session';

// Add after other routes (around line 800)
registerSessionRoutes(app);
```

### 4. Game Detail Page Update
**File**: `apps/web/components/games/GameDetailPage.tsx`
**Status**: 🟡 NEEDS UPDATE

**Required Changes**:
1. Replace `/api/user/library` with `/api/steam/owned-games`
2. Update `handlePlay()` to call `/api/orchestrator/v1/session/start`
3. Add proper error handling
4. Show loading states

**New Code**:
```typescript
const handlePlay = async () => {
  if (!game) return;

  try {
    setStartingSession(true);
    
    // Call orchestrator to start session
    const res = await fetch('/api/orchestrator/v1/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        userId: user.id, // From auth context
        appId: game.id,
        steamAppId: game.steamAppId,
      }),
    });

    if (!res.ok) {
      const error = await res.json();
      alert(error.message || 'Failed to start session');
      return;
    }

    const session = await res.json();
    
    // Navigate to player page
    router.push(`/play/${session.data.sessionId}`);
  } catch (error) {
    console.error('Error starting session:', error);
    alert('Failed to start session');
  } finally {
    setStartingSession(false);
  }
};
```

### 5. WebRTC Player Page
**File**: `apps/web/app/[locale]/play/[sessionId]/page.tsx`
**Status**: 🔴 NOT CREATED

**Required Implementation**:
```typescript
import { WebRTCPlayer } from '@/components/player/WebRTCPlayer';

export default async function PlayPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return <WebRTCPlayer sessionId={sessionId} />;
}
```

### 6. WebRTC Player Component
**File**: `apps/web/components/player/WebRTCPlayer.tsx`
**Status**: 🔴 NOT CREATED

**Required Features**:
- Fetch session details from `/api/orchestrator/v1/session/status/:sessionId`
- Create RTCPeerConnection
- Handle WebRTC signaling with Sunshine
- Render video stream
- Full-screen support
- Exit button
- Latency display
- Connection status

**Architecture**:
```typescript
'use client';

import { useEffect, useState, useRef } from 'react';

export function WebRTCPlayer({ sessionId }: { sessionId: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [peerConnection, setPeerConnection] = useState<RTCPeerConnection | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');
  const [latency, setLatency] = useState<number>(0);

  useEffect(() => {
    // 1. Fetch session details
    // 2. Create RTCPeerConnection
    // 3. Set up WebRTC signaling
    // 4. Connect to Sunshine
    // 5. Display video stream
  }, [sessionId]);

  return (
    <div className="relative w-full h-screen bg-black">
      <video
        ref={videoRef}
        className="w-full h-full"
        autoPlay
        playsInline
      />
      
      {/* Controls Overlay */}
      <div className="absolute top-4 right-4 flex gap-2">
        <div className="bg-black/50 px-3 py-2 rounded text-white">
          {latency}ms
        </div>
        <button className="bg-black/50 px-3 py-2 rounded text-white">
          Fullscreen
        </button>
        <button className="bg-red-500 px-3 py-2 rounded text-white">
          Exit
        </button>
      </div>

      {/* Gamepad Status */}
      <GamepadIndicator />
    </div>
  );
}
```

### 7. Gamepad Support Component
**File**: `apps/web/components/player/GamepadIndicator.tsx`
**Status**: 🔴 NOT CREATED

**Required Features**:
- Use Web Gamepad API
- Detect connected controllers
- Show visual indicator (green/red)
- Send inputs via WebRTC DataChannel

**Implementation**:
```typescript
'use client';

import { useEffect, useState } from 'react';

export function GamepadIndicator() {
  const [gamepads, setGamepads] = useState<Gamepad[]>([]);

  useEffect(() => {
    const checkGamepads = () => {
      const gp = navigator.getGamepads();
      setGamepads(Array.from(gp).filter(Boolean) as Gamepad[]);
    };

    window.addEventListener('gamepadconnected', checkGamepads);
    window.addEventListener('gamepaddisconnected', checkGamepads);

    const interval = setInterval(checkGamepads, 100);

    return () => {
      window.removeEventListener('gamepadconnected', checkGamepads);
      window.removeEventListener('gamepaddisconnected', checkGamepads);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-2 rounded text-white">
      🎮 {gamepads.length > 0 ? `${gamepads.length} Controller(s)` : 'No Controller'}
    </div>
  );
}
```

### 8. Next.js API Proxy Route
**File**: `apps/web/app/api/orchestrator/[...path]/route.ts`
**Status**: 🔴 NOT CREATED

**Purpose**: Proxy requests from frontend to orchestrator service

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/lib/server/strike-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = await getAccessToken();

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const targetUrl = `${gatewayUrl}/api/orchestrator/v1/${path.join('/')}`;

  const body = await request.json();

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.status });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Similar implementation for GET
}
```

---

## 🔧 ENVIRONMENT VARIABLES REQUIRED

Add to `.env`:

```bash
# Sunshine Configuration
SUNSHINE_VM_HOST=20.31.130.73
SUNSHINE_VM_ID=static-vm-001
SUNSHINE_PORT=47984
SUNSHINE_USERNAME=admin
SUNSHINE_PASSWORD=<your-sunshine-password>
SUNSHINE_USE_HTTPS=false
SUNSHINE_VERIFY_SSL=false
SUNSHINE_TIMEOUT=5000

# WebRTC Ports
SUNSHINE_WEBRTC_UDP_PORTS=47993,47994,47995
```

---

## 📋 IMPLEMENTATION CHECKLIST

### Backend
- [x] Create session management routes
- [x] Create game launcher module
- [ ] Integrate routes into orchestrator service
- [ ] Add gateway proxy routes for orchestrator
- [ ] Test session start/stop flow
- [ ] Test game launching

### Frontend
- [ ] Update GameDetailPage ownership check
- [ ] Update GameDetailPage play button
- [ ] Create WebRTC player page
- [ ] Create WebRTC player component
- [ ] Add gamepad support
- [ ] Add fullscreen support
- [ ] Add exit/stop functionality
- [ ] Create Next.js API proxy routes

### Testing
- [ ] Test session creation
- [ ] Test game launching (Steam URI)
- [ ] Test WebRTC connection
- [ ] Test gamepad input
- [ ] Test keyboard/mouse input
- [ ] Test session cleanup
- [ ] Test error handling
- [ ] Test multi-user sessions

---

## 🚀 NEXT STEPS

1. **Update Orchestrator Service** - Integrate session routes
2. **Update Game Detail Page** - New ownership API + play button
3. **Create WebRTC Player** - Full implementation
4. **Test End-to-End** - Complete gameplay flow
5. **Add Error Handling** - Graceful failures
6. **Performance Optimization** - Reduce latency

---

## 📚 DOCUMENTATION NEEDED

1. **Sunshine Configuration Guide** - How to set up Steam launcher
2. **WebRTC Troubleshooting** - Common connection issues
3. **Gamepad Mapping** - Controller button layouts
4. **VM Setup Guide** - Azure VM configuration
5. **Network Requirements** - Ports, firewall rules

---

## ⚠️ KNOWN LIMITATIONS

1. **Static VM Only** - No dynamic VM allocation yet
2. **Single Session** - One user per VM
3. **No Session Persistence** - Sessions lost on page reload
4. **No Reconnection** - Must restart if connection drops
5. **Limited Error Handling** - Basic error messages only

---

## 🎯 FUTURE ENHANCEMENTS

1. **Dynamic VM Allocation** - Auto-scale based on demand
2. **Session Persistence** - Resume sessions after disconnect
3. **Multi-Session Support** - Multiple users per VM
4. **Advanced Input Mapping** - Custom controller configs
5. **Performance Metrics** - FPS, bitrate, packet loss
6. **Recording/Streaming** - Capture gameplay
7. **Voice Chat** - In-game communication

---

**END OF PHASE 11 IMPLEMENTATION SUMMARY**
