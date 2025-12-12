# Moonlight Wrapper - Implementazione Semplificata

## 🎯 Approccio Finale

Dato che:
- ❌ Non esiste libreria npm per Moonlight
- ❌ Wrappare librerie C è complesso su Windows
- ✅ Moonlight Desktop è già disponibile e funzionante

**Usiamo Moonlight Desktop come processo esterno.**

---

## 🏗️ Architettura

```
Strike Frontend (Browser)
    ↓ WebSocket (Socket.IO)
Orchestrator Service
    ↓ HTTP REST
Moonlight Wrapper Service
    ↓ Child Process (spawn)
Moonlight Desktop (headless mode)
    ↓ Moonlight Protocol
Apollo (VM - 20.31.130.73:47989)
```

---

## 📋 Implementazione

### **1. Moonlight Wrapper Service**

Gestisce:
- Avvio Moonlight Desktop in modalità headless
- Cattura stream video/audio
- Conversione a WebRTC
- Inoltro a Strike Frontend

### **2. Moonlight Desktop**

- Download: https://moonlight-stream.org/
- Supporta modalità headless
- Gestisce tutto il protocollo Moonlight
- Output: stream video H.264

### **3. FFmpeg**

- Cattura stream da Moonlight
- Converte a WebRTC
- Inoltra a browser

---

## 🚀 Prossimi Step

### **STEP 1: Test Moonlight Desktop**
1. Download Moonlight Desktop
2. Configura server: `20.31.130.73:47989`
3. Testa connessione e streaming
4. Verifica qualità stream

### **STEP 2: Implementa Wrapper**
1. Crea script per avviare Moonlight headless
2. Cattura stream con FFmpeg
3. Converti a WebRTC
4. Testa end-to-end

### **STEP 3: Integra con Orchestrator**
1. Esponi API REST
2. Gestisci sessioni multiple
3. Cleanup risorse

---

## ⚠️ LIMITAZIONI

- **Dipendenza esterna**: Richiede Moonlight Desktop installato
- **Performance**: Overhead di conversione stream
- **Scalabilità**: Un processo per sessione

---

## 💡 ALTERNATIVA: WEBRTC NATIVO (FUTURO)

Per produzione, considera di sostituire Apollo con server WebRTC custom:

```
Strike Frontend
    ↓ WebRTC (nativo)
Custom WebRTC Server
    ↓ FFmpeg
Game Process
```

**Vantaggi:**
- ✅ Nessuna dipendenza esterna
- ✅ Controllo totale
- ✅ Ottimizzabile
- ✅ Browser-native

**Tempo:** 2-4 mesi

---

## 📞 DECISIONE

**Domenico, cosa preferisci?**

1. ✅ **Moonlight Desktop wrapper** (MVP veloce, 1-2 settimane)
2. ⏳ **WebRTC nativo custom** (produzione, 2-4 mesi)

Per MVP, consiglio **Opzione 1**.
Per produzione, pianifica migrazione a **Opzione 2**.
