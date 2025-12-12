# 🚀 SETUP APOLLO PER STRIKE - ISTRUZIONI VM

**Data**: 09 Dicembre 2025, 17:14  
**Urgenza**: ALTA - Passaggio da NoVNC ad Apollo + WebRTC

---

## 🎯 OBIETTIVO

Installare e configurare **Apollo** sulla VM Azure per abilitare streaming cloud gaming ad alta qualità con WebRTC.

---

## 📋 STEP 1: DISINSTALLA VECCHI SOFTWARE

### **1.1 Ferma Servizi**

```powershell
# Apri PowerShell come Administrator

# Ferma TightVNC
Stop-Service -Name "tvnserver" -ErrorAction SilentlyContinue

# Ferma Sunshine (se presente)
Stop-Service -Name "SunshineService" -ErrorAction SilentlyContinue
```

### **1.2 Disinstalla TightVNC**

```powershell
# Vai su: Pannello di Controllo -> Programmi -> Disinstalla un programma
# Cerca "TightVNC"
# Clicca "Disinstalla"
```

### **1.3 Disinstalla Sunshine (se presente)**

```powershell
# Vai su: Pannello di Controllo -> Programmi -> Disinstalla un programma
# Cerca "Sunshine"
# Clicca "Disinstalla"
```

---

## 📋 STEP 2: INSTALLA APOLLO

### **2.1 Download Apollo**

```powershell
# Apri PowerShell come Administrator

# Crea directory temp
New-Item -ItemType Directory -Force -Path C:\Temp

# Download Apollo (ultima versione)
$url = "https://github.com/LizardByte/Apollo/releases/latest/download/Apollo-Windows.exe"
$output = "C:\Temp\Apollo-Setup.exe"

Invoke-WebRequest -Uri $url -OutFile $output

Write-Host "✅ Apollo scaricato in: $output"
```

**NOTA**: Se il download fallisce, scarica manualmente da:
https://github.com/LizardByte/Apollo/releases

### **2.2 Installa Apollo**

```powershell
# Esegui installer
Start-Process "C:\Temp\Apollo-Setup.exe" -Wait

# Apollo si installa in: C:\Program Files\Apollo
```

**Durante l'installazione:**
- ✅ Accetta licenza
- ✅ Installa come servizio Windows
- ✅ Aggiungi eccezione firewall

---

## 📋 STEP 3: CONFIGURA APOLLO

### **3.1 Avvia Apollo**

```powershell
# Apollo dovrebbe avviarsi automaticamente
# Verifica servizio
Get-Service -Name "Apollo*"

# Se non è running:
Start-Service -Name "Apollo"
```

### **3.2 Apri Web UI**

```powershell
# Apri browser
Start-Process "https://localhost:47990"
```

**NOTA**: Accetta certificato self-signed (clicca "Avanzate" -> "Procedi")

### **3.3 Configurazione Iniziale**

