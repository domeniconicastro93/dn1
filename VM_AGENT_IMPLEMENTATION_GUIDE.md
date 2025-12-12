# 🎮 VM AGENT AUTO-LAUNCH - COMPLETE IMPLEMENTATION GUIDE

## 🎯 WHAT WAS IMPLEMENTED

Complete end-to-end game launch system with 4-step flow:
1. **VM Agent Health Check** - Verify VM is reachable
2. **Steam Game Launch** - Launch game via Steam protocol
3. **Initialization Delay** - Wait for game to come to foreground
4. **WebRTC Capture** - Start desktop stream capture

---

## 📁 NEW FILES CREATED

### **VM Agent Service** (`services/vm-agent/`)
| File | Description |
|------|-------------|
| `package.json` | Dependencies (fastify, dotenv) |
| `tsconfig.json` | TypeScript configuration |
| `src/index.ts` | **Main VM Agent server** |
| `.env.example` | Environment variable template |
| `README.md` | Complete setup instructions |

### **Orchestrator Integration**
| File | Description |
|------|-------------|
| `core/vm-agent-client.ts` | **VM Agent client** |

---

## 📊 MODIFIED FILES

### **1. services/orchestrator-service/src/index.ts**
```diff
+import { getVMAgentClient } from './core/vm-agent-client';
```

### **2. services/orchestrator-service/src/routes/session.ts**
```diff
+import { getVMAgentClient } from '../core/webrtc-client';

+// Configuration
+const LAUNCH_DELAY_MS = parseInt(process.env.LAUNCH_DELAY_MS || '1500', 10);

export function registerSessionRoutes(app: FastifyInstance) {
    const webrtcClient = getWebRTCClient();
+    const vmAgentClient = getVMAgentClient(); // VM Agent for game launch

    // In session start:
+    // STEP 1: Check VM Agent health
+    const health = await vmAgentClient.health();
+    if (!health.ok) return error...
+
+    // STEP 2: Launch Steam game
+    if (steamAppId) {
+        const launchResult = await vmAgentClient.launchGame(steamAppId);
+        if (!launchResult.ok) return error...
+        await sleep(LAUNCH_DELAY_MS);
+    }
+
+    // STEP 4: Start WebRTC
    const { offer } = await webrtcClient.startSession(sessionId);
```

---

## 🔧 SETUP INSTRUCTIONS

### **ON WINDOWS VM**

#### Step 1: Install VM Agent
```powershell
# 1. Create directory
mkdir C:\Strike\vm-agent
cd C:\Strike\vm-agent

# 2. Copy vm-agent files to this directory
# (package.json, tsconfig.json, src/index.ts, .env.example, README.md)

# 3. Install dependencies
pnpm install
```

#### Step 2: Configure
```powershell
# 1. Copy .env file
cp .env.example .env

# 2. Generate strong token
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: 8f4d3c2a1b7e9f6... (64 characters)

# 3. Edit .env with generated token
```

Example `.env`:
```
PORT=8787
VM_AGENT_TOKEN=8f4d3c2a1b7e9f6a8b3c4e5d7f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b
LAUNCH_DELAY_MS=5000
```

#### Step 3: Configure Windows Firewall
```powershell
New-NetFirewallRule -DisplayName "Strike VM Agent" `
  -Direction Inbound `
  -LocalPort 8787 `
  -Protocol TCP `
  -Action Allow
```

#### Step 4: Test
```powershell
# Start VM Agent
pnpm dev

# Should see:
# [VM Agent] ✅ Server listening on http://0.0.0.0:8787
# [VM Agent] Ready to receive launch requests
```

#### Step 5: Test Manually
```powershell
# Terminal 1: VM Agent running (pnpm dev)

# Terminal 2: Test health
curl http://localhost:8787/health

# Should return:
# {"ok":true,"hostname":"STRIKE-VM-01","user":"Administrator","uptime":123,...}

# Terminal 3: Test launch (replace token)
$token = "your-token-here"
$body = @{ steamAppId = "1515950" } | ConvertTo-Json

curl -Method POST `
  -Uri "http://localhost:8787/launch" `
  -Headers @{ "X-Strike-Token" = $token; "Content-Type" = "application/json" } `
  -Body $body

# Should launch Capcom Arcade Stadium in Steam
```

---

### **ON ORCHESTRATOR (Local Dev)**

#### Step 1: Add Environment Variables
**File**: `services/orchestrator-service/.env`

```bash
# VM Agent Configuration
VM_AGENT_URL=http://<VM_IP>:8787
VM_AGENT_TOKEN=8f4d3c2a1b7e9f6... (same token as VM)
LAUNCH_DELAY_MS=1500

# Existing vars
WEBRTC_SERVICE_URL=http://localhost:3015
```

#### Step 2: Update Azure NSG (if using Azure VM)
```bash
# Allow orchestrator to reach VM Agent
az network nsg rule create \
  --resource-group strike-rg \
  --nsg-name strike-vm-nsg \
  --name AllowVMAgent \
  --priority 1000 \
  --source-address-prefixes <orchestrator-public-ip> \
  --destination-port-ranges 8787 \
  --protocol Tcp \
  --access Allow
