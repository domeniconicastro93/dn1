# 🚀 STRIKE - ISTRUZIONI AVVIO RAPIDO

## ⚠️ IMPORTANTE: COMANDI CORRETTI

### **Da PowerShell (terminale Antigravity):**

```powershell
# Fermare tutti i servizi
.\stop-all.bat

# Avviare tutti i servizi
.\start-all.bat
```

**NOTA**: PowerShell richiede `.\` prima del nome del file batch!

### **Da CMD (Prompt dei comandi):**

```batch
# Fermare tutti i servizi
stop-all.bat

# Avviare tutti i servizi
start-all.bat
```

### **Da Esplora File:**

Doppio click su:
- `start-all.bat` per avviare
- `stop-all.bat` per fermare

---

## 📊 COSA FA start-all.bat

### **Servizi avviati (in ordine):**

1. **WebRTC Streaming Service** (porta 3015) ⭐ NUOVO!
2. **Auth Service** (porta 3001)
3. **Game Service** (porta 3003)
4. **Steam Library Service** (porta 3022)
5. **Orchestrator Service** (porta 3012)
6. **Gateway Service** (porta 3000)
7. **Web App** (porta 3005)

### **Tempo di avvio:**
- ~30-40 secondi per tutti i servizi
- Lo script aspetta automaticamente tra un servizio e l'altro

### **Finestre:**
- Servizi backend: **Minimizzate**
- Web App: **Visibile** (per vedere i log)
- Script start-all: **Visibile** (mostra lo stato)

---

## ✅ VERIFICA SERVIZI

Dopo l'avvio, lo script mostra:

```
[OK] WebRTC Streaming   - http://localhost:3015
[OK] Auth Service        - http://localhost:3001
[OK] Game Service        - http://localhost:3003
[OK] Steam Library       - http://localhost:3022
[OK] Orchestrator Service - http://localhost:3012
[OK] Gateway Service     - http://localhost:3000
[OK] Web App             - http://localhost:3005
```

Se vedi `[WARNING]` per qualche servizio, aspetta altri 10-15 secondi e ricontrolla.

---

## 🌐 URL DA TESTARE

### **Frontend:**
```
http://localhost:3005
http://localhost:3005/it/games
http://localhost:3005/it/test-stream  ⭐ TEST WEBRTC
```

### **API Health:**
```
http://localhost:3000/health  (Gateway)
http://localhost:3012/health  (Orchestrator)
http://localhost:3015/health  (WebRTC Streaming) ⭐ NUOVO
```

---

## 🔧 RISOLUZIONE PROBLEMI

### **Errore: "address already in use"**

**Causa**: Servizi già in esecuzione

**Soluzione**:
```powershell
# Ferma tutto
.\stop-all.bat

# Aspetta 5 secondi

# Riavvia
.\start-all.bat
```

### **Errore: "EADDRINUSE: address already in use 0.0.0.0:3015"**

**Causa**: WebRTC Streaming Service già in esecuzione

**Soluzione**:
```powershell
# Termina tutti i processi Node.js
taskkill /F /IM node.exe

# Riavvia
.\start-all.bat
```

### **Servizio non risponde dopo 30 secondi**

**Possibili cause**:
1. Dipendenze non installate
2. Errori nel codice
3. Porta occupata da altro processo

**Soluzione**:
1. Controlla la finestra del servizio per errori
2. Verifica che la porta sia libera:
   ```powershell
   netstat -ano | findstr ":3015"
   ```
3. Se occupata, trova e termina il processo:
   ```powershell
   # Trova PID
   netstat -ano | findstr ":3015"
   
   # Termina processo (sostituisci PID)
   taskkill /F /PID <PID>
   ```

---

## 📝 WORKFLOW TIPICO

### **Inizio giornata:**

```powershell
cd "C:\Users\Domi\Desktop\Strike Antigravity"
.\start-all.bat
```

**Aspetta ~40 secondi**, poi apri:
```
http://localhost:3005
```

### **Durante lo sviluppo:**

I servizi continuano a funzionare in background. Puoi:
- Modificare il codice
- I servizi si riavviano automaticamente (hot reload)
- Non serve riavviare tutto

### **Fine giornata:**

```powershell
.\stop-all.bat
```

---

## 🎯 TEST WEBRTC STREAMING

### **Dopo aver avviato tutti i servizi:**

1. **Apri browser**:
   ```
   http://localhost:3005/it/test-stream
   ```

2. **Aspetta connessione WebRTC** (~5-10 secondi)

3. **Verifica debug panel**:
   - Session: test-session-123
   - Connection: **connected** ✅
   - ICE: **connected** ✅
   - Streaming: **✅ Yes**
   - Transport: **WebRTC (RTP/SRTP)**

4. **Dovresti vedere**:
   - Il tuo desktop catturato nel video player
   - Latenza bassa (~100-200ms)

### **Se non funziona:**

1. **Apri Console Browser** (F12)
2. **Cerca errori** WebRTC
3. **Controlla finestra** "Strike WebRTC Streaming"
4. **Verifica FFmpeg**:
   ```powershell
   C:\ffmpeg\bin\ffmpeg.exe -version
   ```

---

## 📞 COMANDI UTILI

### **Verificare porte in uso:**
```powershell
netstat -ano | findstr ":3015"
netstat -ano | findstr ":3012"
netstat -ano | findstr ":3005"
```

### **Terminare processo specifico:**
```powershell
taskkill /F /PID <PID>
```

### **Terminare tutti i Node.js:**
```powershell
taskkill /F /IM node.exe
```

### **Verificare servizi attivi:**
```powershell
Get-Process -Name node
```

---

## 🎉 QUICK START

```powershell
# 1. Apri PowerShell in Strike Antigravity
cd "C:\Users\Domi\Desktop\Strike Antigravity"

# 2. Avvia tutti i servizi
.\start-all.bat

# 3. Aspetta 40 secondi

# 4. Apri browser
# http://localhost:3005/it/test-stream

# 5. Quando hai finito
.\stop-all.bat
```

---

**Ultimo aggiornamento**: 11 Dicembre 2025, 21:15  
**Versione**: 2.0 (con WebRTC Streaming Service)
