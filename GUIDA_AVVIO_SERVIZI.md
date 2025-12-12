# 🚀 STRIKE - GUIDA RAPIDA AVVIO SERVIZI

## ✅ SERVIZI INCLUSI

Lo script `start-all.bat` avvia automaticamente **tutti** i servizi necessari:

1. **WebRTC Streaming Service** (porta 3015) - ✨ NUOVO!
2. **Auth Service** (porta 3001)
3. **Game Service** (porta 3003)
4. **Steam Library Service** (porta 3022)
5. **Orchestrator Service** (porta 3012)
6. **Gateway Service** (porta 3000)
7. **Web App** (porta 3005)

---

## 🎯 COMANDI RAPIDI

### **Avviare tutti i servizi:**
```batch
start-all.bat
```

### **Fermare tutti i servizi:**
```batch
stop-all.bat
```

---

## 📊 VERIFICA SERVIZI

Dopo l'avvio, lo script verifica automaticamente che tutti i servizi siano in ascolto sulle porte corrette:

```
[OK] WebRTC Streaming   - http://localhost:3015
[OK] Auth Service        - http://localhost:3001
[OK] Game Service        - http://localhost:3003
[OK] Steam Library       - http://localhost:3022
[OK] Orchestrator Service - http://localhost:3012
[OK] Gateway Service     - http://localhost:3000
[OK] Web App             - http://localhost:3005
```

---

## 🌐 URL PRINCIPALI

### **Frontend:**
- **Homepage**: http://localhost:3005
- **Games**: http://localhost:3005/it/games
- **Test Stream**: http://localhost:3005/it/test-stream ⭐ NUOVO!

### **API Health Checks:**
- **Gateway**: http://localhost:3000/health
- **Orchestrator**: http://localhost:3012/health
- **WebRTC Streaming**: http://localhost:3015/health ⭐ NUOVO!

---

## 🎮 TEST WEBRTC STREAMING

### **Pagina di Test Diretta:**
```
http://localhost:3005/it/test-stream
```

**Cosa aspettarsi:**
1. Pagina si carica con player WebRTC
2. Connessione WebRTC si stabilisce
3. Desktop viene catturato da FFmpeg
4. Stream video appare nel browser

### **Debug Panel:**
Il player mostra informazioni in tempo reale:
- **Session**: ID della sessione
- **Connection**: Stato connessione WebRTC
- **ICE**: Stato ICE connection
- **Streaming**: ✅ Yes quando lo stream è attivo
- **Transport**: WebRTC (RTP/SRTP)

---

## 🔧 TROUBLESHOOTING

### **Servizio non si avvia:**

1. **Verifica porte occupate:**
   ```batch
   netstat -ano | findstr ":3015"
   ```

2. **Ferma tutti i servizi e riavvia:**
   ```batch
   stop-all.bat
   start-all.bat
   ```

### **WebRTC Streaming non funziona:**

1. **Verifica FFmpeg:**
   ```batch
   C:\ffmpeg\bin\ffmpeg.exe -version
   ```

2. **Controlla log del servizio:**
   - Cerca la finestra "Strike WebRTC Streaming"
   - Verifica errori FFmpeg

3. **Test health endpoint:**
   ```batch
   curl http://localhost:3015/health
   ```

### **Stream non visibile nel browser:**

1. **Apri Console Browser** (F12)
2. **Cerca errori WebRTC:**
   ```
   [WebRTC] Connection state: failed
   ```

3. **Verifica codec H.264:**
   - Chrome/Edge: Supporto nativo ✅
   - Firefox: Potrebbe richiedere configurazione

---

## 📝 NOTE IMPORTANTI

### **Ordine di Avvio:**
Lo script avvia i servizi nell'ordine corretto:
1. Prima WebRTC Streaming (necessario per lo streaming)
2. Poi Auth, Game, Steam Library
3. Poi Orchestrator (dipende dagli altri)
4. Poi Gateway (API aggregator)
5. Infine Web App (frontend)

### **Finestre dei Servizi:**
- Servizi backend: Minimizzati automaticamente
- Web App: Finestra visibile per vedere i log

### **Chiusura:**
- Puoi chiudere la finestra di `start-all.bat`
- I servizi continueranno a funzionare in background
- Usa `stop-all.bat` per fermare tutto

---

## 🎉 NOVITÀ WEBRTC

### **Cosa è cambiato:**

❌ **RIMOSSO:**
- Apollo WebRTC Player
- Sunshine integration
- WebSocket streaming
- NoVNC player

✅ **AGGIUNTO:**
- WebRTC Streaming Service (werift)
- Real WebRTC con RTP/SRTP
- FFmpeg desktop capture
- Signaling via HTTP/fetch

### **Vantaggi:**

- ✅ Latenza ultra-bassa (~100-200ms)
- ✅ Qualità 1080p60
- ✅ Nessuna dipendenza esterna (Apollo, Sunshine)
- ✅ Controllo completo del pipeline
- ✅ Scalabile e production-ready

---

## 🚀 QUICK START

```batch
# 1. Avvia tutti i servizi
start-all.bat

# 2. Aspetta che tutti i servizi siano pronti (~30 secondi)

# 3. Apri il browser
http://localhost:3005/it/test-stream

# 4. Verifica che lo stream funzioni

# 5. Quando hai finito, ferma tutto
stop-all.bat
```

---

## 📞 SUPPORTO

**Se qualcosa non funziona:**

1. Controlla che tutte le porte siano libere
2. Verifica che FFmpeg sia installato (`C:\ffmpeg`)
3. Controlla i log delle finestre dei servizi
4. Esegui `stop-all.bat` e poi `start-all.bat`

**File di log:**
- Ogni servizio ha la sua finestra con log in tempo reale
- WebRTC Streaming: Cerca "Strike WebRTC Streaming"

---

**Ultimo aggiornamento**: 11 Dicembre 2025  
**Versione**: 2.0 (con WebRTC Streaming)
