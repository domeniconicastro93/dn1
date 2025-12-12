# Moonlight Protocol Implementation Guide

## 📋 Protocol Overview

Moonlight implements NVIDIA's GameStream protocol with the following components:

### **Ports and Protocols**

| Protocol | Port | Encryption | Purpose |
|----------|------|------------|---------|
| HTTP | 47989 (TCP) | None | Public info, client pairing |
| HTTPS | 47984 (TCP) | SSL | Paired clients only |
| RTSP | 48010 (TCP) | None | Session management, stream settings |
| Control (ENet) | 47999 (UDP) | AES GCM 128-bit | User input, stream info |
| Video (RTP) | 47998 (UDP) | None | H.264/HEVC video |
| Audio (RTP) | 48000 (UDP) | AES CBC 128-bit | Opus audio |

---

## 🔐 Pairing Process

### **Step 1: Discovery**
Client discovers Apollo server on network (we already know IP: `20.31.130.73`)

### **Step 2: Request Pairing**
```
GET http://20.31.130.73:47989/pair?uniqueid=<CLIENT_ID>&devicename=Strike&phrase=getservercert
```

**Response**: Server generates PIN and displays it

### **Step 3: Complete Pairing**
```
GET http://20.31.130.73:47989/pair?uniqueid=<CLIENT_ID>&phrase=pairchallenge&pin=<PIN>
```

**Response**: Server authorizes client and exchanges certificates

### **Step 4: Store Credentials**
Client stores unique key locally for future authenticated sessions

---

## 🎮 Session Flow

### **1. List Applications**
```
GET https://20.31.130.73:47984/applist
Authorization: <client_cert>
```

**Response**: XML list of available apps

### **2. Launch Application**
```
GET https://20.31.130.73:47984/launch?appid=<APP_ID>&mode=<RESOLUTION>x<FPS>
Authorization: <client_cert>
```

**Response**: Session ID

### **3. RTSP Handshake**
```
RTSP SETUP rtsp://20.31.130.73:48010
```

Exchange ports and settings for video/audio/control streams

### **4. Start Streaming**
- Video: RTP over UDP 47998
- Audio: RTP over UDP 48000  
- Control: ENet over UDP 47999

---

## 🚀 Implementation Strategy

### **Phase 1: HTTP Pairing** ✅ (Simple)
Use HTTP endpoints for pairing - **already attempted, needs certificates**

### **Phase 2: HTTPS Session** 🔧 (Medium)
Use HTTPS with client certificates for app list/launch

### **Phase 3: RTSP Setup** 🔧 (Medium)
Implement RTSP protocol for stream negotiation

### **Phase 4: RTP/ENet Streaming** ⚠️ (Complex)
Handle video/audio/control streams

---

## 💡 SIMPLIFIED APPROACH FOR STRIKE

Instead of implementing full Moonlight protocol, we can:

### **Option A: Use Moonlight Desktop as Proxy**
1. Moonlight Desktop handles all protocol complexity
2. We capture WebRTC stream from it
3. Forward to Strike Frontend

### **Option B: Minimal Implementation**
1. Implement only HTTP pairing (simple)
2. Use Apollo's Web UI for app management
3. Connect directly to WebRTC stream (if Apollo exposes it)

### **Option C: Full Implementation** (Current approach)
1. Implement complete Moonlight protocol
2. Full control over streaming
3. Most complex, most flexible

---

## 🎯 RECOMMENDED: Option B (Minimal)

For Strike Cloud Gaming MVP:

1. **Pairing**: Via Web UI (manual, one-time)
2. **App Launch**: Direct HTTP call to Apollo (if possible)
3. **Streaming**: Direct WebRTC connection

**This avoids implementing complex RTSP/RTP/ENet protocols.**

---

## ❓ NEXT STEPS

**Ask Antigravity VM:**

1. Can we launch apps via simple HTTP/HTTPS call after pairing?
2. Does Apollo expose WebRTC offer/answer via HTTP API?
3. Or do we MUST implement full Moonlight protocol?

If we must implement full protocol, we need `moonlight-common-c` bindings or rewrite in TypeScript.