**Nel browser (https://localhost:47990):**

1. **Username**: `strike`
2. **Password**: `Nosmoking93!!`
3. Clicca "Create Account"

### **3.4 Configura Virtual Display**

**Settings -> Display:**
- ✅ **Enable Virtual Display**: ON
- ✅ **Resolution**: 1920x1080
- ✅ **Framerate**: 60 FPS
- ✅ **Adapter**: (seleziona GPU Nvidia/AMD)

**Salva impostazioni**

### **3.5 Configura Streaming**

**Settings -> Streaming:**
- ✅ **Bitrate**: 10000 kbps
- ✅ **Encoder**: H264 (Hardware)
- ✅ **Quality**: High

**Salva impostazioni**

---

## 📋 STEP 4: AGGIUNGI STEAM COME APP

### **4.1 Aggiungi Applicazione**

**Nel Web UI -> Applications -> Add Application:**

```
Name: Steam
Command: C:\Program Files (x86)\Steam\steam.exe
Working Directory: C:\Program Files (x86)\Steam
```

**Clicca "Save"**

### **4.2 Verifica App**

Dovresti vedere "Steam" nella lista applicazioni.

---

## 📋 STEP 5: CONFIGURA FIREWALL & NSG

### **5.1 Firewall Windows**

```powershell
# Apollo usa porte 47984-48010
# Aggiungi regole firewall

New-NetFirewallRule -DisplayName "Apollo HTTPS" -Direction Inbound -LocalPort 47990 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Apollo Streaming" -Direction Inbound -LocalPort 47998-48010 -Protocol UDP -Action Allow
```

### **5.2 Azure NSG**

**Vai su Azure Portal:**

1. Network Security Group della VM
2. Inbound security rules
3. Add rule:
   - **Nome**: AllowApollo
   - **Porta**: 47990,47998-48010
   - **Protocollo**: Any
   - **Azione**: Allow
   - **Priorità**: 320

---

## 📋 STEP 6: TEST APOLLO

### **6.1 Test Locale**

```powershell
# Verifica servizio running
Get-Service -Name "Apollo*"

# Output atteso:
# Status: Running

# Verifica porte in ascolto
netstat -an | findstr "47990"

# Output atteso:
# TCP    0.0.0.0:47990          0.0.0.0:0              LISTENING
```

### **6.2 Test Web UI**

```powershell
# Apri browser
Start-Process "https://localhost:47990"

# Dovresti vedere:
# - Dashboard Apollo
# - Lista applicazioni (Steam)
# - Settings accessibili
```

### **6.3 Test Virtual Display**

```powershell
# Verifica display virtuale attivo
# Vai su: Settings -> Display
# Dovresti vedere "Virtual Display: Active"
```

---

## ✅ VERIFICA FINALE

Dopo tutti gli step, verifica:

```powershell
# 1. Servizio running
Get-Service -Name "Apollo*" | Select-Object Status

# 2. Porte in ascolto
netstat -an | findstr "47990"

# 3. Web UI accessibile
# Apri: https://localhost:47990

# 4. Steam configurato
# Web UI -> Applications -> Dovresti vedere "Steam"

# 5. Virtual Display attivo
# Web UI -> Settings -> Display -> Virtual Display: Active
```

**Tutti devono essere OK!**

---

## 🎮 COSA SUCCEDE DOPO

Quando hai completato:
1. ✅ Apollo installato e running
2. ✅ Virtual display attivo
3. ✅ Steam configurato
4. ✅ Firewall/NSG configurati

**Strike potrà connettersi via WebRTC e streammare il desktop!**

---

## 🆘 TROUBLESHOOTING

### Problema: Download Apollo fallisce
```powershell
# Download manuale
# Vai su: https://github.com/LizardByte/Apollo/releases
# Scarica: Apollo-Windows.exe
# Salva in: C:\Temp\Apollo-Setup.exe
```

### Problema: Servizio non parte
```powershell
# Riavvia servizio
Restart-Service -Name "Apollo"

# Verifica log
Get-EventLog -LogName Application -Source "Apollo" -Newest 10
```

### Problema: Virtual Display non attivo
```
# Verifica GPU driver aggiornati
# Riavvia VM
# Riprova configurazione display
```

---

## 📊 INFO TECNICHE

- **Apollo Version**: Latest (da GitHub)
- **Porte**: 47990 (HTTPS), 47998-48010 (UDP streaming)
- **Protocollo**: WebRTC
- **Encoding**: H264 (GPU)
- **Virtual Display**: Sì

---

## 🚀 READY!

Quando hai finito, **dimmi "DONE"** e procediamo con:
1. Implementazione signaling server (Orchestrator)
2. Integrazione WebRTC client (Strike frontend)
3. **Test streaming end-to-end!** 🎮

---

**Creato da**: Antigravity Locale  
**Per**: Antigravity VM  
**Data**: 09 Dicembre 2025, 17:14
