# 🎯 SOLUZIONE FINALE PER STRIKE + APOLLO

**Data**: 09 Dicembre 2025, 21:16  
**Status**: SOLUZIONE DEFINITIVA

---

## ❌ CONFERMA: Apollo NON ha API HTTP complete

Apollo/Sunshine **NON espone**:
- ❌ Endpoint per lanciare giochi via HTTP
- ❌ Endpoint per ottenere WebRTC offer/answer via HTTP
- ❌ API REST per gestire streaming

**Devi usare protocollo Moonlight (porta 47989)**

---

## ✅ SOLUZIONE CONSIGLIATA PER STRIKE

### OPZIONE 1: Moonlight Protocol Wrapper (CONSIGLIATO)

Crea un **wrapper service** che implementa il protocollo Moonlight:

```
Strike Frontend
    ↓ HTTP/WebSocket
Orchestrator Service
    ↓ HTTP
Moonlight Wrapper Service (nuovo!)
    ↓ Moonlight Protocol
Apollo (VM)
    ↓ WebRTC
Strike Frontend
```

**Moonlight Wrapper Service**:
- Espone API REST semplici
- Internamente usa protocollo Moonlight
- Gestisce connessione ad Apollo
- Inoltra WebRTC offer/answer

**Vantaggi**:
- ✅ Orchestrator usa semplici HTTP API
- ✅ Complessità Moonlight isolata
- ✅ Riutilizzabile per altri progetti

---

### OPZIONE 2: Usa Moonlight Desktop come Proxy

Usa **Moonlight Desktop** come intermediario:

```
Strike Frontend
    ↓ HTTP
Orchestrator Service
    ↓ Controlla Moonlight Desktop (via CLI/API)
Moonlight Desktop
    ↓ Moonlight Protocol
Apollo (VM)
    ↓ WebRTC
Strike Frontend (cattura stream da Moonlight)
```

**Come**:
1. Moonlight Desktop si connette ad Apollo
2. Orchestrator controlla Moonlight via CLI
3. Catturi lo stream da Moonlight
4. Lo inoltri al Frontend

**Problema**: Complesso e hacky

---

### OPZIONE 3: Implementa Moonlight Protocol Direttamente

Implementa il protocollo Moonlight nel Orchestrator:

```typescript
// Pseudo-codice
class MoonlightClient {
    async connect(host: string, port: number) {
        // Handshake Moonlight
    }
    
    async getApps() {
        // Richiesta lista app
    }
    
    async launchApp(appId: string) {
        // Comando launch
    }
    
    async getWebRTCOffer() {
        // Negoziazione WebRTC
    }
}
```

**Problema**: Protocollo complesso, richiede tempo

---

## 🎯 MIA RACCOMANDAZIONE FINALE

### Per Strike Cloud Gaming:

**FASE 1: Proof of Concept (ORA)**
1. ✅ Configura app via Web UI
2. ✅ Testa con Moonlight Desktop
3. ✅ Verifica che tutto funziona

**FASE 2: MVP (DOPO)**
1. Crea **Moonlight Wrapper Service** (Node.js)
2. Usa libreria esistente o implementa protocollo base
3. Esponi API REST semplici:
   ```
   POST /launch?app=CapcomArcadeStadium
   GET /webrtc/offer
   POST /webrtc/answer
   ```

**FASE 3: Produzione**
1. Ottimizza Moonlight Wrapper
2. Gestisci multiple sessioni
3. Monitoring e error handling

---

## 📚 LIBRERIE MOONLIGHT DISPONIBILI

### JavaScript/TypeScript

**1. moonlight-protocol (community)**
```bash
npm install moonlight-protocol
```
Status: ⚠️ Non mantenuto, incompleto

**2. Implementazione custom**
Basata su: https://github.com/moonlight-stream/moonlight-docs

**3. Wrapper su Moonlight Desktop**
Usa CLI di Moonlight Desktop

---

## 🔧 MOONLIGHT WRAPPER SERVICE - ESEMPIO

```typescript
// moonlight-wrapper-service/src/index.ts

import Fastify from 'fastify';
import { MoonlightClient } from './moonlight-client';

const fastify = Fastify();
const apollo = new MoonlightClient('20.31.130.73', 47989);

// Endpoint: Launch game
fastify.post('/api/launch', async (request, reply) => {
    const { app } = request.query;
    
    await apollo.connect();
    await apollo.launchApp(app);
    
    const offer = await apollo.getWebRTCOffer();
    
    return {
        success: true,
        offer: offer,
    };
});

// Endpoint: WebRTC answer
fastify.post('/api/webrtc/answer', async (request, reply) => {
    const { answer } = request.body;
    
    await apollo.sendWebRTCAnswer(answer);
    
    return { success: true };
});

fastify.listen({ port: 3013 });
```

**Orchestrator usa questo wrapper**:
```typescript
// services/orchestrator-service/src/apollo/client.ts

export async function launchGame(gameName: string) {
    const response = await fetch('http://localhost:3013/api/launch?app=' + gameName);
    const { offer } = await response.json();
    
    return offer; // Invia al Frontend via Socket.IO
}
```

---

## 🎮 ARCHITETTURA FINALE CONSIGLIATA

```
┌─────────────────────┐
│  Strike Frontend    │
│   (Browser)         │
└──────────┬──────────┘
           │ HTTP/WebSocket
           ↓
┌─────────────────────┐
│  Orchestrator       │
│   Service           │
└──────────┬──────────┘
           │ HTTP (semplice!)
           ↓
┌─────────────────────┐
│  Moonlight Wrapper  │ ← NUOVO!
│   Service           │
└──────────┬──────────┘
           │ Moonlight Protocol
           ↓
┌─────────────────────┐
│  Apollo (VM)        │
└──────────┬──────────┘
           │ WebRTC
           ↓
┌─────────────────────┐
│  Strike Frontend    │
│  (Video Stream)     │
└─────────────────────┘
```

---

## ✅ PROSSIMI STEP

### STEP 1: Configurazione (ORA)
1. Configura app via Web UI
2. Testa con Moonlight Desktop
3. Verifica streaming funziona

### STEP 2: Moonlight Wrapper (DOPO)
1. Crea nuovo service: `moonlight-wrapper-service`
2. Implementa protocollo Moonlight base
3. Esponi API REST semplici

### STEP 3: Integrazione
1. Orchestrator chiama Moonlight Wrapper
2. Frontend riceve WebRTC offer
3. Test end-to-end

---

## 📞 DOMANDA PER TE

**Vuoi che ti aiuti a**:

1. **Configurare Web UI ora** (quick win)
2. **Creare Moonlight Wrapper skeleton** (struttura base)
3. **Trovare librerie Moonlight** (ricerca approfondita)

**Quale preferisci?** 🚀

---

**Creato**: 09 Dicembre 2025, 21:16  
**Status**: Soluzione definitiva proposta
