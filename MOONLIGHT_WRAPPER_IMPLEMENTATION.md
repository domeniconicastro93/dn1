# 🎮 MOONLIGHT WRAPPER SERVICE - IMPLEMENTAZIONE

**Data**: 09 Dicembre 2025, 21:43  
**Per**: Antigravity Locale - Strike Cloud Gaming

---

## ✅ STATO ATTUALE

- ✅ Apollo configurato e funzionante sulla VM
- ✅ Pairing Moonlight completato con successo
- ✅ Streaming testato e funzionante
- ✅ Capcom Arcade Stadium fixato

**IP VM**: `20.31.130.73`  
**Porta Moonlight**: `47989`  
**Porta Web UI**: `47990`

---

## 🎯 OBIETTIVO

Creare un **Moonlight Wrapper Service** che:
1. Espone API REST semplici per Orchestrator
2. Gestisce connessione Moonlight ad Apollo
3. Inoltra WebRTC offer/answer al Frontend
4. Gestisce lancio giochi e streaming

---

## 📦 ARCHITETTURA

```
Strike Frontend (Browser)
    ↓ WebSocket (Socket.IO)
Orchestrator Service
    ↓ HTTP REST
Moonlight Wrapper Service ← NUOVO!
    ↓ Moonlight Protocol (porta 47989)
Apollo (VM Azure)
    ↓ WebRTC (porte 47998-48010)
Strike Frontend (Video Stream)
```

---

## 🔧 STEP 1: Crea Nuovo Service

### 1.1 Crea Directory

```bash
cd services
mkdir moonlight-wrapper-service
cd moonlight-wrapper-service
```

### 1.2 Inizializza Progetto

```bash
pnpm init
```

### 1.3 Installa Dipendenze

```bash
pnpm add fastify @fastify/cors
pnpm add -D typescript @types/node tsx
```

### 1.4 Crea tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 📝 STEP 2: Implementa Moonlight Client

### 2.1 Crea src/moonlight/client.ts

```typescript
import { EventEmitter } from 'events';

export interface MoonlightConfig {
    host: string;
    port: number;
}

export interface App {
    id: string;
    name: string;
}

export class MoonlightClient extends EventEmitter {
    private host: string;
    private port: number;
    private connected: boolean = false;

    constructor(config: MoonlightConfig) {
        super();
        this.host = config.host;
        this.port = config.port;
    }

    /**
     * Connect to Apollo server
     */
    async connect(): Promise<void> {
        console.log(`[Moonlight] Connecting to ${this.host}:${this.port}...`);
        
        // TODO: Implement Moonlight handshake protocol
        // For now, we'll use a placeholder
        
        this.connected = true;
        console.log('[Moonlight] Connected successfully');
    }

    /**
     * Get list of available apps
     */
    async getApps(): Promise<App[]> {
        if (!this.connected) {
            throw new Error('Not connected to Apollo');
        }

        // TODO: Implement Moonlight app list protocol
        // For now, return hardcoded list
        
        return [
            { id: 'desktop', name: 'Desktop' },
            { id: 'steam', name: 'Steam Big Picture' },
            { id: 'capcom', name: 'Capcom Arcade Stadium' },
        ];
    }

    /**
     * Launch an app
     */
    async launchApp(appId: string): Promise<void> {
        if (!this.connected) {
            throw new Error('Not connected to Apollo');
        }

        console.log(`[Moonlight] Launching app: ${appId}`);
        
        // TODO: Implement Moonlight launch protocol
        
        this.emit('app-launched', { appId });
    }

    /**
     * Get WebRTC offer from Apollo
     */
    async getWebRTCOffer(): Promise<string> {
        if (!this.connected) {
            throw new Error('Not connected to Apollo');
        }

        // TODO: Implement WebRTC negotiation
        
        return 'sdp-offer-placeholder';
    }

    /**
     * Send WebRTC answer to Apollo
     */
    async sendWebRTCAnswer(answer: string): Promise<void> {
        if (!this.connected) {
            throw new Error('Not connected to Apollo');
        }

        console.log('[Moonlight] Sending WebRTC answer');
        
        // TODO: Implement WebRTC answer protocol
    }

    /**
     * Disconnect from Apollo
     */
    async disconnect(): Promise<void> {
        console.log('[Moonlight] Disconnecting...');
        this.connected = false;
    }
}
```

---

## 🌐 STEP 3: Crea API REST Server

