# 🚀 APOLLO + WebRTC IMPLEMENTATION PLAN

**Data**: 09 Dicembre 2025, 17:10  
**Obiettivo**: Implementare streaming cloud gaming con Apollo + WebRTC custom

---

## 🎯 OVERVIEW

Sostituiamo NoVNC (VNC-based) con **Apollo + WebRTC** per:
- ✅ Latenza ~20ms (vs ~80ms NoVNC)
- ✅ Qualità video alta (H264 hardware encoding)
- ✅ Virtual display (no monitor fisico)
- ✅ Auto-resolution
- ✅ Self-hosted (no vendor lock-in)

---

## 📋 FASE 1: SETUP APOLLO SULLA VM

### **Step 1.1: Disinstalla Sunshine/TightVNC**

```powershell
# Ferma servizi
Stop-Service -Name "SunshineService"
Stop-Service -Name "tvnserver"

# Disinstalla
# Sunshine: Pannello di Controllo -> Disinstalla
# TightVNC: Pannello di Controllo -> Disinstalla
```

### **Step 1.2: Installa Apollo**

```powershell
# Download Apollo
$url = "https://github.com/LizardByte/Apollo/releases/latest/download/Apollo-Windows.exe"
$output = "C:\Temp\Apollo-Setup.exe"
Invoke-WebRequest -Uri $url -OutFile $output

# Installa
Start-Process $output -Wait

# Apollo si installa in: C:\Program Files\Apollo
```

### **Step 1.3: Configura Apollo**

```powershell
# Apri Apollo Web UI
# http://localhost:47990

# Configurazione:
# 1. Username: strike
# 2. Password: Nosmoking93!!
# 3. Enable Virtual Display: YES
# 4. Resolution: 1920x1080
# 5. Framerate: 60 FPS
# 6. Bitrate: 10000 kbps
```

### **Step 1.4: Aggiungi Steam come App**

```
Apollo Web UI -> Apps -> Add Application
Name: Steam
Command: C:\Program Files (x86)\Steam\steam.exe
Working Directory: C:\Program Files (x86)\Steam
```

### **Step 1.5: Test Apollo Locale**

```powershell
# Installa Artemis (client Apollo)
# Download: https://github.com/LizardByte/Artemis/releases

# Test connessione:
# 1. Apri Artemis
# 2. Connetti a localhost
# 3. Avvia Steam
# 4. Verifica streaming funziona
```

---

## 📋 FASE 2: WEBRTC SIGNALING SERVER

### **Step 2.1: Installa Dipendenze**

```bash
cd services/orchestrator-service
pnpm add wrtc socket.io
```

### **Step 2.2: Crea Signaling Server**

File: `services/orchestrator-service/src/webrtc/signaling-server.ts`

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { FastifyInstance } from 'fastify';

export function setupSignalingServer(fastify: FastifyInstance) {
    const io = new SocketIOServer(fastify.server, {
        cors: { origin: '*' }
    });

    io.on('connection', (socket) => {
        console.log('[Signaling] Client connected:', socket.id);

        // Handle SDP offer from client
        socket.on('offer', async (data) => {
            console.log('[Signaling] Received offer from client');
            // Forward to Apollo
            socket.emit('answer', await getAnswerFromApollo(data));
        });

        // Handle ICE candidates
        socket.on('ice-candidate', (candidate) => {
            console.log('[Signaling] Received ICE candidate');
            // Forward to Apollo
        });

        socket.on('disconnect', () => {
            console.log('[Signaling] Client disconnected');
        });
    });
}
```

### **Step 2.3: Integra Apollo WebRTC**

File: `services/orchestrator-service/src/webrtc/apollo-client.ts`

```typescript
import fetch from 'node-fetch';

export class ApolloClient {
    private host: string;
    private port: number;

    constructor(host: string, port: number = 47990) {
        this.host = host;
        this.port = port;
    }

    async createOffer(sdp: string): Promise<string> {
        // Apollo WebRTC API
        const response = await fetch(
            `https://${this.host}:${this.port}/api/webrtc/offer`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sdp })
            }
        );
        const data = await response.json();
        return data.answer;
    }
}
```

---

## 📋 FASE 3: FRONTEND WEBRTC CLIENT

### **Step 3.1: Crea Componente WebRTC**

File: `apps/web/components/streaming/ApolloWebRTCPlayer.tsx`

```typescript
'use client';

import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export default function ApolloWebRTCPlayer({ sessionId, host, port }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [pc, setPc] = useState<RTCPeerConnection | null>(null);

    useEffect(() => {
        // Connect to signaling server
        const socket = io('http://localhost:3012');

        // Create RTCPeerConnection
        const peerConnection = new RTCPeerConnection({
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        // Handle incoming stream
        peerConnection.ontrack = (event) => {
            if (videoRef.current) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        // Create offer
        peerConnection.createOffer().then((offer) => {
            peerConnection.setLocalDescription(offer);
            socket.emit('offer', { sdp: offer.sdp });
        });

        // Handle answer
        socket.on('answer', (answer) => {
            peerConnection.setRemoteDescription(
                new RTCSessionDescription(answer)
            );
        });

        setPc(peerConnection);

        return () => {
            peerConnection.close();
            socket.disconnect();
        };
    }, []);

    return (
        <div className="relative w-full h-screen">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain"
            />
            {/* Overlay Strike (webcam, chat, friends) */}
        </div>
    );
}
```

### **Step 3.2: Integra in PlayPage**

```typescript
// apps/web/components/play/PlayPage.tsx

import ApolloWebRTCPlayer from '../streaming/ApolloWebRTCPlayer';

// ...

if (session.host && session.port) {
    return (
        <ApolloWebRTCPlayer
            sessionId={session.id}
            host={session.host}
            port={session.port}
        />
    );
}
```

---

## 📋 FASE 4: TEST & OPTIMIZATION

### **Step 4.1: Test End-to-End**

1. Avvia Apollo sulla VM
2. Avvia Orchestrator con signaling server
3. Apri Strike frontend
4. Clicca "Play Now"
5. Verifica stream video

### **Step 4.2: Ottimizzazioni**

```typescript
// Bitrate dinamico
peerConnection.getSenders().forEach((sender) => {
    const parameters = sender.getParameters();
    parameters.encodings[0].maxBitrate = 10000000; // 10 Mbps
    sender.setParameters(parameters);
});

// Latency tuning
videoElement.style.objectFit = 'contain';
videoElement.playsInline = true;
```

---

## 🆘 TROUBLESHOOTING

### Problema: "ICE connection failed"
```
Soluzione: Verifica STUN/TURN server
Aggiungi TURN server se dietro NAT
```

### Problema: "No video stream"
```
Soluzione: Verifica Apollo virtual display attivo
Check Apollo logs
```

### Problema: "High latency"
```
Soluzione: Riduci bitrate
Verifica network quality
```

---

## ✅ CHECKLIST FINALE

- [ ] Apollo installato e configurato sulla VM
- [ ] Virtual display attivo
- [ ] Signaling server funzionante
- [ ] WebRTC client connette
- [ ] Video stream visibile
- [ ] Latenza < 50ms
- [ ] Overlay Strike funzionante

---

## 🎮 READY TO STREAM!

Quando tutto funziona:
- ✅ Latenza ~20ms
- ✅ Qualità 1080p60
- ✅ Virtual display
- ✅ Self-hosted
- ✅ Scalabile

**Strike è pronto per il cloud gaming!** 🚀

---

**Creato da**: Antigravity Locale  
**Data**: 09 Dicembre 2025, 17:10  
**Stato**: PIANO PRONTO - INIZIAMO!
