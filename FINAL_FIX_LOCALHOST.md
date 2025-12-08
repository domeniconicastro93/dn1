# FINAL FIX - LOCALHOST vs 127.0.0.1

**Date**: 2025-12-06 01:42
**Status**: ✅ FIX APPLICATO - RIAVVIA GATEWAY

---

## 🎯 PROBLEMA TROVATO!

**Dai log**:
- ✅ Gateway riceve richiesta da Next.js
- ✅ JWT validation funziona
- ✅ Gateway cerca di inoltrare a `http://localhost:3012`
- ❌ **Orchestrator NON riceve nulla!**

**Causa**: Il Gateway non riesce a connettersi a `localhost:3012`

**Soluzione**: Cambiato da `localhost` a `127.0.0.1`

---

## ✅ FIX APPLICATO

**File**: `services/gateway-service/src/index.ts`

```diff
app.register(httpProxy as any, {
-  upstream: 'http://localhost:3012',
+  upstream: 'http://127.0.0.1:3012',
   prefix: '/api/play',
   rewritePrefix: '/api/orchestrator/v1/session',
});
```

---

## 🚀 RIAVVIA SOLO IL GATEWAY

**NON serve riavviare l'Orchestrator!**

### Nella finestra PowerShell del Gateway:

1. **Ferma** (Ctrl+C)
2. **Riavvia**:
   ```powershell
   cd C:\Users\Domi\Desktop\Strike Antigravity\services\gateway-service
   pnpm dev
   ```

### Aspetta:
```
✓ Gateway service listening on 0.0.0.0:3000
```

---

## 🧪 TESTA "PLAY NOW"

1. Vai su `http://localhost:3005`
2. Naviga a Capcom Arcade Stadium
3. Clicca "Play Now"

---

## 📊 COSA DOVRESTI VEDERE

### Gateway:
```
[GATEWAY PROXY] Target: http://127.0.0.1:3012
[JWT Gateway] === JWT VALIDATION SUCCESS ===
```

### Orchestrator (FINALMENTE!):
```
[ORCHESTRATOR] ========================================
[ORCHESTRATOR] Incoming Request
[ORCHESTRATOR] Method: POST
[ORCHESTRATOR] URL: /api/orchestrator/v1/session/start
[ORCHESTRATOR] ========================================

[DEBUG Session Body] { userId: '...', appId: '...', steamAppId: '...' }

[SessionManager] Starting session...
[VMProvider] allocateVM() called
[VMProvider] VM allocated: static-vm-001
[SessionManager] Session started successfully
```

### Browser:
```
✅ 200 OK
{
  "success": true,
  "data": {
    "sessionId": "...",
    "sunshineHost": "20.31.130.73",
    "sunshinePort": 47985,
    "appIndex": 1
  }
}
```

---

## 🎯 PERCHÉ QUESTO FIX FUNZIONA

**Problema**: Su Windows, `localhost` può risolvere sia a `127.0.0.1` (IPv4) che a `::1` (IPv6).

Se l'Orchestrator è in ascolto solo su `0.0.0.0` (IPv4), ma il Gateway cerca di connettersi a `localhost` che risolve a `::1` (IPv6), la connessione fallisce.

**Soluzione**: Usare esplicitamente `127.0.0.1` (IPv4) garantisce che la connessione vada all'indirizzo corretto.

---

## 🚨 SE ANCORA NON FUNZIONA

Se dopo il riavvio del Gateway vedi ancora errori:

### Test Diretto

Testa se l'Orchestrator è raggiungibile:

```powershell
Test-NetConnection -ComputerName 127.0.0.1 -Port 3012
```

**Dovresti vedere**:
```
TcpTestSucceeded : True
```

Se vedi `False`, significa che l'Orchestrator non è in ascolto sulla porta 3012.

---

## 📋 CHECKLIST

- [ ] Gateway fermato (Ctrl+C)
- [ ] Gateway riavviato con `pnpm dev`
- [ ] Gateway mostra "listening on 0.0.0.0:3000"
- [ ] Orchestrator ancora in esecuzione (NON riavviare!)
- [ ] Test "Play Now"
- [ ] Controlla log Orchestrator per `[ORCHESTRATOR] Incoming Request`

---

**RIAVVIA SOLO IL GATEWAY E TESTA!** 🚀

Questo dovrebbe finalmente far funzionare tutto!
