# 🎮 VM AGENT QUICK START

## 📋 TL;DR - WHAT YOU NEED TO DO

### ON WINDOWS VM:
```powershell
cd C:\Strike\vm-agent
pnpm install
cp .env.example .env
# Edit .env with your token
pnpm dev
```

### ON ORCHESTRATOR:
Add to `.env`:
```
VM_AGENT_URL=http://<VM_IP>:8787
VM_AGENT_TOKEN=<same-token-as-vm>
```

### TEST:
1. Click "Play Now" on Capcom Arcade Stadium
2. Game should launch on VM
3. Stream appears in browser

---

## 🔧 WINDOWS VM SETUP (5 STEPS)

**Step 1: Create folder**
```powershell
mkdir C:\Strike\vm-agent
cd C:\Strike\vm-agent
```

**Step 2: Generate token**
```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the output (64 characters).

**Step 3: Create `.env`**
```
PORT=8787
VM_AGENT_TOKEN=<paste-token-here>
```

**Step 4: Firewall**
```powershell
New-NetFirewallRule -DisplayName "Strike VM Agent" -Direction Inbound -LocalPort 8787 -Protocol TCP -Action Allow
```

**Step 5: Run**
```powershell
pnpm install
pnpm dev
```

---

## 🧪 MANUAL TESTS

### Test 1: Health Check
```powershell
curl http://localhost:8787/health
```
Expected: `{"ok":true,"hostname":"...","uptime":123,...}`

### Test 2: Launch Game
```powershell
$token = "your-token-here"
$body = @{ steamAppId = "1515950" } | ConvertTo-Json
curl -Method POST -Uri "http://localhost:8787/launch" -Headers @{ "X-Strike-Token" = $token } -Body $body
```
Expected: Capcom Arcade Stadium opens in Steam

---

## 📊 EXPECTED LOGS

When you click "Play Now":

**Orchestrator**:
```
[SessionRoute] Step 1: Checking VM Agent health...
[SessionRoute] ✅ VM Agent healthy: STRIKE-VM-01
[SessionRoute] Step 2: Launching Steam game: 1515950
[SessionRoute] ✅ Game launched successfully
[SessionRoute] Step 3: Waiting 1500ms...
[SessionRoute] Step 4: Starting WebRTC stream capture...
[SessionRoute] ✅ Complete Play Now flow successful!
```

**VM Agent**:
```
[VM Agent] Health check requested
[VM Agent] Launching Steam game: 1515950
[VM Agent] ✅ Steam game launched successfully
```

---

## ❌ TROUBLESHOOTING

| Problem | Solution |
|---------|----------|
| **Port 8787 in use** | `netstat -ano \| findstr :8787` then `taskkill /F /PID <pid>` |
| **401 Unauthorized** | Check token matches on both sides |
| **Timeout** | Check firewall, NSG, VM_AGENT_URL |
| **Game doesn't launch** | Ensure Steam is running and logged in |

---

## 🚀 PRODUCTION

Run as Windows Service:
```powershell
npm install -g pm2
pnpm build
pm2 start dist/index.js --name strike-vm-agent
pm2 save
pm2 startup
```

---

**See**: `VM_AGENT_IMPLEMENTATION_GUIDE.md` for complete documentation.
