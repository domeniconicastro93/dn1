# 🎮 SETUP NoVNC per Strike Cloud Gaming

**Data**: 08 Dicembre 2025, 21:20  
**Urgenza**: ALTA - Setup finale per MVP Strike

---

## 🎯 OBIETTIVO

Installare e configurare **TightVNC Server** sulla VM Azure per abilitare streaming desktop via NoVNC nel browser Strike.

---

## 📋 TASK

### **STEP 1: Installa TightVNC Server**

```powershell
# Apri PowerShell come Administrator

# 1. Crea directory temp
New-Item -ItemType Directory -Force -Path C:\Temp

# 2. Download TightVNC
$url = "https://www.tightvnc.com/download/2.8.84/tightvnc-2.8.84-gpl-setup-64bit.msi"
$output = "C:\Temp\tightvnc-setup.msi"
Invoke-WebRequest -Uri $url -OutFile $output

# 3. Installa TightVNC (silent mode con password)
Start-Process msiexec.exe -ArgumentList "/i $output /quiet /norestart SERVER_REGISTER_AS_SERVICE=1 SERVER_ADD_FIREWALL_EXCEPTION=1 SET_USEVNCAUTHENTICATION=1 VALUE_OF_USEVNCAUTHENTICATION=1 SET_PASSWORD=1 VALUE_OF_PASSWORD=Strike2025!" -Wait

Write-Host "✅ TightVNC installato!"
```

---

### **STEP 2: Verifica Servizio**

```powershell
# Verifica che TightVNC sia in esecuzione
Get-Service -Name "tvnserver"

# Output atteso:
# Status: Running
```

Se non è running:
```powershell
Start-Service -Name "tvnserver"
```

---

### **STEP 3: Configura Firewall Windows**

```powershell
# Aggiungi regola firewall per porta 5900
New-NetFirewallRule -DisplayName "TightVNC Server" -Direction Inbound -LocalPort 5900 -Protocol TCP -Action Allow

# Verifica regola
Get-NetFirewallRule -DisplayName "TightVNC Server"
```

---

### **STEP 4: Verifica Porta in Ascolto**

```powershell
# Verifica che TightVNC sia in ascolto sulla porta 5900
netstat -an | findstr "5900"

# Output atteso:
# TCP    0.0.0.0:5900           0.0.0.0:0              LISTENING
```

---

### **STEP 5: Configura Azure NSG**

**IMPORTANTE**: Devi aggiungere una regola inbound in Azure NSG!

**Vai su Azure Portal:**
1. Network Security Group della VM
2. Inbound security rules
3. Add rule:
   - **Nome**: AllowVNC
   - **Porta**: 5900
   - **Protocollo**: TCP
   - **Sorgente**: Any
   - **Destinazione**: Any
   - **Azione**: Allow
   - **Priorità**: 310

---

### **STEP 6: Test Connessione Locale**

```powershell
# Test connessione locale
Test-NetConnection -ComputerName localhost -Port 5900

# Output atteso:
# TcpTestSucceeded : True
```

---

### **STEP 7: Assicurati Desktop Attivo**

**IMPORTANTE**: TightVNC cattura solo se c'è una sessione desktop attiva!

```powershell
# Verifica sessione desktop
query user

# Dovresti vedere una sessione attiva
```

Se non c'è sessione:
1. Fai login RDP
2. Lascia sessione aperta (non disconnettere)

---

## ✅ VERIFICA FINALE

Dopo tutti gli step, verifica:

```powershell
# 1. Servizio running
Get-Service -Name "tvnserver" | Select-Object Status

# 2. Porta in ascolto
netstat -an | findstr "5900"

# 3. Firewall rule
Get-NetFirewallRule -DisplayName "TightVNC Server" | Select-Object Enabled

# 4. Sessione desktop
query user
```

**Tutti devono essere OK!**

---

## 🎮 COSA SUCCEDE DOPO

Quando hai completato:
1. ✅ TightVNC installato e running
2. ✅ Porta 5900 aperta nel firewall
3. ✅ Regola Azure NSG aggiunta
4. ✅ Sessione desktop attiva

**Strike potrà connettersi e mostrare il desktop in streaming!**

---

## 🆘 TROUBLESHOOTING

### Problema: Download fallisce
```powershell
# Download manuale
# Vai su: https://www.tightvnc.com/download.php
# Scarica versione 2.8.84 (64-bit)
# Installa manualmente con password: Strike2025!
```

### Problema: Servizio non parte
```powershell
# Riavvia servizio
Restart-Service -Name "tvnserver"

# Verifica log
Get-EventLog -LogName Application -Source "TightVNC" -Newest 10
```

### Problema: Porta non in ascolto
```powershell
# Verifica configurazione TightVNC
# Apri: "TightVNC Server (Service Mode)" dal menu Start
# Verifica porta sia 5900
```

---

## 📊 INFO TECNICHE

- **VNC Server**: TightVNC 2.8.84
- **Porta**: 5900 (standard VNC)
- **Password**: Strike2025!
- **Protocollo**: RFB (Remote Framebuffer)
- **Compressione**: Tight encoding

---

## 🚀 READY!

Quando hai finito, **dimmi "DONE"** e testiamo Strike!

---

**Creato da**: Antigravity Locale  
**Per**: Antigravity VM  
**Data**: 08 Dicembre 2025, 21:20
