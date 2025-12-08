# ROUTING ISSUE - NEXT.JS NON INOLTRA

**Date**: 2025-12-06 01:12
**Status**: 🔍 PROBLEMA IDENTIFICATO - NEXT.JS API ROUTE

---

## 🎯 PROBLEMA

La richiesta `POST /api/play/start` arriva a Next.js (porta 3005) ma:
- ❌ NON viene inoltrata al Gateway (porta 3000)
- ❌ NON arriva all'Orchestrator (porta 3012)
- ❌ Next.js restituisce 500 Internal Server Error

**Dalla console del browser**:
```
POST http://localhost:3005/api/play/start 500 (Internal Server Error)
```

**Dalla console dell'Orchestrator**:
```
(nessun log - la richiesta non arriva)
```

---

## 🔍 CAUSA PROBABILE

Il Next.js API route `/api/play/start/route.ts` sta fallendo prima di inoltrare al Gateway.

**Possibili cause**:
1. **Token JWT non trovato** - `getAccessToken()` fallisce
2. **Gateway non raggiungibile** - `http://localhost:3000` non risponde
3. **Middleware Next.js** - Qualche middleware blocca la richiesta
4. **Errore di parsing** - `request.json()` fallisce

---

## 🧪 DIAGNOSI

### Passo 1: Controlla Log Next.js

Cerca la finestra PowerShell che mostra:
```
- ready started server on 0.0.0.0:3005
```

Quando premi "Play Now", dovresti vedere log come:
```
[Play Start API] === START ===
[Play Start API] Request body: { ... }
[Play Start API] Calling gateway: http://localhost:3000/api/play/start
```

**Se NON vedi questi log**: L'errore è PRIMA del nostro codice (middleware o Next.js stesso)

**Se vedi questi log**: Controlla quale errore viene mostrato

---

### Passo 2: Verifica Gateway Raggiungibile

Apri il browser e vai a:
```
http://localhost:3000/health
```

**Dovresti vedere**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "gateway-service"
  }
}
```

**Se NON funziona**: Il Gateway non è raggiungibile da Next.js

---

### Passo 3: Test Diretto al Gateway

Usa Postman o curl per testare direttamente il Gateway:

```powershell
# Ottieni un token JWT valido dalla console del browser (F12 > Application > Cookies > strike_access_token)
# Poi:

$token = "IL_TUO_TOKEN_QUI"
$body = @{
    userId = "test-user"
    appId = "1515950"
    steamAppId = "1515950"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:3000/api/play/start" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

**Se funziona**: Il problema è in Next.js
**Se NON funziona**: Il problema è nel Gateway o Orchestrator

---

## ✅ FIX TEMPORANEO - BYPASS NEXT.JS

Per testare se il problema è Next.js, modifica il frontend per chiamare direttamente il Gateway:

**File**: `apps/web/app/games/[id]/GameDetailPage.tsx`

Cerca la funzione `handlePlayNow` e cambia:
```typescript
// PRIMA (chiama Next.js)
const response = await fetch('/api/play/start', { ... });

// DOPO (chiama Gateway direttamente)
const response = await fetch('http://localhost:3000/api/play/start', { ... });
```

**ATTENZIONE**: Questo è solo per test! Non è la soluzione finale.

---

## 🎯 AZIONE RICHIESTA

### 1. Controlla Log Next.js

Trova la finestra PowerShell di Next.js e:
- Premi "Play Now"
- Guarda i log
- Inviami screenshot

### 2. Testa Gateway Health

Vai a `http://localhost:3000/health` nel browser e inviami screenshot.

### 3. Controlla .env di Next.js

**File**: `apps/web/.env.local`

Verifica che contenga:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

---

## 📊 CHECKLIST

| Servizio | Porta | Status | Test |
|----------|-------|--------|------|
| Next.js | 3005 | ✅ Running | `http://localhost:3005` |
| Gateway | 3000 | ✅ Running | `http://localhost:3000/health` |
| Orchestrator | 3012 | ✅ Running | `http://localhost:3012/api/orchestrator/v1/test` |

Tutti i servizi sono avviati, ma la richiesta non passa da Next.js → Gateway → Orchestrator.

---

**CONTROLLA I LOG DI NEXT.JS E INVIAMI SCREENSHOT!** 🔍

Il problema è quasi certamente lì.
