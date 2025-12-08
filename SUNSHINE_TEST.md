# SUNSHINE CONNECTION TEST
## Verifica Connettività Sunshine dalla VM Azure

**Data**: 2025-12-05
**Obiettivo**: Testare la connessione tra Orchestrator e Sunshine

---

## 🔧 ENDPOINT DI TEST CREATO

Ho aggiunto un endpoint di test all'Orchestrator Service:

**URL**: `http://localhost:3012/test/sunshine`

Questo endpoint testa la connessione a Sunshine sulla VM Azure.

---

## 📋 ISTRUZIONI PASSO-PASSO

### STEP 1: Riavvia Orchestrator Service

1. **Ferma l'Orchestrator** (Ctrl+C nella finestra PowerShell)

2. **Riavvia**:
   ```powershell
   cd "C:\Users\Domi\Desktop\Strike Antigravity\services\orchestrator-service"
   pnpm run dev
   ```

3. **Attendi** che appaia:
   ```
   Orchestrator service listening on 0.0.0.0:3012
   ```

### STEP 2: Testa Connessione Sunshine

**Opzione A: Tramite Browser**

Apri il browser e vai a:
```
http://localhost:3012/test/sunshine
```

**Opzione B: Tramite PowerShell**

Apri un nuovo PowerShell e esegui:
```powershell
Invoke-WebRequest -Uri "http://localhost:3012/test/sunshine" -Method GET
```

---

## ✅ RISULTATI ATTESI

### Se Sunshine è Raggiungibile

**Browser mostrerà**:
```json
{
  "success": true,
  "data": {
    "connected": true,
    "host": "20.31.130.73",
    "port": 47985,
    "message": "Sunshine is reachable"
  }
}
```

**Log Orchestrator mostrerà**:
```
[TEST] Testing Sunshine connection to 20.31.130.73:47985
[TEST] Sunshine connection successful!
```

### Se Sunshine NON è Raggiungibile

**Browser mostrerà**:
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Sunshine connection failed",
    "details": {
      "error": "Connection refused" // o altro errore
    }
  }
}
```

**Log Orchestrator mostrerà**:
```
[TEST] Testing Sunshine connection to 20.31.130.73:47985
[TEST] Sunshine connection failed: Connection refused
```

---

## 🔍 DIAGNOSI ERRORI

### Errore: "Connection refused"
**Causa**: Sunshine non è in ascolto sulla porta 47985
**Soluzione**: 
- Verifica che Sunshine sia avviato sulla VM
- Controlla che la porta 47985 sia aperta

### Errore: "Timeout"
**Causa**: Firewall blocca la connessione
**Soluzione**:
- Verifica regole NSG su Azure (porta 47985 TCP)
- Verifica Windows Firewall sulla VM

### Errore: "ECONNREFUSED"
**Causa**: Sunshine non accetta connessioni esterne
**Soluzione**:
- Verifica configurazione Sunshine
- Controlla che "Address Family" sia impostato su "IPv4 only" o "Both"

---

## 🎯 VERIFICA DIRETTA SUNSHINE

### Test 1: Verifica Porta Aperta

**PowerShell**:
```powershell
Test-NetConnection -ComputerName 20.31.130.73 -Port 47985
```

**Risultato atteso**:
```
TcpTestSucceeded : True
```

### Test 2: Verifica Web UI Sunshine

**Browser**:
```
http://20.31.130.73:47990
```

Dovresti vedere la pagina di configurazione Sunshine.

### Test 3: Verifica API Sunshine

**Browser**:
```
http://20.31.130.73:47985
```

Dovresti vedere una risposta JSON o una pagina Sunshine.

---

## 📊 PROSSIMI PASSI

### Se il Test PASSA ✅

1. Il problema è altrove (autenticazione, app launch, etc.)
2. Procediamo con il debug della session start

### Se il Test FALLISCE ❌

1. Verifica configurazione Sunshine sulla VM
2. Verifica porte aperte su Azure NSG
3. Verifica Windows Firewall sulla VM

---

## 🚀 AZIONE IMMEDIATA

**RIAVVIA L'ORCHESTRATOR E TESTA**:

1. Ferma Orchestrator (Ctrl+C)
2. Riavvia: `pnpm run dev`
3. Apri browser: `http://localhost:3012/test/sunshine`
4. **Manda screenshot del risultato!**

---

**END OF TEST INSTRUCTIONS**
