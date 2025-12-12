# 🚀 OPZIONE D: MOONLIGHT-EMBEDDED WRAPPER

**Data**: 09 Dicembre 2025, 21:58  
**Raccomandazione**: MIGLIORE per Strike MVP

---

## 🎯 ARCHITETTURA

```
Strike Frontend (Browser)
    ↓ WebSocket (Socket.IO)
Orchestrator Service
    ↓ HTTP REST
Moonlight Wrapper Service (Node.js)
    ↓ Child Process / FFI
moonlight-embedded (C binary)
    ↓ Moonlight Protocol
Apollo (VM Azure)
    ↓ WebRTC
Strike Frontend (Video Stream)
```

---

## 📦 STEP 1: Installa moonlight-embedded

### Su Linux (Orchestrator VM):

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y moonlight-embedded

# Verifica installazione
moonlight --version
```

### Su Windows (Development):

```bash
# Scarica da GitHub Releases
# https://github.com/moonlight-stream/moonlight-qt/releases
```

---

## 🔧 STEP 2: Test moonlight-embedded

```bash
# Lista server disponibili
moonlight list 20.31.130.73

# Pair con server
moonlight pair 20.31.130.73

# Inserisci PIN quando richiesto

# Lista app
moonlight list 20.31.130.73

# Lancia app
moonlight stream -app "Capcom Arcade Stadium" 20.31.130.73
```

---

## 💻 STEP 3: Crea Wrapper Node.js

### 3.1 Crea moonlight-wrapper-service

```bash
cd services
mkdir moonlight-wrapper-service
cd moonlight-wrapper-service
pnpm init
```

### 3.2 Installa dipendenze

```bash
pnpm add fastify @fastify/cors
pnpm add -D typescript @types/node tsx
```

### 3.3 Crea src/moonlight/wrapper.ts

```typescript
import { spawn, ChildProcess } from 'child_process';
import { EventEmitter } from 'events';

export interface MoonlightConfig {
    host: string;
    binary?: string; // Path to moonlight binary
}

export class MoonlightWrapper extends EventEmitter {
    private host: string;
    private binary: string;
    private process: ChildProcess | null = null;

    constructor(config: MoonlightConfig) {
        super();
        this.host = config.host;
        this.binary = config.binary || 'moonlight'; // Default to system moonlight
    }

    /**
     * Pair with Apollo server
     */
    async pair(): Promise<string> {
        return new Promise((resolve, reject) => {
            const proc = spawn(this.binary, ['pair', this.host]);
            
            let output = '';
            
            proc.stdout?.on('data', (data) => {
                output += data.toString();
                console.log('[Moonlight]', data.toString());
                
                // Extract PIN from output
                const pinMatch = output.match(/PIN:\s*(\d{4})/);
                if (pinMatch) {
                    resolve(pinMatch[1]);
                }
            });
            
            proc.stderr?.on('data', (data) => {
                console.error('[Moonlight Error]', data.toString());
            });
            
            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Pairing failed with code ${code}`));
                }
            });
        });
    }

    /**
     * Get list of apps
     */
    async getApps(): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const proc = spawn(this.binary, ['list', this.host]);
            
            let output = '';
            
            proc.stdout?.on('data', (data) => {
                output += data.toString();
            });
            
            proc.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Failed to get apps: ${code}`));
                    return;
                }
                
                // Parse app list from output
                const apps = output
                    .split('\n')
                    .filter(line => line.trim())
                    .map(line => line.trim());
                
                resolve(apps);
            });
        });
    }

    /**
     * Launch app and start streaming
     */
    async launchApp(appName: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.process = spawn(this.binary, [
                'stream',
                '-app', appName,
                '-1080',      // 1080p
                '-60fps',     // 60 FPS
                '-bitrate', '10000', // 10 Mbps
                this.host
            ]);
            
            this.process.stdout?.on('data', (data) => {
                console.log('[Moonlight Stream]', data.toString());
                this.emit('stream-data', data);
            });
            
            this.process.stderr?.on('data', (data) => {
                console.error('[Moonlight Stream Error]', data.toString());
            });
            
            this.process.on('close', (code) => {
                console.log('[Moonlight] Stream ended with code', code);
                this.emit('stream-ended', code);
                this.process = null;
            });
            
            // Resolve after process starts
            setTimeout(() => resolve(), 1000);
        });
    }

    /**
     * Stop streaming
     */
    async stop(): Promise<void> {
        if (this.process) {
            this.process.kill('SIGTERM');
            this.process = null;
        }
    }
}
```

### 3.4 Crea src/server.ts

```typescript
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { MoonlightWrapper } from './moonlight/wrapper';

const fastify = Fastify({ logger: true });

fastify.register(cors, { origin: '*' });

const moonlight = new MoonlightWrapper({
    host: '20.31.130.73',
});

// Health check
fastify.get('/health', async () => {
    return { status: 'ok', service: 'moonlight-wrapper' };
});

// Pair with Apollo
fastify.post('/api/pair', async (request, reply) => {
    try {
        const pin = await moonlight.pair();
        return { success: true, pin };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

// Get apps
fastify.get('/api/apps', async (request, reply) => {
    try {
        const apps = await moonlight.getApps();
        return { success: true, apps };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

// Launch app
fastify.post<{ Body: { app: string } }>('/api/launch', async (request, reply) => {
    const { app } = request.body;
    
    if (!app) {
        reply.code(400);
        return { success: false, error: 'App name required' };
    }

    try {
        await moonlight.launchApp(app);
        
        return {
            success: true,
            message: `Launched ${app}`,
            streamUrl: 'rtsp://localhost:47989/stream', // Placeholder
        };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

// Stop streaming
fastify.post('/api/stop', async (request, reply) => {
    try {
        await moonlight.stop();
        return { success: true };
    } catch (error: any) {
        reply.code(500);
        return { success: false, error: error.message };
    }
});

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

## 🧪 STEP 4: Test

```bash
# Avvia service
pnpm dev

# Test pairing
curl -X POST http://localhost:3013/api/pair

# Get apps
curl http://localhost:3013/api/apps

# Launch app
curl -X POST http://localhost:3013/api/launch \
  -H "Content-Type: application/json" \
  -d '{"app":"Capcom Arcade Stadium"}'

# Stop
curl -X POST http://localhost:3013/api/stop
```

---

## 🎯 VANTAGGI OPZIONE D

✅ **Veloce**: 1-2 settimane implementazione  
✅ **Affidabile**: Usa codice battle-tested  
✅ **Scalabile**: Può gestire multiple sessioni  
✅ **Qualità**: Streaming ottimizzato  
✅ **Manutenibile**: Codice semplice  

---

## ⚠️ LIMITAZIONI

- Richiede moonlight-embedded installato sul server
- Streaming va catturato e re-inoltrato al browser
- Non è WebRTC nativo (ma funziona!)

---

## 🚀 PROSSIMI STEP

1. Installa moonlight-embedded
2. Crea wrapper service
3. Test pairing e launch
4. Integra con Orchestrator
5. Cattura stream e inoltra a Frontend

---

**Questa è la soluzione MIGLIORE per Strike MVP!** ⭐

**Creato**: 09 Dicembre 2025, 21:58  
**Raccomandazione**: OPZIONE D per MVP
