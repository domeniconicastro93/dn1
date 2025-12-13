# 🎮 PLAY BUTTON INTEGRATION - DEPLOYMENT GUIDE

**Date**: December 13, 2024  
**Status**: ✅ Complete - Ready for VM Deployment  
**Goal**: Make "Play" button launch Capcom Arcade Stadium (appId 1515950) via VM Agent

---

## 📊 CHANGES SUMMARY

### **Files Modified: 3**

1. ✅ **services/orchestrator-service/src/core/vm-agent-client.ts**
   - Fixed environment variable: `STRIKE_AGENT_KEY` (preferred) or `VM_AGENT_TOKEN` (fallback)
   - Fixed endpoint: `/api/launch` (was `/launch`)
   - Fixed header: `x-strike-agent-key` (was `X-Strike-Token`)
   - Fixed payload: `{appId}` (was `{steamAppId}`)
   - Added comprehensive logging with timing
   - Increased timeout to 10s

2. ✅ **services/orchestrator-service/src/routes/session.ts**
   - Updated `/api/sessions/request` alias to include full VM Agent launch flow
   - Now matches main endpoint logic (health check + launch + delay + WebRTC)
   - Added detailed step-by-step logging

3. ✅ **services/orchestrator-service/.env.example**
   - Added `VM_AGENT_URL=http://127.0.0.1:8787`
   - Added `STRIKE_AGENT_KEY=your-secret-key-here`
   - Added `LAUNCH_DELAY_MS=8000`

---

## 🔧 ENVIRONMENT VARIABLES REQUIRED ON VM

Create/update `services/orchestrator-service/.env`:

```bash
# VM Agent Configuration
VM_AGENT_URL=http://127.0.0.1:8787
STRIKE_AGENT_KEY=<SAME_AS_VM_AGENT>
LAUNCH_DELAY_MS=8000

# Other existing vars...
PORT=3012
DATABASE_URL=...
```

**Get STRIKE_AGENT_KEY from VM Agent**:
```powershell
# On VM, check vm-agent/.env
cat C:\Strike\vm-agent\.env | findstr STRIKE_AGENT_KEY
# Copy the value to orchestrator's .env
```

---

## 🚀 DEPLOYMENT STEPS

### **Step 1: Push Code to GitHub**

```powershell
git status
git add .
git commit -m "fix: VM Agent integration for Play button - correct endpoint, headers, and payload"
git push origin main
```

### **Step 2: On Windows VM - Pull Changes**

```powershell
cd C:\Strike\strike-cloud-gaming  # or wherever you cloned the repo
git pull origin main
```

### **Step 3: Install Dependencies (if vm-agent-client.ts is new)**

```powershell
cd services\orchestrator-service
pnpm install
```

### **Step 4: Update .env on VM**

Edit `services/orchestrator-service/.env`:
```bash
VM_AGENT_URL=http://127.0.0.1:8787
STRIKE_AGENT_KEY=<copy-from-vm-agent-env>
LAUNCH_DELAY_MS=8000
```

### **Step 5: Restart Services on VM**

```powershell
# Stop all
.\stop-all.bat

# Start all
.\start-all.bat
```

---

## 🧪 VALIDATION TESTS (RUN ON VM)

### **Test 1: VM Agent Health**

```powershell
curl http://127.0.0.1:8787/health
```

**Expected Response**:
```json
{
  "ok": true,
  "isInteractive": true,
  "hostname": "STRIKE-VM-...",
  "uptime": 1234
}
```

### **Test 2: VM Agent Launch (Direct)**

```powershell
$env:STRIKE_AGENT_KEY = "your-key-here"

curl -Method POST -Uri "http://127.0.0.1:8787/api/launch" `
  -Headers @{
    "Content-Type" = "application/json"
    "x-strike-agent-key" = $env:STRIKE_AGENT_KEY
  } `
  -Body '{"appId":1515950}'
```

**Expected Response**:
```json
{
  "ok": true,
  "appId": 1515950
}
```

**Expected Result**: Capcom Arcade Stadium launches in Steam

### **Test 3: Orchestrator Play Endpoint**

```powershell
curl -Method POST -Uri "http://localhost:3012/api/sessions/request" `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{
    "userId": "test-user",
    "appId": "capcom-arcade-stadium",
    "steamAppId": 1515950
  }'
```

**Expected Logs** (in orchestrator console):
```
[SessionRoute/Alias] === PLAY NOW FLOW START ===
[SessionRoute/Alias] Session ID: abc-123-...
[SessionRoute/Alias] Steam App ID: 1515950
[SessionRoute/Alias] Step 1: Checking VM Agent health...
[VMAgentClient] Checking VM health
[VMAgentClient] ✅ VM is healthy: STRIKE-VM-...
[SessionRoute/Alias] ✅ VM Agent healthy: STRIKE-VM-...
[SessionRoute/Alias] Step 2: Launching Steam game: 1515950
[VMAgentClient] Launching Steam game: 1515950
[VMAgentClient] VM Agent URL: http://127.0.0.1:8787
[VMAgentClient] Using auth key: abc12345...
[VMAgentClient] Response status: 200 in 234 ms
[VMAgentClient] ✅ Game launched successfully in 234 ms
[SessionRoute/Alias] ✅ Game launched successfully
[SessionRoute/Alias] Step 3: Waiting 8000ms for game initialization...
[SessionRoute/Alias] Step 4: Starting WebRTC stream capture...
[WebRTCClient] Starting session: abc-123-...
[SessionRoute/Alias] ✅ Complete Play Now flow successful!
[SessionRoute/Alias] === PLAY NOW FLOW END ===
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "abc-123-...",
    "offer": {...},
    "vmAgent": {
      "hostname": "STRIKE-VM-...",
      "launched": true
    }
  }
}
```

**Expected Result**: Game launches AND WebRTC session starts

---

## 🌐 END-TO-END TEST (FRONTEND)

### **From Browser**:

1. Navigate to: `http://localhost:3000` (or VM IP if accessing remotely)
2. Login with your account
3. Navigate to Capcom Arcade Stadium game page
4. Click **"Play Now"** button

