# SOLUZIONE FINALE - MOONLIGHT PROTOCOL
## La Strada Corretta per Lanciare i Giochi

**Data**: 2025-12-05 15:40
**Status**: ✅ SOLUZIONE IDENTIFICATA

---

## 🎯 SCOPERTA CRUCIALE

**Sunshine NON ha un endpoint REST API per lanciare i giochi!**

Il lancio dei giochi avviene tramite il **protocollo Moonlight** (client-server), non tramite chiamate REST API.

---

## 📊 COME FUNZIONA SUNSHINE

```
┌─────────────┐         Moonlight Protocol        ┌──────────┐
│  Moonlight  │◄──────────────────────────────────►│ Sunshine │
│   Client    │    (WebRTC + Control Messages)     │  Server  │
└─────────────┘                                    └──────────┘
       │                                                 │
       │  1. Connect & Pair                             │
       │  2. Get App List                               │
       │  3. Select App (index: 1 = Steam)              │
       │  4. Start Stream                               │
       │                                                 │
       └─────────────────────────────────────────────────┘
                    Sunshine Launches Game
                    and Streams Video/Audio
```

---

## ✅ ARCHITETTURA CORRETTA

### Frontend (apps/web)

```typescript
// GameDetailPage.tsx
const handlePlay = async () => {
  // 1. Create session
  const response = await fetch('/api/play/start', {
    method: 'POST',
    body: JSON.stringify({
      gameId: game.id,
      steamAppId: game.steamAppId,
    }),
  });

  const { sessionId, sunshineHost, sunshinePort, appIndex } = await response.json();

  // 2. Navigate to play page
  router.push(`/play/${sessionId}`);
};
```

### Orchestrator Service

```typescript
// session-manager.ts
async startSession(userId: string, gameId: string, steamAppId: string) {
  // 1. Create session in database
  const session = await prisma.session.create({
    data: {
      userId,
      gameId,
      status: 'STARTING',
    },
  });

  // 2. Return Sunshine connection info
  return {
    sessionId: session.id,
    sunshineHost: '20.31.130.73',
    sunshinePort: 47985,
    appIndex: 1, // Steam app
    streamUrl: `https://20.31.130.73:47985`,
  };
}
```

### Moonlight Client (apps/web/components/MoonlightClient.tsx)

```typescript
// MoonlightClient.tsx
useEffect(() => {
  const startStream = async () => {
    // 1. Connect to Sunshine
    const connection = new MoonlightConnection({
      host: sunshineHost,
      port: sunshinePort,
    });

    // 2. Pair (if needed)
    await connection.pair();

    // 3. Launch app
    await connection.launchApp(appIndex);

    // 4. Start WebRTC stream
    await connection.startStream();
  };

  startStream();
}, [sunshineHost, sunshinePort, appIndex]);
```

---

## 🔧 COSA ABBIAMO SCOPERTO

### ✅ Informazioni Utili

1. **App Configurate in Sunshine**:
   - Index 0: **Desktop**
   - Index 1: **Steam**

2. **Connessione Funzionante**:
   - Host: `20.31.130.73`
   - Port: `47985`
   - HTTPS: ✅
   - Basic Auth: ✅ (username: `strike`, password: `Nosmoking93!!`)

3. **API REST Disponibili**:
   - `GET /api/apps` → Lista app (✅ funziona)
   - `GET /api/config` → Configurazione (✅ funziona)
   - `POST /api/apps` → Salva app
   - ❌ **NON esiste** `/api/launch` per lanciare via REST

---

## 🚀 PROSSIMI PASSI

### 1. Aggiorna SessionManager

Modifica `services/orchestrator-service/src/core/session-manager.ts`:

```typescript
async startSession(request: StartSessionRequest) {
  // Create session
  const session = await this.createSession(request);

  // Return Sunshine connection info (NO game launch via API!)
  return {
    sessionId: session.id,
    status: 'READY',
    sunshineHost: process.env.SUNSHINE_URL || '20.31.130.73',
    sunshinePort: parseInt(process.env.SUNSHINE_PORT || '47985', 10),
    appIndex: 1, // Steam
    useHttps: true,
    streamUrl: `https://20.31.130.73:47985`,
  };
}
```

### 2. Aggiorna Frontend API Routes

Modifica `apps/web/app/api/play/start/route.ts`:

```typescript
export async function POST(request: NextRequest) {
  const token = await getAccessToken();
  const body = await request.json();

  const response = await fetch(`${gatewayUrl}/api/play/start`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  
  // data now includes: sessionId, sunshineHost, sunshinePort, appIndex
  return NextResponse.json(data);
}
```

### 3. Aggiorna MoonlightClient

Il componente `MoonlightClient.tsx` già esiste e dovrebbe:
- Ricevere `sunshineHost`, `sunshinePort`, `appIndex`
- Connettersi a Sunshine
- Lanciare l'app tramite protocollo Moonlight
- Avviare lo stream WebRTC

---

## 📝 RIEPILOGO

### ❌ Approccio Sbagliato (Quello che abbiamo provato)
```
Frontend → API REST → Sunshine /api/launch → Game Launch
```

### ✅ Approccio Corretto
```
Frontend → Orchestrator → Return Sunshine Info → MoonlightClient → Moonlight Protocol → Sunshine → Game Launch
```

---

## 🎯 CONCLUSIONE

**Non serve lanciare i giochi via API REST!**

Il flusso corretto è:
1. ✅ Orchestrator crea la sessione
2. ✅ Orchestrator restituisce info Sunshine
3. ✅ Frontend usa MoonlightClient
4. ✅ MoonlightClient usa protocollo Moonlight
5. ✅ Sunshine lancia il gioco e streama

---

**Il MoonlightClient che abbiamo già implementato è la soluzione corretta!** 🎉

**PROSSIMO STEP**: Aggiornare SessionManager per restituire le info Sunshine invece di provare a lanciare via API.
