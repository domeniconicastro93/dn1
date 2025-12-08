# ORCHESTRATOR NON RICEVE RICHIESTE

**Date**: 2025-12-06 00:47
**Status**: 🔍 PROBLEMA IDENTIFICATO - ROUTING

---

## 🎯 PROBLEMA

L'Orchestrator si avvia correttamente ma **non riceve nessuna richiesta** quando premi "Play Now".

**Sintomi**:
- ✅ Orchestrator in ascolto su `0.0.0.0:3012`
- ✅ Session routes registrati
- ❌ Nessun log `[ORCHESTRATOR]` quando premi "Play Now"
- ❌ Nessuna richiesta arriva all'Orchestrator

**Conclusione**: Il problema è nel **routing** tra Frontend → Gateway → Orchestrator.

---

## 🔍 POSSIBILI CAUSE

### 1. Gateway Non in Esecuzione
Il Gateway Service (porta 3000) potrebbe non essere avviato.

### 2. Frontend Chiama Porta Sbagliata
Il frontend potrebbe chiamare direttamente l'Orchestrator invece del Gateway.

### 3. Gateway Non Inoltra Correttamente
Il Gateway potrebbe non inoltrare `/api/play` all'Orchestrator.

---

## 🧪 TEST DI DIAGNOSTICA

### Test 1: Verifica Orchestrator Direttamente

Apri il browser e vai a:
```
http://localhost:3012/api/orchestrator/v1/test
```

**Risultato Atteso**:
```json
{
  "success": true,
  "message": "Orchestrator is reachable!",
  "timestamp": "2025-12-06T00:47:00.000Z"
}
```

**E nella console dell'Orchestrator**:
```
[ORCHESTRATOR] TEST ENDPOINT HIT!
```

**Se funziona**: ✅ Orchestrator OK, problema è nel Gateway
**Se NON funziona**: ❌ Orchestrator ha problemi di rete/firewall

---

### Test 2: Verifica Gateway

Controlla se il Gateway è in esecuzione:

1. Cerca una finestra PowerShell con "gateway-service"
2. Dovrebbe mostrare: `Gateway service listening on 0.0.0.0:3000`

**Se NON è in esecuzione**:
```powershell
cd services\gateway-service
pnpm dev
```

---

### Test 3: Verifica Routing Gateway → Orchestrator

Apri il browser e vai a:
```
http://localhost:3000/api/play/test
```

**Questo dovrebbe**:
1. Arrivare al Gateway (porta 3000)
2. Essere inoltrato all'Orchestrator come `/api/orchestrator/v1/session/test`
3. Ma non esiste questo endpoint, quindi darà 404

**Ma dovresti vedere** nella console dell'Orchestrator:
```
[ORCHESTRATOR] ========================================
[ORCHESTRATOR] Incoming Request
[ORCHESTRATOR] Method: GET
[ORCHESTRATOR] URL: /api/orchestrator/v1/session/test
[ORCHESTRATOR] ========================================
```

**Se vedi questo**: ✅ Gateway inoltra correttamente
**Se NON vedi nulla**: ❌ Gateway non inoltra

---

### Test 4: Verifica Chiamata Frontend

Apri la console del browser (F12) e vai alla tab "Network".

Quando premi "Play Now", cerca la richiesta `POST /api/play/start`.

**Controlla**:
- **Request URL**: Dovrebbe essere `http://localhost:3000/api/play/start` (Gateway)
- **Status**: Attualmente 500
- **Response**: Guarda il messaggio di errore

**Se la URL è diversa** (es. `localhost:3005` o `localhost:3012`):
- Il frontend sta chiamando la porta sbagliata
- Dobbiamo correggere il frontend

---

## 🔧 SOLUZIONI RAPIDE

### Soluzione A: Riavvia Gateway

Se il Gateway non è in esecuzione:

```powershell
cd services\gateway-service
pnpm dev
```

### Soluzione B: Verifica .env del Frontend

**File**: `apps/web/.env.local`

Dovrebbe contenere:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

**NON**:
```env
NEXT_PUBLIC_API_URL=http://localhost:3012  # SBAGLIATO!
```

### Soluzione C: Verifica Gateway Routing

**File**: `services/gateway-service/src/index.ts`

Cerca:
```typescript
app.register(httpProxy, {
  upstream: 'http://localhost:3012',  // Orchestrator
  prefix: '/api/play',
  rewritePrefix: '/api/orchestrator/v1/session',
});
```

Verifica che:
- ✅ `upstream` sia `http://localhost:3012`
- ✅ `prefix` sia `/api/play`
- ✅ `rewritePrefix` sia `/api/orchestrator/v1/session`

---

## 🎯 PROSSIMI PASSI

### Passo 1: Esegui Test 1

Vai a `http://localhost:3012/api/orchestrator/v1/test` nel browser.

**Inviami**:
- Screenshot della risposta del browser
- Screenshot della console dell'Orchestrator

### Passo 2: Verifica Gateway

Controlla se il Gateway è in esecuzione.

**Inviami**:
- Screenshot della finestra PowerShell del Gateway
- O dimmi se non è in esecuzione

### Passo 3: Controlla Network Tab

Apri F12 → Network, premi "Play Now".

**Inviami**:
- Screenshot della tab Network con la richiesta `POST /api/play/start`
- Mostrami la Request URL e la Response

---

## 📊 DIAGNOSI RAPIDA

| Test | URL | Cosa Verifica |
|------|-----|---------------|
| 1 | `localhost:3012/api/orchestrator/v1/test` | Orchestrator raggiungibile |
| 2 | Finestra PowerShell Gateway | Gateway in esecuzione |
| 3 | `localhost:3000/api/play/test` | Gateway inoltra a Orchestrator |
| 4 | F12 Network tab | Frontend chiama Gateway correttamente |

---

**ESEGUI IL TEST 1 E INVIAMI I RISULTATI!** 🔍
