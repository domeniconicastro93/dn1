# 🎮 NoVNC Setup per Azure VM - Strike Cloud Gaming

**Data**: 08 Dicembre 2025, 21:10  
**Obiettivo**: Installare TightVNC Server per streaming desktop

---

## 📋 STEP 1: INSTALLA TIGHTVNC SERVER

### 1.1 Download TightVNC
```powershell
# Apri PowerShell come Administrator
# Scarica TightVNC Server (ultima versione)
$url = "https://www.tightvnc.com/download/2.8.84/tightvnc-2.8.84-gpl-setup-64bit.msi"
$output = "C:\Temp\tightvnc-setup.msi"

# Crea directory temp se non esiste
New-Item -ItemType Directory -Force -Path C:\Temp

# Download
Invoke-WebRequest -Uri $url -OutFile $output

# Installa (silent mode)
Start-Process msiexec.exe -ArgumentList "/i $output /quiet /norestart SERVER_REGISTER_AS_SERVICE=1 SERVER_ADD_FIREWALL_EXCEPTION=1 SET_USEVNCAUTHENTICATION=1 VALUE_OF_USEVNCAUTHENTICATION=1 SET_PASSWORD=1 VALUE_OF_PASSWORD=Strike2025!" -Wait
```

### 1.2 Configura Password
```powershell
# La password è già impostata durante l'installazione: Strike2025!
# Se vuoi cambiarla:
# Apri "TightVNC Server (Service Mode)" dal menu Start
# Vai su "Configuration" -> "Set Password"
```

---

## 📋 STEP 2: CONFIGURA TIGHTVNC

### 2.1 Configura Porta e Accesso
```powershell
# TightVNC usa porta 5900 di default
# Verifica che sia in ascolto
netstat -an | findstr "5900"

# Dovresti vedere:
# TCP    0.0.0.0:5900           0.0.0.0:0              LISTENING
```

### 2.2 Configura Firewall Windows
```powershell
# Aggiungi regola firewall per porta 5900
New-NetFirewallRule -DisplayName "TightVNC Server" -Direction Inbound -LocalPort 5900 -Protocol TCP -Action Allow
```

---

## 📋 STEP 3: CONFIGURA AZURE NSG

### 3.1 Aggiungi Regola Inbound
```
Nome: AllowVNC
Porta: 5900
Protocollo: TCP
Sorgente: Any (o IP specifico per sicurezza)
Destinazione: Any
Azione: Allow
Priorità: 310
```

**IMPORTANTE**: Questa porta sarà accessibile solo dall'Orchestrator, non direttamente dal browser!

---

## 📋 STEP 4: TESTA CONNESSIONE

### 4.1 Test Locale (sulla VM)
```powershell
# Verifica che TightVNC sia in esecuzione
Get-Service -Name "tvnserver"

# Dovrebbe mostrare:
# Status: Running
```

### 4.2 Test Remoto (dal tuo PC)
```powershell
# Prova a connetterti con TightVNC Viewer
# Download: https://www.tightvnc.com/download.php
# Connetti a: 20.31.130.73:5900
# Password: Strike2025!
```

---

## 📋 STEP 5: OTTIMIZZAZIONI (OPZIONALE)

### 5.1 Disabilita Desktop Composition (per performance)
```powershell
# Disabilita Aero/Desktop Composition
Set-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\DWM" -Name "Composition" -Value 0
```

### 5.2 Riduci Qualità Visiva
```powershell
# Disabilita effetti visivi
SystemPropertiesPerformance.exe
# Seleziona "Adjust for best performance"
```

### 5.3 Configura TightVNC per Gaming
Apri TightVNC Server Configuration:
1. **Polling**: Full-screen polling
2. **Priority**: High
3. **Remove wallpaper**: Yes (per performance)

---

## ✅ VERIFICA FINALE

Dopo il setup, verifica:

1. ✅ TightVNC Server è in esecuzione
2. ✅ Porta 5900 è aperta nel firewall Windows
3. ✅ Porta 5900 è aperta in Azure NSG
4. ✅ Puoi connetterti da TightVNC Viewer

---

## 🎮 PROSSIMO STEP

Quando hai completato questo setup:
1. Torna su Strike locale
2. Io configurerò il proxy websockify
3. Integrerò noVNC nel frontend
4. **Vedrai il gioco partire!** 🚀

---

## 🆘 TROUBLESHOOTING

### Problema: TightVNC non si avvia
```powershell
# Riavvia servizio
Restart-Service -Name "tvnserver"
```

### Problema: Non riesco a connettermi
```powershell
# Verifica firewall
Get-NetFirewallRule -DisplayName "TightVNC Server"

# Verifica porta
Test-NetConnection -ComputerName localhost -Port 5900
```

### Problema: Schermo nero
```powershell
# Assicurati che ci sia una sessione desktop attiva
# Fai login RDP prima di usare VNC
```

---

**Fatto da**: Antigravity Locale  
**Per**: Antigravity VM  
**Data**: 08 Dicembre 2025, 21:10
