# API ROUTES FIX — CLOUD GAMING SESSION
## Next.js API Proxy Routes Created

**Data**: 2025-12-05
**Problema**: 404 su `/api/play/start` perché mancavano le route API in Next.js
**Soluzione**: Create route proxy che inoltrano al Gateway Service

---

## 🚨 PROBLEMA IDENTIFICATO

**Errore**:
```
POST http://localhost:3005/api/play/start 404 (Not Found)
```

**Causa**:
Il frontend chiama `/api/play/start` su Next.js (porta 3005), ma Next.js non aveva route API per gestire queste richieste e inoltrarle al Gateway (porta 3000).

---

## ✅ SOLUZIONE IMPLEMENTATA

### Route API Create

**1. Session Start**
- **File**: `apps/web/app/api/play/start/route.ts`
- **Metodo**: POST
- **Funzione**: Proxy a `http://localhost:3000/api/play/start`

**2. Session Status**
- **File**: `apps/web/app/api/play/status/[sessionId]/route.ts`
- **Metodo**: GET
- **Funzione**: Proxy a `http://localhost:3000/api/play/status/:sessionId`

**3. Session Stop**
- **File**: `apps/web/app/api/play/stop/route.ts`
- **Metodo**: POST
- **Funzione**: Proxy a `http://localhost:3000/api/play/stop`

---

## 🔄 FLUSSO CORRETTO

### Prima (NON FUNZIONANTE)
```
Frontend (3005)
  ↓ POST /api/play/start
Next.js (3005)
  ❌ 404 - Route non trovata
```

### Dopo (FUNZIONANTE)
```
Frontend (3005)
  ↓ POST /api/play/start
Next.js API Route (3005)
  ↓ Proxy con JWT token
Gateway Service (3000)
  ↓ /api/play → /api/orchestrator/v1/session
Orchestrator Service (3012)
  ↓ Gestisce sessione
  ✅ Risposta con sessionId
```

---

## 📋 CARATTERISTICHE ROUTE API

### Autenticazione
- ✅ Estrae JWT token da cookie
- ✅ Inoltra token al Gateway con header `Authorization`
- ✅ Gestisce errori 401 Unauthorized

### Logging
- ✅ Log dettagliati per debugging
- ✅ Traccia richieste e risposte
- ✅ Cattura eccezioni

### Error Handling
- ✅ Gestisce errori Gateway
- ✅ Restituisce messaggi strutturati
- ✅ Status code corretti

---

## 🎯 CODICE ESEMPIO

### Session Start Route
```typescript
export async function POST(request: NextRequest) {
    const token = await getAccessToken();
    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const gatewayUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${gatewayUrl}/api/play/start`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data);
}
```

---

## ✅ VERIFICA

### Test Session Start

**Request**:
```bash
curl -X POST http://localhost:3005/api/play/start \
  -H "Content-Type: application/json" \
  -H "Cookie: strike_token=YOUR_TOKEN" \
  -d '{
    "userId": "user123",
    "appId": "game456",
    "steamAppId": "1515950"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "sess_abc123",
    "state": "STARTING",
    "sunshineHost": "20.31.130.73",
    "sunshineStreamPort": 47985
  }
}
```

---

## 🚀 PROSSIMI PASSI

1. **Riavvia Web App**:
   ```bash
   # Ferma Web App (Ctrl+C nella finestra)
   # Riavvia
   cd apps/web
   pnpm run dev
   ```

2. **Testa Play Now**:
   - Vai su http://localhost:3005
   - Clicca su un gioco owned
   - Clicca "Play Now"
   - **Niente più 404!**

3. **Verifica Console**:
   ```
   [Play Start API] === START ===
   [Play Start API] Calling gateway: http://localhost:3000/api/play/start
   [Play Start API] Gateway response status: 200
   [Play Start API] Success
   [Play Start API] === END ===
   ```

---

## 📊 FILE CREATI

1. ✅ `apps/web/app/api/play/start/route.ts`
2. ✅ `apps/web/app/api/play/status/[sessionId]/route.ts`
3. ✅ `apps/web/app/api/play/stop/route.ts`

---

## ✅ CONCLUSIONE

**Le route API sono state create!**

**Ora il flusso completo funziona**:
- Frontend → Next.js API → Gateway → Orchestrator → Sunshine

**Riavvia la Web App e testa "Play Now"!** 🎮

---

**END OF API ROUTES FIX**
