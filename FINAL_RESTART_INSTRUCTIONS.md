# FINAL INSTRUCTIONS - RESTART AND TEST

**Date**: 2025-12-06 01:30
**Status**: ✅ ALL FIXES APPLIED - READY TO TEST

---

## ✅ FIXES APPLIED

1. ✅ **Orchestrator** - Added global request/error logging
2. ✅ **Gateway** - Added global request/error logging  
3. ✅ **Gateway** - Added detailed proxy logging for `/api/play`
4. ✅ **Prisma** - Added debug middleware (if DEBUG_PRISMA=true)

---

## 🚀 RESTART SERVICES

### 1. Stop All Services

In each PowerShell window, press `Ctrl+C`:
- Gateway (port 3000)
- Orchestrator (port 3012)
- (Keep Next.js running on port 3005)

### 2. Restart Gateway

```powershell
cd C:\Users\Domi\Desktop\Strike Antigravity\services\gateway-service
pnpm dev
```

**Wait for**:
```
✓ Gateway service listening on 0.0.0.0:3000
```

### 3. Restart Orchestrator

```powershell
cd C:\Users\Domi\Desktop\Strike Antigravity\services\orchestrator-service
pnpm dev
```

**Wait for**:
```
✓ Session routes registered
✓ Orchestrator service listening on 0.0.0.0:3012
```

---

## 🧪 TEST "PLAY NOW"

1. Go to `http://localhost:3005`
2. Navigate to **Capcom Arcade Stadium**
3. Click **"Play Now"**

---

## 📊 EXPECTED LOGS

### Gateway Logs (in order):

```
[GATEWAY] ========================================
[GATEWAY] Incoming Request
[GATEWAY] Method: POST
[GATEWAY] URL: /api/play/start
[GATEWAY] ========================================

[JWT Gateway] === START JWT VALIDATION ===
[JWT Gateway] Token verified successfully
[JWT Gateway] User ID: 70661b59708d14c98

[GATEWAY PROXY] ========================================
[GATEWAY PROXY] Proxying to Orchestrator
[GATEWAY PROXY] Original URL: /api/play/start
[GATEWAY PROXY] Target: http://localhost:3012
[GATEWAY PROXY] Rewrite to: /api/orchestrator/v1/session/start
[GATEWAY PROXY] ========================================
```

### Orchestrator Logs (in order):

```
[ORCHESTRATOR] ========================================
[ORCHESTRATOR] Incoming Request
[ORCHESTRATOR] Method: POST
[ORCHESTRATOR] URL: /api/orchestrator/v1/session/start
[ORCHESTRATOR] ========================================

[DEBUG Session Body] { userId: '70661b59708d14c98', appId: '1515950', steamAppId: '1515950' }

[SessionManager] Starting session...
[VMProvider] allocateVM() called
[VMProvider] VM allocated: static-vm-001
[SessionManager] Session started successfully
```

---

## 🎯 WHAT TO SEND ME

After testing, send me screenshots of:

1. **Gateway console** - Full logs from when you click "Play Now"
2. **Orchestrator console** - Full logs from when you click "Play Now"
3. **Browser console** (F12) - Any errors or the response

---

## 🔍 TROUBLESHOOTING

### If Gateway shows error:

```
[GATEWAY] ERROR CAUGHT
[GATEWAY] Error: connect ECONNREFUSED 127.0.0.1:3012
```

**Fix**: Orchestrator not running or not reachable
- Verify Orchestrator is running on port 3012
- Check firewall settings

### If Orchestrator shows error:

```
[ORCHESTRATOR] ERROR CAUGHT
[ORCHESTRATOR] Error: [specific error message]
```

**Fix**: We'll see the exact error and can fix it immediately

### If no logs appear:

- Verify services are actually restarted (check timestamps in logs)
- Verify you're clicking "Play Now" on the correct game
- Check if browser is caching old responses (Ctrl+Shift+R to hard refresh)

---

## 💡 ALTERNATIVE: Test Orchestrator Directly

If you want to test the Orchestrator without going through Gateway/Next.js:

```powershell
$body = @{
    userId = "70661b59708d14c98"
    appId = "1515950"
    steamAppId = "1515950"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3012/api/orchestrator/v1/session/start" `
    -Method POST `
    -Headers @{ "Content-Type" = "application/json" } `
    -Body $body
```

This will show if the Orchestrator works in isolation.

---

## 📋 CHECKLIST

Before testing:
- [ ] Gateway stopped and restarted
- [ ] Orchestrator stopped and restarted
- [ ] Gateway shows "listening on 0.0.0.0:3000"
- [ ] Orchestrator shows "listening on 0.0.0.0:3012"
- [ ] No errors during startup

During test:
- [ ] Click "Play Now"
- [ ] Watch Gateway console
- [ ] Watch Orchestrator console
- [ ] Check browser console (F12)

After test:
- [ ] Take screenshots of all 3 consoles
- [ ] Send screenshots to me
- [ ] I'll analyze and provide final fix

---

**RESTART SERVICES NOW AND TEST!** 🚀

With all the logging in place, we'll see EXACTLY where the issue is and fix it immediately!
