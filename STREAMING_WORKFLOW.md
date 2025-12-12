# 🎮 APOLLO STREAMING WORKFLOW - SPIEGAZIONE COMPLETA

**Data**: 09 Dicembre 2025, 20:54  
**Per**: Strike Cloud Gaming

---

## ❗ CONCETTO CHIAVE

**Apollo NON usa API REST per lo streaming!**

Apollo implementa il **protocollo Moonlight**, che funziona così:

```
Client (Strike) ←→ Moonlight Protocol ←→ Apollo (VM)
                    ↓
                 WebRTC Stream
```

---

## 🔄 FLUSSO COMPLETO

### 1️⃣ CONFIGURAZIONE (Web UI) - UNA VOLTA

✅ Fatto via Web UI:
- Login con strike / Nosmoking93!!
- Configurare applicazioni (Desktop, Steam, giochi)
- Salvare configurazione

**Questo NON crea credenziali per API!**

---

### 2️⃣ CONNESSIONE STREAMING (Moonlight Protocol)

**NON usi**:
- ❌ `/api/apps/launch`
- ❌ HTTP Basic Auth
- ❌ REST API

**USI**:
- ✅ **Moonlight Protocol** (porta 47989)
- ✅ **WebRTC** (porte 47998-48010)

---

## 🎯 COME LANCIARE UN GIOCO

### Opzione A: Moonlight Client Library

Usa una libreria Moonlight esistente:

```typescript
import { MoonlightClient } from 'moonlight-client'; // Esempio

const client = new MoonlightClient({
    host: '20.31.130.73',
    port: 47989,
});

// 1. Connetti
await client.connect();

// 2. Lista app disponibili
const apps = await client.getApps();
console.log(apps); // ['Desktop', 'Steam Big Picture', 'Capcom Arcade Stadium']

// 3. Lancia app
await client.launchApp('Capcom Arcade Stadium');

// 4. Ottieni stream WebRTC
const stream = await client.getStream();

// 5. Usa stream nel browser
videoElement.srcObject = stream;
```

---

### Opzione B: Implementazione Custom

Se non usi libreria, devi implementare:

1. **Handshake Moonlight** (porta 47989)
2. **Richiesta lista app**
3. **Comando launch app**
4. **Negoziazione WebRTC**
5. **Ricezione stream**

**Questo è complesso!** Ti consiglio Opzione A.

---

## 📚 LIBRERIE DISPONIBILI

### Node.js / TypeScript

**1. moonlight-stream (ufficiale)**
```bash
# Non disponibile su npm, devi compilare da sorgenti
git clone https://github.com/moonlight-stream/moonlight-common-c
```

**2. node-moonlight (community)**
```bash
npm install node-moonlight
```

**3. Implementazione custom**
Segui la documentazione del protocollo Moonlight.

---

## 🎮 ALTERNATIVA: Usa Moonlight Client Esistente

**Per testing rapido**:

1. **Installa Moonlight** sul PC locale:
   - Download: https://moonlight-stream.org/
   
2. **Aggiungi server**:
   - IP: `20.31.130.73`
   - Porta: 47989

3. **Connetti e testa**:
   - Moonlight si connette ad Apollo
   - Vedi lista app
   - Lanci gioco
   - Stream funziona

4. **Poi implementi lo stesso nel codice Strike**

---

## 🔧 PER STRIKE CLOUD GAMING

### Architettura Consigliata

```
┌─────────────────┐
│  Strike Web UI  │
│   (Browser)     │
└────────┬────────┘
         │ HTTP/WebSocket
         ↓
┌─────────────────┐
│  Orchestrator   │
│   Service       │
└────────┬────────┘
         │ Moonlight Protocol
         ↓
┌─────────────────┐
│  Apollo (VM)    │
│   + Game        │
└────────┬────────┘
         │ WebRTC
         ↓
┌─────────────────┐
│  Strike Web UI  │
│  (Video Stream) │
└─────────────────┘
```

### Implementazione

**Orchestrator Service**:
```typescript
// services/orchestrator-service/src/apollo/moonlight-client.ts

import { MoonlightClient } from 'node-moonlight';

export class ApolloStreamingService {
    private client: MoonlightClient;

    constructor(host: string) {
        this.client = new MoonlightClient({ host, port: 47989 });
    }

    async connect() {
        await this.client.connect();
    }

    async getAvailableGames() {
        return await this.client.getApps();
    }

    async launchGame(gameName: string) {
        await this.client.launchApp(gameName);
        
        // Ottieni stream WebRTC
        const stream = await this.client.getStream();
        
        return {
            streamUrl: stream.url,
            sessionId: stream.sessionId,
        };
    }

    async stopGame() {
        await this.client.quit();
    }
}
```

**API Endpoint**:
```typescript
// services/orchestrator-service/src/routes/streaming.ts

fastify.post('/api/streaming/launch', async (request, reply) => {
    const { gameName } = request.body;
    
    const apollo = new ApolloStreamingService('20.31.130.73');
    await apollo.connect();
    
    const streamInfo = await apollo.launchGame(gameName);
    
    return {
        success: true,
        streamUrl: streamInfo.streamUrl,
        sessionId: streamInfo.sessionId,
    };
});
```

**Frontend**:
```typescript
// apps/web/components/streaming/GameStream.tsx

const response = await fetch('/api/streaming/launch', {
    method: 'POST',
    body: JSON.stringify({ gameName: 'Capcom Arcade Stadium' }),
});

const { streamUrl } = await response.json();

// Usa streamUrl per WebRTC
const pc = new RTCPeerConnection();
// ... setup WebRTC con streamUrl
```

---

## ⚠️ PROBLEMA: Librerie Moonlight

**Problema**: Non ci sono librerie Moonlight mature per Node.js/TypeScript!

**Soluzioni**:

### 1. Usa Moonlight Desktop come Proxy
- Moonlight Desktop si connette ad Apollo
- Espone stream WebRTC
- Strike si connette a Moonlight Desktop

### 2. Implementa Protocollo Custom
- Studia protocollo Moonlight
- Implementa handshake e comandi
- Gestisci WebRTC direttamente

### 3. Usa Apollo API (limitata)
- Apollo ha alcune API REST
- Ma NON per lanciare giochi
- Solo per configurazione

---

## 🎯 RACCOMANDAZIONE FINALE

**Per Strike Cloud Gaming**:

### FASE 1: Proof of Concept (ORA)
1. ✅ Configura app via Web UI
2. ✅ Testa con Moonlight Desktop client
3. ✅ Verifica che streaming funziona

### FASE 2: Integrazione (DOPO)
1. Trova/crea libreria Moonlight per Node.js
2. Oppure usa Moonlight Desktop come proxy
3. Oppure implementa protocollo custom

---

## 📞 PROSSIMI STEP

1. **Configura app via Web UI** (segui WEB_UI_PAIRING_GUIDE.md)
2. **Testa con Moonlight Desktop**
3. **Dimmi se streaming funziona**
4. **Poi decidiamo come integrare nel codice**

---

**Vuoi che ti aiuti a configurare le app via Web UI ora?** 🚀

**Creato**: 09 Dicembre 2025, 20:54  
**Status**: Waiting for Web UI configuration
