# 🔧 FIX SDP BUNDLE - WERIFT WEBRTC

## ❌ PROBLEMA ORIGINALE

**Errore Browser:**
```
Failed to execute 'setRemoteDescription' on 'RTCPeerConnection': 
Failed to set remote offer sdp: max-bundle configured but session 
description has no BUNDLE group
```

**Causa:**
Il server werift generava un'offerta SDP senza il gruppo BUNDLE perché:
1. Nessun transceiver/track era aggiunto PRIMA di `createOffer()`
2. werift richiede almeno un media track per generare BUNDLE group

---

## ✅ SOLUZIONE APPLICATA

### **Modifiche in `webrtc-peer.ts`:**

#### **PRIMA (SBAGLIATO):**
```typescript
async createOffer(): Promise<any> {
    // ❌ Nessun track aggiunto prima di createOffer()
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    return offer;
}
```

**Risultato SDP:**
```
v=0
o=- ...
s=-
t=0 0
m=application 9 UDP/DTLS/SCTP webrtc-datachannel
// ❌ MANCA: a=group:BUNDLE
```

#### **DOPO (CORRETTO):**
```typescript
async createOffer(): Promise<any> {
    // ✅ CRITICAL FIX: Crea video track PRIMA di createOffer()
    this.videoTrack = new MediaStreamTrack({ kind: 'video' });

    // ✅ Aggiungi transceiver con direzione sendonly
    const transceiver = this.peerConnection.addTransceiver(this.videoTrack, {
        direction: 'sendonly'
    });

    console.log('[WebRTCPeer] Video transceiver added:', transceiver.mid);

    // Ora createOffer() genererà SDP con BUNDLE group
    const offer = await this.peerConnection.createOffer();
    await this.peerConnection.setLocalDescription(offer);
    
    return offer;
}
```

**Risultato SDP Atteso:**
```
v=0
o=- ...
s=-
t=0 0
a=group:BUNDLE 0          ✅ BUNDLE group presente!
m=video 9 UDP/TLS/RTP/SAVPF 96
a=mid:0
a=sendonly
a=rtcp-mux
a=rtpmap:96 H264/90000
```

---

## 🎯 CAMBIAMENTI CHIAVE

### **1. Import MediaStreamTrack:**
```typescript
import { RTCPeerConnection, MediaStreamTrack } from 'werift';
```

### **2. Crea Track PRIMA di createOffer():**
```typescript
this.videoTrack = new MediaStreamTrack({ kind: 'video' });
```

### **3. Aggiungi Transceiver con sendonly:**
```typescript
const transceiver = this.peerConnection.addTransceiver(this.videoTrack, {
    direction: 'sendonly'
});
```

### **4. Mantieni bundlePolicy:**
```typescript
new RTCPeerConnection({
    iceServers: [...],
    bundlePolicy: 'max-bundle',  // ✅ Ora funziona!
});
```

---

## 📊 FLUSSO CORRETTO

### **Server (werift):**
```
1. new RTCPeerConnection({ bundlePolicy: 'max-bundle' })
2. new MediaStreamTrack({ kind: 'video' })
3. pc.addTransceiver(videoTrack, { direction: 'sendonly' })
4. offer = pc.createOffer()
   ↓
   SDP contiene: a=group:BUNDLE 0
5. pc.setLocalDescription(offer)
6. Invia offer al client
```

### **Client (browser):**
```
1. Riceve offer da server
2. pc.setRemoteDescription(offer)
   ✅ SUCCESSO! BUNDLE group presente
3. answer = pc.createAnswer()
4. pc.setLocalDescription(answer)
5. Invia answer al server
```

---

## 🧪 COME TESTARE

### **1. Il servizio si riavvia automaticamente (tsx watch)**

Controlla la finestra "Strike WebRTC Streaming":
```
[WebRTCPeer] Creating video track...
[WebRTCPeer] Video transceiver added: 0
[WebRTCPeer] ✅ Created offer with BUNDLE group
[WebRTCPeer] SDP: v=0\r\no=- ... a=group:BUNDLE 0 ...
```

### **2. Apri browser:**
```
http://localhost:3005/it/test-stream
```

### **3. Verifica Console Browser (F12):**

**PRIMA (errore):**
```
❌ DOMException: Failed to set remote offer sdp: max-bundle configured 
   but session description has no BUNDLE group
```

**DOPO (successo):**
```
✅ [WebRTC] Received offer from server
✅ [WebRTC] Set remote description
✅ [WebRTC] Created answer
✅ [WebRTC] Connection state: connected
```

### **4. Verifica SDP nell'offerta:**

In console browser, l'offerta ricevuta dovrebbe contenere:
```javascript
{
  type: "offer",
  sdp: "v=0\r\n...a=group:BUNDLE 0\r\nm=video 9 UDP/TLS/RTP/SAVPF..."
}
```

---

## 🎉 RISULTATO ATTESO

### **Browser:**
- ✅ Nessun errore "BUNDLE group"
- ✅ setRemoteDescription() ha successo
- ✅ Connessione WebRTC si stabilisce
- ✅ ICE candidates scambiati
- ✅ Connection state: "connected"

### **Server:**
- ✅ Offerta SDP contiene `a=group:BUNDLE 0`
- ✅ Video transceiver presente
- ✅ FFmpeg si avvia quando connesso
- ✅ Nessun errore di signaling

---

## 📝 NOTE TECNICHE

### **Perché werift richiede questo?**

werift (a differenza di wrtc) non crea automaticamente transceivers. Devi:
1. Creare esplicitamente MediaStreamTrack
2. Aggiungerlo con addTransceiver()
3. PRIMA di chiamare createOffer()

### **Differenza con browser WebRTC:**

| Azione | Browser | werift |
|--------|---------|--------|
| Auto-create transceiver | ✅ Sì | ❌ No |
| Richiede track prima di offer | ❌ No | ✅ Sì |
| BUNDLE group automatico | ✅ Sì | ⚠️ Solo se ha track |

### **Bundle Policy:**

- `max-bundle`: Tutti i media su una singola connessione (migliore per gaming)
- `max-compat`: Media separati (più compatibile ma più latenza)
- `balanced`: Compromesso

Per Strike usiamo `max-bundle` per latenza minima.

---

## 🚀 PROSSIMI STEP

1. ✅ **Fix applicato** - Il servizio si riavvia automaticamente
2. ⏳ **Aspetta 5-10 secondi** - tsx watch ricompila
3. 🧪 **Testa** - Apri `http://localhost:3005/it/test-stream`
4. ✅ **Verifica** - Nessun errore BUNDLE, connessione stabilita

---

## 🔍 DEBUG

Se l'errore persiste:

1. **Verifica che il servizio sia riavviato:**
   ```powershell
   # Cerca "Video transceiver added" nei log
   ```

2. **Controlla SDP in console browser:**
   ```javascript
   // Dovrebbe contenere:
   a=group:BUNDLE 0
   m=video 9 UDP/TLS/RTP/SAVPF 96
   ```

3. **Se ancora fallisce:**
   - Ferma tutto: `.\stop-all.bat`
   - Riavvia: `.\start-all.bat`
   - Riprova

---

**Data Fix**: 11 Dicembre 2025, 21:30  
**Status**: ✅ APPLICATO - In attesa di test
