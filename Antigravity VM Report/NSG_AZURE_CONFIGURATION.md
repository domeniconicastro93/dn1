# 🎯 ULTIMO STEP: Configurazione NSG Azure

**Data**: 08 Dicembre 2025, 16:52
**Stato**: 🟡 Sunshine funziona sulla VM, ma non è raggiungibile dall'esterno

---

## ✅ Cosa Funziona

### Antigravity VM ha confermato:
- ✅ Sunshine in esecuzione sulla VM
- ✅ HTTPS API (47990) risponde **localmente** sulla VM
- ✅ Apps configurate e rilevate (3 apps)
- ✅ Autenticazione funzionante
- ✅ Credenziali corrette: `strike` / `Nosmoking93!!`

### Antigravity Locale ha confermato:
- ✅ File `.env` aggiornato con password
- ✅ Orchestrator Service riavviato
- ✅ Configurazione corretta

---

## ❌ Cosa NON Funziona

### Test dall'esterno (dal locale alla VM):
- ❌ Connessione a `20.31.130.73:47990` va in **TIMEOUT**
- ❌ Tutti i test di connessione falliscono

**Diagnosi**: Il **Network Security Group (NSG)** di Azure sta bloccando le connessioni in ingresso sulle porte Sunshine.

---

## 🔧 SOLUZIONE: Configurare NSG Azure

### Accedi al Portale Azure

1. Vai su https://portal.azure.com
2. Accedi con le tue credenziali Azure

### Trova la VM

1. Nel menu laterale, clicca su **"Macchine virtuali"** (Virtual machines)
2. Trova e clicca sulla VM con IP `20.31.130.73`

### Configura il Network Security Group

1. Nel menu della VM, clicca su **"Rete"** (Networking)
2. Clicca su **"Regole porta in ingresso"** (Inbound port rules)
3. Clicca su **"Aggiungi regola porta in ingresso"** (Add inbound port rule)

### Aggiungi Regole per Sunshine

Crea **4 regole** (una per ogni porta):

#### Regola 1: Sunshine HTTPS Web (47984)
- **Source**: Any
- **Source port ranges**: *
- **Destination**: Any
- **Service**: Custom
- **Destination port ranges**: `47984`
- **Protocol**: TCP
- **Action**: Allow
- **Priority**: 1010
- **Name**: `Sunshine-HTTPS-Web`
- **Description**: `Sunshine HTTPS Web UI`

#### Regola 2: Sunshine HTTP API (47985)
- **Source**: Any
- **Source port ranges**: *
- **Destination**: Any
- **Service**: Custom
- **Destination port ranges**: `47985`
- **Protocol**: TCP
- **Action**: Allow
- **Priority**: 1011
- **Name**: `Sunshine-HTTP-API`
- **Description**: `Sunshine HTTP API`

#### Regola 3: Sunshine RTSP (47989)
- **Source**: Any
- **Source port ranges**: *
- **Destination**: Any
- **Service**: Custom
- **Destination port ranges**: `47989`
- **Protocol**: TCP
- **Action**: Allow
- **Priority**: 1012
- **Name**: `Sunshine-RTSP`
- **Description**: `Sunshine RTSP Streaming`

#### Regola 4: Sunshine HTTPS API (47990) ⭐ PRINCIPALE
- **Source**: Any
- **Source port ranges**: *
- **Destination**: Any
- **Service**: Custom
- **Destination port ranges**: `47990`
- **Protocol**: TCP
- **Action**: Allow
- **Priority**: 1013
- **Name**: `Sunshine-HTTPS-API`
- **Description**: `Sunshine HTTPS API - Main`

### Salva le Regole

1. Clicca su **"Aggiungi"** (Add) per ogni regola
2. Aspetta che le regole vengano applicate (~1-2 minuti)

---

## 🧪 Test Dopo Configurazione NSG

### Dalla VM (Antigravity VM):