### **Expected Frontend Behavior**:
- Button shows "Starting..." spinner
- No errors in browser console
- Redirects to `/play?sessionId=...`

### **Expected VM Behavior**:
- Orchestrator logs show full PLAY NOW FLOW (see Test 3 above)
- Capcom Arcade Stadium launches on VM desktop
- WebRTC stream starts capturing desktop

### **Expected Browser Result**:
- WebRTC player loads
- Game appears in video stream
- User can see game running

---

## ❌ TROUBLESHOOTING

### **Error: "VM Agent unavailable"**

**Problem**: Orchestrator can't reach VM Agent

**Check**:
```powershell
# 1. Is VM Agent running?
curl http://127.0.0.1:8787/health

# 2. Check VM_AGENT_URL in orchestrator .env
cat services\orchestrator-service\.env | findstr VM_AGENT_URL

# 3. Restart VM Agent
cd C:\Strike\vm-agent
pnpm dev
```

### **Error: "401 Unauthorized" from VM Agent**

**Problem**: STRIKE_AGENT_KEY mismatch

**Fix**:
```powershell
# Get key from VM Agent
cat C:\Strike\vm-agent\.env | findstr STRIKE_AGENT_KEY

# Update orchestrator .env
# Ensure no quotes, no spaces, exact match
```

### **Error: "Failed to launch game"**

**Problem**: VM Agent can't launch Steam game

**Check**:
1. Steam is running and logged in
2. User is logged into Windows (not locked)
3. Test manually: `steam://rungameid/1515950` in browser

**VM Agent Logs**:
```
[VM Agent] Launching Steam game: 1515950
[VM Agent] Executing PowerShell command
[VM Agent] ❌ PowerShell exit code 1: ...
```

### **Error: "Timeout"**

**Problem**: Request took too long

**Fix**:
```bash
# Increase timeout in orchestrator .env
VM_AGENT_TIMEOUT_MS=15000  # Default is 10000
```

---

## 📝 CURL COMMANDS REFERENCE

### **Health Check**
```powershell
curl http://127.0.0.1:8787/health
```

### **Launch Game**
```powershell
curl -Method POST -Uri "http://127.0.0.1:8787/api/launch" `
  -Headers @{
    "Content-Type" = "application/json"
    "x-strike-agent-key" = "your-key-here"
  } `
  -Body '{"appId":1515950}'
```

### **Play Endpoint (Via Orchestrator)**
```powershell
curl -Method POST -Uri "http://localhost:3012/api/sessions/request" `
  -Headers @{"Content-Type" = "application/json"} `
  -Body '{
    "userId": "test-user",
    "appId": "capcom",
    "steamAppId": 1515950
  }'
```

---

## ✅ ACCEPTANCE CRITERIA

- [ ] Git push successful
- [ ] Git pull on VM successful
- [ ] Orchestrator .env has VM_AGENT_URL, STRIKE_AGENT_KEY, LAUNCH_DELAY_MS
- [ ] Test 1 (health) returns `{"ok":true}`
- [ ] Test 2 (direct launch) launches Capcom
- [ ] Test 3 (orchestrator) shows full flow logs
- [ ] Frontend "Play Now" button triggers game launch
- [ ] Game appears in WebRTC stream
- [ ] No errors in any console

---

## 📂 FILES CHANGED

```
services/orchestrator-service/
├── src/
│   ├── core/
│   │   └── vm-agent-client.ts          ← Fixed endpoint, headers, payload, logging
│   └── routes/
│       └── session.ts                   ← Added VM Agent flow to /api/sessions/request
└── .env.example                        ← Added VM Agent env vars
```

---

## 🎯 WHAT CHANGED TECHNICALLY

### **Before (Broken)**:
```typescript
// Wrong endpoint
fetch(`${vmAgentUrl}/launch`, ...)  // ❌ Should be /api/launch

// Wrong header
headers: { 'X-Strike-Token': token }  // ❌ Should be x-strike-agent-key

// Wrong payload
body: JSON.stringify({ steamAppId })  // ❌ Should be appId

// /api/sessions/request didn't launch games
// Frontend called → orchestrator → WebRTC only (no game launch)
```

### **After (Fixed)**:
```typescript
// Correct endpoint
fetch(`${vmAgentUrl}/api/launch`, ...)  // ✅

// Correct header
headers: { 'x-strike-agent-key': token }  // ✅

// Correct payload
body: JSON.stringify({ appId: Number(steamAppId) })  // ✅

// /api/sessions/request now includes full flow
// Frontend → orchestrator → (health + launch + delay + WebRTC)
```

---

**Next Step**: Deploy to VM and test!

**Expected Time**: 10-15 minutes for deployment + testing

**Status**: ✅ **READY FOR DEPLOYMENT**
