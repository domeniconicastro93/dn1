# 🔴 CRITICAL: WEBRTC FLOW UNIFICATION VIOLATIONS

## ❌ AUDIT RESULTS - VIOLATIONS FOUND

### **STEP 1: Repository-Wide Audit**

Searched for: `localhost:3015`, `:3015`, `/webrtc/session/`, `WEBRTC_SERVICE_URL`

#### **VIOLATIONS:**

**1. services/orchestrator-service/src/index.ts**
- Line 1354: Has duplicate `const WEBRTC_SERVICE_URL` (should only be in webrtc-client.ts)
- Lines 1368, 1397, 1424, 1451: Direct `fetch()` calls to webrtc service
- **STATUS**: ❌ NOT USING SHARED CLIENT

**2. apps/web/src/components/WebRTCStreamPlayer.tsx**
- Line 30: Default `serverUrl = 'http://localhost:3015'`
- **STATUS**: ❌ FRONTEND CALLING WEBRTC SERVICE DIRECTLY

**3. apps/web/components/play/PlayPage.tsx**
- Line 134: Hardcoded `serverUrl="http://localhost:3015"`
- **STATUS**: ❌ FRONTEND CALLING WEBRTC SERVICE DIRECTLY

**4. apps/web/app/[locale]/test-stream/page.tsx**
- Line 17: Hardcoded `serverUrl="http://localhost:3015"`
- **STATUS**: ❌ FRONTEND CALLING WEBRTC SERVICE DIRECTLY

#### **CORRECT IMPLEMENTATIONS:**

✅ **services/orchestrator-service/src/core/webrtc-client.ts**
- Has `WEBRTC_SERVICE_URL` (correct - single source of truth)
- Has all `fetch()` calls to webrtc service (correct)

✅ **services/orchestrator-service/src/routes/session.ts**
- Uses `getWebRTCClient()` (correct)
- NO direct fetch calls (correct)

---

## 🔧 REQUIRED FIXES

### **FIX 1: services/orchestrator-service/src/index.ts (Lines 1350-1461)**

**Current code (WRONG):**
```typescript
const WEBRTC_SERVICE_URL = process.env.WEBRTC_SERVICE_URL || 'http://localhost:3015';

app.post('/api/orchestrator/v1/webrtc/session/start', async (request, reply) => {
  const response = await fetch(`${WEBRTC_SERVICE_URL}/webrtc/session/${sessionId}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ width: 1920, height: 1080, fps: 60, bitrate: 10000 }),
  });
  const data = await response.json();
  return reply.status(200).send(successResponse({ sessionId, offer: data.offer }));
});
```

**Required code (CORRECT):**
```typescript
const webrtcClient = getWebRTCClient();