```powershell
# Test che le porte siano in ascolto
netstat -ano | findstr "47984 47985 47989 47990"

# Test connessione esterna (dal pubblico)
curl.exe -k -u "strike:Nosmoking93!!" https://20.31.130.73:47990/api/apps
```

### Dal Locale (Antigravity Locale):

```powershell
# Test connessione Orchestrator → Sunshine
curl http://localhost:3012/test/sunshine

# Test pairing
curl http://localhost:3012/test/sunshine/pairing

# Test lancio gioco
curl http://localhost:3012/test/sunshine/launch
```

---

## 📋 Checklist Finale

### Prima di configurare NSG:
- [x] Sunshine in esecuzione sulla VM
- [x] Porte in ascolto sulla VM
- [x] Firewall Windows configurato
- [x] Test locale sulla VM funzionante
- [x] Credenziali configurate
- [x] File `.env` aggiornato sul locale

### Dopo configurazione NSG:
- [ ] NSG Azure configurato con 4 regole
- [ ] Test connessione esterna dalla VM funzionante
- [ ] Test connessione dal locale funzionante
- [ ] Test pairing funzionante
- [ ] Test lancio gioco funzionante
- [ ] Integrazione end-to-end verificata

---

## 🎯 Prossimi Passi

### 1. Configura NSG Azure (TU - Domi)
Segui le istruzioni sopra per aprire le porte nel NSG Azure.

### 2. Verifica dalla VM (Antigravity VM)
Dopo aver configurato NSG, testa che la connessione esterna funzioni:
```powershell
curl.exe -k -u "strike:Nosmoking93!!" https://20.31.130.73:47990/api/apps
```

### 3. Testa dal Locale (Antigravity Locale - io)
Quando confermi che NSG è configurato, rieseguirò i test:
```powershell
curl http://localhost:3012/test/sunshine
```

---

## 💬 Messaggio per Domi

Ciao Domi! 👋

Antigravity VM ha fatto un lavoro fantastico! Sunshine è configurato perfettamente sulla VM e risponde alle richieste locali.

**Problema rimanente**: Il Network Security Group (NSG) di Azure sta bloccando le connessioni esterne.

**Cosa devi fare**:
1. Accedi al portale Azure
2. Trova la VM con IP `20.31.130.73`
3. Vai su **Rete** → **Regole porta in ingresso**
4. Aggiungi 4 regole per le porte: `47984`, `47985`, `47989`, `47990`
5. Dimmi quando hai finito

**Quando mi confermi che NSG è configurato**, rieseguirò i test e verificherò che Strike possa connettersi a Sunshine!

Siamo quasi alla fine! 🚀

---

## 📊 Architettura Attuale

```
┌─────────────────────────────────────┐
│   LOCALE (Strike) ✅                │
│                                     │
│   Orchestrator :3012 ───────────────┼──┐
│                                     │  │
└─────────────────────────────────────┘  │
                                         │
                    ❌ BLOCCATO          │
                    (NSG Azure)          │
                                         │
┌─────────────────────────────────────┐  │
│   VM AZURE ✅                       │  │
│   IP: 20.31.130.73                  │  │
│                                     │  │
│   🛡️ NSG Azure (DA CONFIGURARE)    │  │
│   ├─ Port 47984 ❌                  │  │
│   ├─ Port 47985 ❌                  │  │
│   ├─ Port 47989 ❌                  │  │
│   └─ Port 47990 ❌                  │  │
│                                     │  │
│   Sunshine Server ✅                │  │
│   ├─ Localhost: OK ✅               │  │
│   ├─ External: BLOCKED ❌           │  │
│   └─ Apps: 3 ✅                     │  │
└─────────────────────────────────────┘  │
```

---

**Ultimo step**: Configurazione NSG Azure! 🎯

**Tempo stimato**: 5-10 minuti

**Difficoltà**: Facile (interfaccia grafica Azure)

---

**Documento creato da Antigravity Locale**
**In attesa di configurazione NSG Azure**