```

---

## 🧪 TESTING CHECKLIST

### **Phase 1: VM Agent Standalone**
- [ ] VM Agent starts successfully
- [ ] Health endpoint returns 200 OK
- [ ] Launch endpoint (with valid token) launches game
- [ ] Launch endpoint (without token) returns 401
- [ ] Game appears on screen after launch

### **Phase 2: Orchestrator Integration**
- [ ] Orchestrator can reach VM Agent health endpoint
- [ ] Orchestrator can launch game via VM Agent
- [ ] Logs show full 4-step flow
- [ ] WebRTC session starts after game launch

### **Phase 3: End-to-End Play Now**
- [ ] Click "Play Now" on game card
- [ ] Orchestrator logs show:
```
[SessionRoute] Step 1: Checking VM Agent health...
[SessionRoute] ✅ VM Agent healthy: STRIKE-VM-01
[SessionRoute] Step 2: Launching Steam game: 1515950
[SessionRoute] ✅ Game launched successfully
[SessionRoute] Step 3: Waiting 1500ms for game initialization...
[SessionRoute] Step 4: Starting WebRTC stream capture...
[SessionRoute] ✅ Complete Play Now flow successful!
```
- [ ] Game appears in WebRTC stream
- [ ] User can see and interact with game

---

## 🔍 TROUBLESHOOTING

### **VM Agent Won't Start**
**Problem**: Port 8787 already in use

**Solution**:
```powershell
netstat -ano | findstr :8787
taskkill /F /PID <pid>
```

### **Orchestrator Can't Reach VM**
**Problem**: `VM Agent unavailable: timeout`

**Check**:
1. VM Agent is running on VM
2. Windows Firewall allows port 8787
3. Azure NSG allows orchestrator IP → VM port 8787
4. VM_AGENT_URL in orchestrator .env is correct

**Test from orchestrator machine**:
```powershell
Test-NetConnection -ComputerName <vm-ip> -Port 8787
```

### **Game Not Launching**
**Problem**: Launch returns success but game doesn't appear

**Check**:
1. Steam is running on VM and logged in
2. User is logged into Windows (not locked)
3. Test manually: Open browser, go to `steam://rungameid/1515950`
4. Check VM Agent logs for errors

### **Authentication Fails**
**Problem**: 401 Unauthorized

**Check**:
1. VM_AGENT_TOKEN matches on both sides
2. Token is not wrapped in quotes in .env
3. No leading/trailing spaces

---

## 📝 API REFERENCE

### **VM Agent Endpoints**

#### **GET /health**
Check VM health (no authentication).

**Response**:
```json
{
  "ok": true,
  "hostname": "STRIKE-VM-01",
  "user": "Administrator",
  "uptime": 12345,
  "time": "2024-12-12T15:00:00.000Z",
  "platform": "win32",
  "release": "10.0.22621"
}
```

#### **POST /launch**
Launch Steam game.

**Headers**:
- `X-Strike-Token: <token>`
- `Content-Type: application/json`

**Body**:
```json
{
  "steamAppId": "1515950"
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "steamAppId": 1515950
}
```

**Response (Error)**:
```json
{
  "ok": false,
  "error": "PowerShell exit code 1: ..."
}
```

---

## 🔐 SECURITY BEST PRACTICES

### **Network Security**
1. **Never expose port 8787 to public internet**
2. **Use Azure NSG** to restrict to orchestrator IP only
3. **Use Windows Firewall** as second layer
4. **Use VPN or Private Endpoints** in production

### **Token Security**
1. Generate token with: `crypto.randomBytes(32).toString('hex')`
2. Store in `.env`, never in code
3. Rotate tokens periodically
4. Use different tokens per environment (dev/staging/prod)

### **Monitoring**
1. Monitor VM Agent logs for unauthorized access attempts
2. Alert on repeated 401 responses
3. Log all game launch requests with IP addresses

---

## 🚀 PRODUCTION DEPLOYMENT

### **Run VM Agent as Windows Service**

**Option A: Using PM2**
```powershell
npm install -g pm2
pm2 start dist/index.js --name strike-vm-agent
pm2 save
pm2 startup
```

**Option B: Using NSSM**
```powershell
# Download NSSM
# Install service
nssm install StrikeVMAgent "C:\Program Files\nodejs\node.exe" "C:\Strike\vm-agent\dist\index.js"
nssm set StrikeVMAgent AppDirectory "C:\Strike\vm-agent"
nssm start StrikeVMAgent
```

### **Logging**
```powershell
# Redirect to file
pnpm start > C:\Strike\logs\vm-agent.log 2>&1

# Or with PM2
pm2 logs strike-vm-agent --lines 100
```

---

## 📊 EXPECTED LOGS (Full Flow)

### **VM Agent Logs**:
```
[VM Agent] Health check requested
[VM Agent] Launching Steam game: 1515950
[VM Agent] Executing PowerShell command
[VM Agent] ✅ Steam game launched successfully
```

### **Orchestrator Logs**:
```
[SessionRoute] Starting full Play Now flow for session: abc-123
[SessionRoute] Step 1: Checking VM Agent health...
[VMAgentClient] Checking VM health
[VMAgentClient] ✅ VM is healthy: STRIKE-VM-01
[SessionRoute] ✅ VM Agent healthy: STRIKE-VM-01
[SessionRoute] Step 2: Launching Steam game: 1515950
[VMAgentClient] Launching Steam game: 1515950
[VMAgentClient] ✅ Game launched successfully
[SessionRoute] ✅ Game launched successfully
[SessionRoute] Step 3: Waiting 1500ms for game initialization...
[SessionRoute] Step 4: Starting WebRTC stream capture...
[WebRTCClient] Starting session: abc-123
[WebRTCClient] ✅ Session started, offer received
[SessionRoute] ✅ Complete Play Now flow successful!
```

---

**Implementation Date**: December 12, 2024  
**Status**: ✅ **COMPLETE & READY FOR TESTING**  
**Next Step**: Deploy VM Agent to Windows VM and test end-to-end
