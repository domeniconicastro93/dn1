# ✅ PLAY NOW FIX - RUN & TEST CHECKLIST

## 🎯 WHAT WAS FIXED

### **A) Stopped the Crash** ✅
- **File**: `services/orchestrator-service/src/core/session-manager.ts`
- **Fix**: Disabled `startStatusPolling()` that called `getSessionStatus()` on null Sunshine client
- **Result**: No more `TypeError: Cannot read properties of null` errors

### **B) Implemented WebRTC Session Lifecycle** ✅
- **File**: `services/orchestrator-service/src/index.ts`
- **Added 4 new endpoints**:
  - `POST /api/orchestrator/v1/webrtc/session/start` - Start session, get offer
  - `POST /api/orchestrator/v1/webrtc/session/answer` - Forward answer
  - `POST /api/orchestrator/v1/webrtc/session/ice` - Forward ICE candidates
  - `POST /api/orchestrator/v1/webrtc/session/stop` - Stop session
- **Architecture**: Orchestrator → webrtc-streaming-service (port 3015)

### **C) Wired "Play Now" Flow** ✅
- **File**: `services/orchestrator-service/src/routes/session.ts`
- **Updated endpoints**:
  - `POST /api/orchestrator/v1/session/start` - Now uses WebRTC instead of Sunshine
  - `POST /api/sessions/request` - Alias also uses WebRTC
- **Removed**: Sunshine/Apollo client calls
- **Added**: Direct WebRTC service integration

### **D) Clean Logging** ✅
- Added clear logs: `"Starting WebRTC session"`, `"✅ Offer received"`, etc.
- Removed misleading Apollo/Sunshine logs from active code paths

---

## 🚀 RUN & TEST PROCEDURE

### **STEP 1: Restart Orchestrator Service**

The orchestrator has been updated with new routes. Restart it:

```powershell
# Option A: If using start-all.bat, restart everything
.\stop-all.bat
.\start-all.bat

# Option B: Just restart orchestrator
# 1. Find the orchestrator terminal window
# 2. Press Ctrl+C to stop it
# 3. Run: pnpm run dev
```

**Expected output:**
```
[Orchestrator] Server listening on http://0.0.0.0:3012
```

### **STEP 2: Verify WebRTC Service is Running**

```powershell
curl http://localhost:3015/health
```

**Expected response:**
```json
{
  "status": "ok",
  "service": "webrtc-streaming",
  "transport": "WebRTC (RTP/SRTP)",
  "activeSessions": 0
}
```

### **STEP 3: Verify Orchestrator WebRTC Endpoints**

Test the new endpoint manually:

```powershell
curl -X POST http://localhost:3012/api/orchestrator/v1/webrtc/session/start `
  -H "Content-Type: application/json" `
  -d '{}'
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "...",
    "offer": { "type": "offer", "sdp": "..." }
  }
}
```

### **STEP 4: Test "Play Now" from Game Page**

1. **Open browser**: `http://localhost:3005`
2. **Navigate**: Games page
3. **Click**: "Play Now" on any game
4. **Expected**: 
   - ✅ NO 500 error
   - ✅ Session starts
   - ✅ WebRTC player loads
   - ✅ Connection establishes

### **STEP 5: Check Orchestrator Logs**

Look for these in the orchestrator terminal:

```
[SessionRoute] Starting WebRTC session: <uuid>
[SessionRoute] ✅ WebRTC session created
```

**Should NOT see:**
```
❌ Status poll error
❌ Cannot read properties of null
❌ Apollo/Sunshine errors
```

### **STEP 6: Verify Browser Console**

Open DevTools (F12) → Console:

**Expected:**
```
[WebRTC] Initializing Strike WebRTC client...
[WebRTC] Requesting server offer...
[WebRTC] Received offer from server
[WebRTC] Set remote description
[WebRTC] Created answer
[WebRTC] Connection state: connected
[WebRTC] ✅ Video stream attached
```

---

## 📊 ACCEPTANCE CRITERIA CHECKLIST

- [ ] **1. "Play Now" no longer 500s**
  - Click "Play Now" → Should get session response, not error

- [ ] **2. No null.getSessionStatus errors**
  - Check orchestrator logs → No `TypeError: Cannot read properties of null`

- [ ] **3. WebRTC connection works**
  - Browser console shows: `Connection state: connected`
  - Debug panel shows: `Streaming: ✅ Yes`

- [ ] **4. Same experience as /test-stream**
  - `/test-stream` works → `{sessionId}` connection identical
  - Both use WebRTC transport (RTP/SRTP)

---

## 🔍 TROUBLESHOOTING

### **Issue: Still getting 500 error**

**Check:**
1. Orchestrator restarted? (`pnpm run dev` in orchestrator)
2. WebRTC service running? (`netstat -ano | findstr ":3015"`)
3. Correct endpoint called? (Should be `/api/orchestrator/v1/session/start`)

**Debug:**
```powershell
# Check orchestrator logs for errors
# Look for stack trace in terminal
```

### **Issue: WebRTC service not responding**

**Check:**
```powershell
curl http://localhost:3015/health
```

**If fails:**
```powershell
# Restart WebRTC service
cd services/webrtc-streaming-service
pnpm run dev
```

### **Issue: Frontend doesn't connect**

**Check:**
1. Browser console for errors (F12)
2. Network tab for failed requests
3. PlayPage.tsx is using WebRTCStreamPlayer (not Apollo player)

**Fix:**
- Frontend should use the new offer/answer/ice flow
- Check that PlayPage.tsx calls the correct endpoints

---

## 📝 ENDPOINT SUMMARY

### **New Orchestrator WebRTC Endpoints:**

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/orchestrator/v1/webrtc/session/start` | POST | Start session, get SDP offer |
| `/api/orchestrator/v1/webrtc/session/answer` | POST | Send SDP answer |
| `/api/orchestrator/v1/webrtc/session/ice` | POST | Send ICE candidate |
| `/api/orchestrator/v1/webrtc/session/stop` | POST | Stop session |

### **Updated Session Endpoints:**

| Endpoint | Method | Change |
|----------|--------|--------|
| `/api/orchestrator/v1/session/start` | POST | ✅ Now uses WebRTC service |
| `/api/sessions/request` | POST | ✅ Now uses WebRTC service |

---

## 🎯 NEXT STEPS (If Tests Pass)

1. **Frontend Integration**: Update PlayPage.tsx to use WebRTC endpoints properly
2. **Add Audio**: Extend webrtc-peer.ts to capture audio
3. **Input Handling**: Add mouse/keyboard forwarding
4. **VM Integration**: Connect to Azure VM instead of local desktop

---

## 📁 FILES MODIFIED

### **1. session-manager.ts**
```diff
+ // ❌ DISABLED: Sunshine polling removed
+ console.log('[SessionManager] ⚠️ Status polling disabled');
+ return;
```

### **2. orchestrator/index.ts**
```diff
+ // ✅ NEW: WebRTC Session Lifecycle Endpoints
+ POST /api/orchestrator/v1/webrtc/session/start
+ POST /api/orchestrator/v1/webrtc/session/answer
+ POST /api/orchestrator/v1/webrtc/session/ice
+ POST /api/orchestrator/v1/webrtc/session/stop
```

### **3. routes/session.ts**
```diff
+ // ✅ UPDATED: Now uses webrtc-streaming-service
- const response = await sessionManager.startSession(...)
+ const response = await fetch(`${WEBRTC_SERVICE_URL}/webrtc/session/...`)
```

---

**Date**: December 12, 2024  
**Status**: ✅ READY FOR TEST  
**Expected Result**: "Play Now" works end-to-end with WebRTC