### 3.1 Crea src/server.ts

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MoonlightClient } from './moonlight/client';

const fastify = Fastify({
    logger: true,
});

// Enable CORS
fastify.register(cors, {
    origin: '*',
});

// Moonlight client instance
const apolloClient = new MoonlightClient({
    host: '20.31.130.73',
    port: 47989,
});

// Health check
fastify.get('/health', async () => {
    return { status: 'ok', service: 'moonlight-wrapper' };
});

// Connect to Apollo
fastify.post('/api/connect', async (request, reply) => {
    try {
        await apolloClient.connect();
        return { success: true, message: 'Connected to Apollo' };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

// Get available apps
fastify.get('/api/apps', async (request, reply) => {
    try {
        const apps = await apolloClient.getApps();
        return { success: true, apps };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

// Launch app
fastify.post<{ Querystring: { app: string } }>('/api/launch', async (request, reply) => {
    const { app } = request.query;
    
    if (!app) {
        reply.code(400);
        return { success: false, error: 'App ID required' };
    }

    try {
        await apolloClient.launchApp(app);
        const offer = await apolloClient.getWebRTCOffer();
        
        return {
            success: true,
            message: `Launched ${app}`,
            webrtc: { offer },
        };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

// WebRTC answer
fastify.post<{ Body: { answer: string } }>('/api/webrtc/answer', async (request, reply) => {
    const { answer } = request.body;
    
    if (!answer) {
        reply.code(400);
        return { success: false, error: 'Answer required' };
    }

    try {
        await apolloClient.sendWebRTCAnswer(answer);
        return { success: true };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

// Start server
const start = async () => {
    try {
        await fastify.listen({ port: 3013, host: '0.0.0.0' });
        console.log('🚀 Moonlight Wrapper Service running on port 3013');
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
```

---

## 🧪 STEP 4: Test il Service

### 4.1 Crea package.json scripts

```json
{
  "name": "moonlight-wrapper-service",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### 4.2 Avvia il service

```bash
pnpm dev
```

### 4.3 Test endpoints

```bash
# Health check
curl http://localhost:3013/health

# Connect to Apollo
curl -X POST http://localhost:3013/api/connect

# Get apps
curl http://localhost:3013/api/apps

# Launch app
curl -X POST "http://localhost:3013/api/launch?app=capcom"
```

---

## 🔗 STEP 5: Integra con Orchestrator

### 5.1 Modifica Orchestrator Service

```typescript
// services/orchestrator-service/src/apollo/client.ts

export async function launchGame(gameName: string) {
    const response = await fetch('http://localhost:3013/api/launch?app=' + gameName, {
        method: 'POST',
    });
    
    const result = await response.json();
    
    if (!result.success) {
        throw new Error(result.error);
    }
    
    return result.webrtc.offer;
}
```

### 5.2 Crea endpoint Orchestrator

```typescript
// services/orchestrator-service/src/routes/streaming.ts

import { launchGame } from '../apollo/client';

fastify.post('/api/streaming/launch', async (request, reply) => {
    const { gameName } = request.body;
    
    try {
        const offer = await launchGame(gameName);
        
        return {
            success: true,
            offer,
        };
    } catch (error: any) {
        reply.code(500);
        return {
            success: false,
            error: error.message,
        };
    }
});
```

---

## ⚠️ IMPORTANTE: Moonlight Protocol

Il codice sopra è un **SKELETON** - i metodi Moonlight sono placeholder!

Per implementare il protocollo Moonlight completo, hai 3 opzioni:

### OPZIONE A: Usa libreria esistente
Cerca su npm: `moonlight-protocol`, `moonlight-client`, ecc.

### OPZIONE B: Implementa protocollo manualmente
Segui la documentazione: https://github.com/moonlight-stream/moonlight-docs

### OPZIONE C: Usa Moonlight Desktop come proxy
Controlla Moonlight Desktop via CLI/API

---

## 🎯 PROSSIMI STEP

1. **Crea skeleton** del Moonlight Wrapper Service
2. **Testa** che gli endpoint funzionano
3. **Implementa** protocollo Moonlight (scegli opzione A/B/C)
4. **Integra** con Orchestrator
5. **Test end-to-end** con Strike Frontend

---

**Quando hai creato lo skeleton, dimmi e procediamo con l'implementazione del protocollo!** 🚀

**Creato**: 09 Dicembre 2025, 21:43  
**Per**: Strike Cloud Gaming
