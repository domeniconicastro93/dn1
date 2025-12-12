# 🎮 Istruzioni per Antigravity VM - Configurazione Sunshine

**Ciao Antigravity VM!** Sono Antigravity Locale che lavora sul progetto Strike. Ecco cosa devi fare per configurare Sunshine sulla VM Azure.

---

## 📋 Informazioni sulla VM

**IP VM Azure**: `20.31.130.73` (da confermare)
**Progetto**: Strike Gaming Cloud
**Obiettivo**: Configurare Sunshine per ricevere connessioni dal progetto Strike locale

---

## 🔧 Task da Completare

### 1. Verifica Installazione Sunshine

Verifica che Sunshine sia installato e funzionante:

```powershell
# Verifica che Sunshine sia in esecuzione
Get-Process | Where-Object {$_.ProcessName -like "*sunshine*"}

# Verifica che le porte siano aperte
netstat -ano | findstr "47984 47985 47989 47990"
```

**Porte Sunshine**:
- `47984` - HTTPS Web UI
- `47985` - HTTP API
- `47989` - RTSP
- `47990` - HTTPS API

### 2. Configura Credenziali Sunshine

Crea o verifica le credenziali per l'accesso API:

**Username**: `strike`
**Password**: Genera una password sicura e salvala

**File da modificare**: `C:\Program Files\Sunshine\config\sunshine.conf`

Aggiungi o verifica queste righe:

```conf
# API Authentication
username = strike
password = <PASSWORD_GENERATA>

# Enable API
upnp = on
```

### 3. Configura Apps in Sunshine

**File**: `C:\Program Files\Sunshine\config\apps.json`

Assicurati che ci siano app configurate per il gaming. Esempio:

```json
{
  "env": {},
  "apps": [
    {
      "name": "Desktop",
      "output": "",
      "cmd": "",
      "index": 0,
      "exclude-global-prep-cmd": "false",
      "elevated": "false",
      "auto-detach": "true"
    },
    {
      "name": "Steam Big Picture",
      "output": "",
      "cmd": "steam://open/bigpicture",
      "index": 1,
      "exclude-global-prep-cmd": "false",
      "elevated": "false",
      "auto-detach": "true"
    }
  ]
}
```

### 4. Verifica Firewall Windows

Assicurati che le porte Sunshine siano aperte nel firewall:

```powershell
# Verifica regole firewall esistenti
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*Sunshine*"}

# Se non ci sono regole, creale:
New-NetFirewallRule -DisplayName "Sunshine HTTPS Web" -Direction Inbound -LocalPort 47984 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Sunshine HTTP API" -Direction Inbound -LocalPort 47985 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Sunshine RTSP" -Direction Inbound -LocalPort 47989 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Sunshine HTTPS API" -Direction Inbound -LocalPort 47990 -Protocol TCP -Action Allow
```

### 5. Verifica Azure NSG (Network Security Group)

Verifica che le porte siano aperte anche nel NSG di Azure:

**Porte da aprire**:
- `47984` (TCP)
- `47985` (TCP)
- `47989` (TCP)
- `47990` (TCP)

**Nota**: Questo potrebbe richiedere accesso al portale Azure.

### 6. Test Connessione Locale

Testa che Sunshine risponda alle richieste:

```powershell
# Test connessione HTTPS API
curl https://localhost:47990/api/apps -k

# Test connessione HTTP API
curl http://localhost:47985/api/apps
```

### 7. Riavvia Sunshine

Dopo le modifiche, riavvia Sunshine:

```powershell
# Ferma Sunshine
Stop-Process -Name "sunshine" -Force

# Riavvia Sunshine (dovrebbe ripartire automaticamente se configurato come servizio)
# Oppure avvialo manualmente da:
# C:\Program Files\Sunshine\sunshine.exe
```

### 8. Fornisci Informazioni al Locale

Una volta completata la configurazione, fornisci queste informazioni:

```
✅ IP VM: <IP_PUBBLICO>
✅ Username Sunshine: strike
✅ Password Sunshine: <PASSWORD_GENERATA>
✅ Porta HTTPS API: 47990
✅ Porta HTTP API: 47985
✅ SSL Certificate: Self-signed (ignora verifica SSL)
```

---

## 🔍 Troubleshooting

### Problema: Sunshine non si avvia

**Soluzione**:
```powershell
# Controlla i log
Get-Content "C:\Program Files\Sunshine\config\sunshine.log" -Tail 50
```

### Problema: Porte non accessibili dall'esterno

**Soluzione**:
1. Verifica firewall Windows
2. Verifica NSG Azure
3. Verifica che Sunshine sia in ascolto su `0.0.0.0` e non solo `127.0.0.1`

### Problema: Errore di autenticazione

**Soluzione**:
Verifica che username e password siano configurati correttamente in `sunshine.conf`

---

## 📝 Checklist Finale

Prima di confermare che tutto è pronto, verifica:

- [ ] Sunshine è in esecuzione
- [ ] Porte 47984, 47985, 47989, 47990 sono aperte nel firewall Windows
- [ ] Porte sono aperte nel NSG Azure
- [ ] Username e password configurati
- [ ] Apps configurate in `apps.json`
- [ ] Test locale con curl funziona
- [ ] Informazioni inviate ad Antigravity Locale

---

## 🚀 Prossimi Passi

Una volta completata la configurazione, Antigravity Locale aggiornerà il file `.env` del progetto Strike con:

```env
# Sunshine Configuration
SUNSHINE_URL=<IP_VM>
SUNSHINE_PORT=47990
SUNSHINE_USE_HTTPS=true
SUNSHINE_VERIFY_SSL=false
SUNSHINE_USERNAME=strike
SUNSHINE_PASSWORD=<PASSWORD>
ORCHESTRATOR_SUNSHINE_HOST=<IP_VM>
ORCHESTRATOR_SUNSHINE_PORT=47990
ORCHESTRATOR_SUNSHINE_USE_HTTPS=true
```

E poi testerà la connessione dal locale alla VM!

---

**Buon lavoro, Antigravity VM! 🤖**

---

**Generato da Antigravity Locale**
**Data**: 08 Dicembre 2025, 16:40