app.post('/api/orchestrator/v1/webrtc/session/start', async (request, reply) => {
  const { offer } = await webrtcClient.startSession(sessionId);
  return reply.status(200).send(successResponse({ sessionId, offer }));
});
```

**Changes needed:**
1. Remove `const WEBRTC_SERVICE_URL = ...` line
2. Add `const webrtcClient = getWebRTCClient();`
3. Replace all 4 fetch calls with webrtcClient methods:
   - `/start` → `webrtcClient.startSession(sessionId)`
   - `/answer` → `webrtcClient.sendAnswer(sessionId, answer)`
   - `/ice` → `webrtcClient.sendIceCandidate(sessionId, candidate)`
   - `/stop` → `webrtcClient.stopSession(sessionId)`

---

### **FIX 2: apps/web/src/components/WebRTCStreamPlayer.tsx**

**Current code (WRONG):**
```typescript
interface WebRTCStreamPlayerProps {
    sessionId: string;
    serverUrl?: string;  // ❌ Should NOT point to :3015
```

**Required code (CORRECT):**
```typescript
interface WebRTCStreamPlayerProps {
    sessionId: string;
    orchestratorUrl?: string;  // Should point to orchestrator
```

**Changes:**
1. Rename `serverUrl` → `orchestratorUrl`
2. Default to `http://localhost:3012` (orchestrator)
3. Change all fetch calls to use `/api/orchestrator/v1/webrtc/session/*`

---

### **FIX 3: apps/web/components/play/PlayPage.tsx**

**Current code (WRONG):**
```typescript
<WebRTCStreamPlayer
  sessionId={session.id}
  serverUrl="http://localhost:3015"  // ❌ WRONG - direct to webrtc service
  ...
/>
```

**Required code (CORRECT):**
```typescript
<WebRTCStreamPlayer
  sessionId={session.id}
  orchestratorUrl="http://localhost:3012/api/orchestrator/v1"
  ...
/>
```

---

### **FIX 4: apps/web/app/[locale]/test-stream/page.tsx**

Same fix as PlayPage.tsx - change serverUrl to orchestratorUrl pointing to :3012

---

## 📊 SINGLE ENTRYPOINT POLICY

### **Recommended Architecture:**

```
Frontend → Orchestrator (:3012) → webrtc-client → webrtc-streaming-service (:3015)
```

### **Chosen Public API:**

**PRIMARY:** `/api/orchestrator/v1/session/start`
- Used by "Play Now" flow
- Returns: { sessionId, offer, webrtc: { signalingUrl } }

**ALIAS (optional):** `/api/sessions/request`
- For backward compatibility
- Should call the same handler

### **WebRTC Signaling Endpoints:**

- `POST /api/orchestrator/v1/webrtc/session/start` - Internal use by session routes
- `POST /api/orchestrator/v1/webrtc/session/answer` - Frontend calls this
- `POST /api/orchestrator/v1/webrtc/session/ice` - Frontend calls this
- `POST /api/orchestrator/v1/webrtc/session/stop` - Frontend calls this

---

## 🌐 EXPECTED NETWORK CALLS (Browser)

When testing `/it/test-stream` or "Play Now", the browser Network tab should show:

**✅ CORRECT:**
```
POST http://localhost:3012/api/orchestrator/v1/session/start
POST http://localhost:3012/api/orchestrator/v1/webrtc/session/answer
POST http://localhost:3012/api/orchestrator/v1/webrtc/session/ice
POST http://localhost:3012/api/orchestrator/v1/webrtc/session/stop
```

**❌ SHOULD NEVER SEE:**
```
POST http://localhost:3015/webrtc/session/...
```

**Why?** Frontend should NEVER talk to webrtc-streaming-service directly. Only orchestrator can.

---

## 🧪 TEST CHECKLIST (After Fixes)

### **Test 1: Grep Audit**
```powershell
# In orchestrator-service
grep -r ":3015" src/

# Expected: ONLY in core/webrtc-client.ts
```

### **Test 2: /it/test-stream**
1. Open `http://localhost:3005/it/test-stream`
2. Open DevTools → Network tab
3. Filter: "webrtc"
4. **Expected**: All requests go to localhost:3012
5. **Expected**: NO requests to localhost:3015

### **Test 3: Play Now**
1. Navigate to Games page
2. Click "Play Now"
3. Open DevTools → Network tab
4. **Expected**: Requests to /api/orchestrator/v1/session/start
5. **Expected**: Requests to /api/orchestrator/v1/webrtc/session/*
6. **Expected**: NO requests to :3015

### **Test 4: Orchestrator Logs**
```
[WebRTCClient] Starting session: <uuid>
[WebRTCClient] ✅ Session started, offer received
```

Should NOT see:
```
fetch(http://localhost:3015/...)
```

### **Test 5: Connection Establishment**
- WebRTC Connection State: connected
- ICE Connection State: connected
- Streaming: ✅ Yes

---

## 📝 MANUAL FIXES REQUIRED

Since automated edits are failing, here are the EXACT manual changes:

### **File 1: services/orchestrator-service/src/index.ts**

**Find (around line 1354):**
```typescript
const WEBRTC_SERVICE_URL = process.env.WEBRTC_SERVICE_URL || 'http://localhost:3015';
```

**Replace with:**
```typescript
const webrtcClient = getWebRTCClient();
```

**Then find all 4 app.post handlers (lines 1360-1461) and replace fetch logic with:**

```typescript
/// For /start endpoint:
const { offer } = await webrtcClient.startSession(sessionId);
return reply.status(200).send(successResponse({ sessionId, offer }));

// For /answer endpoint:
await webrtcClient.sendAnswer(sessionId, answer);
return reply.status(200).send(successResponse({ success: true }));

// For /ice endpoint:
await webrtcClient.sendIceCandidate(sessionId, candidate);
return reply.status(200).send(successResponse({ success: true }));

// For /stop endpoint:
await webrtcClient.stopSession(sessionId);
return reply.status(200).send(successResponse({ success: true }));
```

### **File 2: apps/web/src/components/WebRTCStreamPlayer.tsx**

Update to call orchestrator instead of webrtc service directly.

### **File 3: apps/web/components/play/PlayPage.tsx**

Change:
```typescript
serverUrl="http://localhost:3015"
```

To:
```typescript
orchestratorUrl="http://localhost:3012/api/orchestrator/v1"
```

---

## 🎯 ACCEPTANCE CRITERIA

- [ ] ONLY `core/webrtc-client.ts` references `:3015`
- [ ] Orchestrator index.ts uses `webrtcClient`
- [ ] Frontend calls orchestrator, NOT webrtc service
- [ ] Browser Network tab shows NO :3015 requests
- [ ] Grep search for `:3015` in orchestrator shows 1 result only
- [ ] /it/test-stream works
- [ ] Play Now works
- [ ] WebRTC connection establishes

---

**Date**: December 12, 2024  
**Status**: ❌ **VIOLATIONS FOUND - FIXES REQUIRED**  
**Next Step**: Apply manual fixes as documented above
