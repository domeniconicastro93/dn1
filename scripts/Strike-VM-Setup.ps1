# ============================================================================
# STRIKE GAMING CLOUD - Complete VM Setup Script
# ============================================================================
# This script completely configures a Windows VM for Strike Gaming Cloud
# Run this script AS ADMINISTRATOR on the target VM
# ============================================================================

#Requires -RunAsAdministrator

param(
    [string]$StrikeRepoUrl = "https://github.com/domeniconicastro93/strike-cloud-gaming.git",
    [string]$StrikeDir = "C:\Strike",
    [switch]$SkipSteam = $false
)

$ErrorActionPreference = "Continue"
$Global:SetupLog = @()
$Global:SetupErrors = @()

function Write-StrikeLog {
    param([string]$Message, [string]$Level = "INFO")
    
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"
    
    switch ($Level) {
        "SUCCESS" { Write-Host $logEntry -ForegroundColor Green }
        "ERROR"   { Write-Host $logEntry -ForegroundColor Red; $Global:SetupErrors += $Message }
        "WARNING" { Write-Host $logEntry -ForegroundColor Yellow }
        "INFO"    { Write-Host $logEntry -ForegroundColor Cyan }
        default   { Write-Host $logEntry }
    }
    
    $Global:SetupLog += $logEntry
}

function Test-Command {
    param([string]$Command)
    try {
        if (Get-Command $Command -ErrorAction SilentlyContinue) {
            return $true
        }
    } catch {}
    return $false
}

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  STRIKE GAMING CLOUD - VM Complete Setup" -ForegroundColor Cyan
Write-Host "  Version: 2.0" -ForegroundColor Cyan
Write-Host "  Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PHASE 1: Windows Configuration
# ============================================================================

Write-StrikeLog "=========== PHASE 1: Windows Configuration ===========" "INFO"

# Disable Windows Update (temporary)
Write-StrikeLog "Disabling Windows Update..." "INFO"
try {
    Stop-Service -Name wuauserv -Force -ErrorAction SilentlyContinue
    Set-Service -Name wuauserv -StartupType Disabled -ErrorAction SilentlyContinue
    Write-StrikeLog "Windows Update disabled" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to disable Windows Update: $_" "WARNING"
}

# Disable UAC
Write-StrikeLog "Disabling UAC..." "INFO"
try {
    Set-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Policies\System" -Name "EnableLUA" -Value 0 -ErrorAction Stop
    Write-StrikeLog "UAC disabled (requires reboot to take effect)" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to disable UAC: $_" "ERROR"
}

# Disable Sleep and Screensaver
Write-StrikeLog "Configuring power settings..." "INFO"
try {
    powercfg /change monitor-timeout-ac 0 | Out-Null
    powercfg /change standby-timeout-ac 0 | Out-Null
    powercfg /change hibernate-timeout-ac 0 | Out-Null
    powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c | Out-Null # High Performance
    Write-StrikeLog "Power settings configured (High Performance, no sleep)" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to configure power settings: $_" "WARNING"
}

# Enable Script Execution
Write-StrikeLog "Enabling PowerShell script execution..." "INFO"
try {
    Set-ExecutionPolicy Bypass -Scope LocalMachine -Force -ErrorAction Stop
    Write-StrikeLog "Script execution policy set to Bypass" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to set execution policy: $_" "ERROR"
}

# Create Directory Structure
Write-StrikeLog "Creating Strike directory structure..." "INFO"
try {
    New-Item -Path $StrikeDir -ItemType Directory -Force | Out-Null
    New-Item -Path "$StrikeDir\logs" -ItemType Directory -Force | Out-Null
    New-Item -Path "$StrikeDir\games" -ItemType Directory -Force | Out-Null
    New-Item -Path "$StrikeDir\backups" -ItemType Directory -Force | Out-Null
    Write-StrikeLog "Directory structure created at $StrikeDir" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to create directories: $_" "ERROR"
    exit 1
}

# ============================================================================
# PHASE 2: Software Installation
# ============================================================================

Write-StrikeLog "=========== PHASE 2: Software Installation ===========" "INFO"

# Install Chocolatey
Write-StrikeLog "Installing Chocolatey package manager..." "INFO"
if (!(Test-Command "choco")) {
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-Expression ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
        
        # Refresh environment
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        if (Test-Command "choco") {
            Write-StrikeLog "Chocolatey installed successfully" "SUCCESS"
        } else {
            throw "Chocolatey command not found after installation"
        }
    } catch {
        Write-StrikeLog "Failed to install Chocolatey: $_" "ERROR"
        exit 1
    }
} else {
    Write-StrikeLog "Chocolatey already installed" "SUCCESS"
}

# Install Node.js
Write-StrikeLog "Installing Node.js 20 LTS..." "INFO"
if (!(Test-Command "node")) {
    try {
        choco install nodejs-lts -y --force
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
        
        if (Test-Command "node") {
            $nodeVersion = node --version
            Write-StrikeLog "Node.js installed: $nodeVersion" "SUCCESS"
        } else {
            throw "Node.js not found after installation"
        }
    } catch {
        Write-StrikeLog "Failed to install Node.js: $_" "ERROR"
        exit 1
    }
} else {
    $nodeVersion = node --version
    Write-StrikeLog "Node.js already installed: $nodeVersion" "SUCCESS"
}

# Install Git
Write-StrikeLog "Installing Git..." "INFO"
if (!(Test-Command "git")) {
    try {
        choco install git -y --force
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine")
        
        if (Test-Command "git") {
            git config --global user.name "Strike Gaming VM"
            git config --global user.email "vm@strike.gg"
            $gitVersion = git --version
            Write-StrikeLog "Git installed: $gitVersion" "SUCCESS"
        } else {
            throw "Git not found after installation"
        }
    } catch {
        Write-StrikeLog "Failed to install Git: $_" "ERROR"
        exit 1
    }
} else {
    $gitVersion = git --version
    Write-StrikeLog "Git already installed: $gitVersion" "SUCCESS"
}

# Install Visual C++ Redistributables
Write-StrikeLog "Installing Visual C++ Redistributables..." "INFO"
try {
    choco install vcredist-all -y --force
    Write-StrikeLog "Visual C++ Redistributables installed" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to install VC++ Redistributables: $_" "WARNING"
}

# Install PNPM
Write-StrikeLog "Installing PNPM..." "INFO"
if (!(Test-Command "pnpm")) {
    try {
        npm install -g pnpm --force
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        if (Test-Command "pnpm") {
            $pnpmVersion = pnpm --version
            Write-StrikeLog "PNPM installed: $pnpmVersion" "SUCCESS"
        } else {
            throw "PNPM not found after installation"
        }
    } catch {
        Write-StrikeLog "Failed to install PNPM: $_" "ERROR"
        exit 1
    }
} else {
    $pnpmVersion = pnpm --version
    Write-StrikeLog "PNPM already installed: $pnpmVersion" "SUCCESS"
}

# Install PM2
Write-StrikeLog "Installing PM2..." "INFO"
if (!(Test-Command "pm2")) {
    try {
        npm install -g pm2 pm2-windows-startup --force
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
        
        if (Test-Command "pm2") {
            # Configure PM2 startup
            pm2-startup install
            $pm2Version = pm2 --version
            Write-StrikeLog "PM2 installed: $pm2Version" "SUCCESS"
        } else {
            throw "PM2 not found after installation"
        }
    } catch {
        Write-StrikeLog "Failed to install PM2: $_" "ERROR"
        exit 1
    }
} else {
    $pm2Version = pm2 --version
    Write-StrikeLog "PM2 already installed: $pm2Version" "SUCCESS"
}

# ============================================================================
# PHASE 3: Steam Installation
# ============================================================================

if (!$SkipSteam) {
    Write-StrikeLog "=========== PHASE 3: Steam Installation ===========" "INFO"
    
    Write-StrikeLog "Downloading Steam installer..." "INFO"
    try {
        $steamSetup = "$StrikeDir\SteamSetup.exe"
        Invoke-WebRequest -Uri "https://cdn.cloudflare.steamstatic.com/client/installer/SteamSetup.exe" -OutFile $steamSetup -ErrorAction Stop
        Write-StrikeLog "Steam installer downloaded" "SUCCESS"
        
        Write-StrikeLog "Installing Steam (silent mode)..." "INFO"
        Start-Process -FilePath $steamSetup -ArgumentList "/S" -Wait -ErrorAction Stop
        Write-StrikeLog "Steam installed successfully" "SUCCESS"
        
        # Create Steam auto-start task
        Write-StrikeLog "Configuring Steam auto-start..." "INFO"
        $action = New-ScheduledTaskAction -Execute "C:\Program Files (x86)\Steam\Steam.exe" -Argument "-silent"
        $trigger = New-ScheduledTaskTrigger -AtStartup
        $principal = New-ScheduledTaskPrincipal -UserId $env:USERNAME -RunLevel Highest
        Register-ScheduledTask -TaskName "Strike Steam Auto-Start" -Action $action -Trigger $trigger -Principal $principal -Force | Out-Null
        Write-StrikeLog "Steam auto-start configured" "SUCCESS"
        
    } catch {
        Write-StrikeLog "Failed to install Steam: $_" "WARNING"
    }
} else {
    Write-StrikeLog "Steam installation skipped (use -SkipSteam:$false to install)" "INFO"
}

# ============================================================================
# PHASE 4: Clone Repository and Build VM Agent
# ============================================================================

Write-StrikeLog "=========== PHASE 4: VM Agent Setup ===========" "INFO"

$repoDir = "$StrikeDir\strike-cloud-gaming"
$vmAgentDir = "$repoDir\services\vm-agent"

# Clone repository
if (!(Test-Path $repoDir)) {
    Write-StrikeLog "Cloning Strike repository..." "INFO"
    try {
        Set-Location $StrikeDir
        git clone $StrikeRepoUrl 2>&1 | Out-Null
        
        if (Test-Path $repoDir) {
            Write-StrikeLog "Repository cloned successfully" "SUCCESS"
        } else {
            throw "Repository directory not found after clone"
        }
    } catch {
        Write-StrikeLog "Failed to clone repository: $_" "ERROR"
        exit 1
    }
} else {
    Write-StrikeLog "Repository already exists, pulling latest..." "INFO"
    try {
        Set-Location $repoDir
        git pull 2>&1 | Out-Null
        Write-StrikeLog "Repository updated" "SUCCESS"
    } catch {
        Write-StrikeLog "Failed to update repository: $_" "WARNING"
    }
}

# Check if VM Agent exists
if (!(Test-Path $vmAgentDir)) {
    Write-StrikeLog "VM Agent directory not found at $vmAgentDir" "ERROR"
    exit 1
}

Set-Location $vmAgentDir

# Generate secure token
Write-StrikeLog "Generating secure token..." "INFO"
$tokenBytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($tokenBytes)
$token = [System.BitConverter]::ToString($tokenBytes).Replace('-', '').ToLower()
$Global:VMAgentToken = $token
Write-StrikeLog "Secure token generated (64 hex characters)" "SUCCESS"

# Create .env file
Write-StrikeLog "Creating .env configuration..." "INFO"
try {
    $envContent = @"
PORT=8787
VM_AGENT_TOKEN=$token
LAUNCH_DELAY_MS=5000
NODE_ENV=production
"@
    $envContent | Out-File -FilePath "$vmAgentDir\.env" -Encoding UTF8 -Force
    Write-StrikeLog ".env file created" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to create .env file: $_" "ERROR"
    exit 1
}

# Install dependencies
Write-StrikeLog "Installing VM Agent dependencies..." "INFO"
try {
    pnpm install 2>&1 | Out-Null
    Write-StrikeLog "Dependencies installed" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to install dependencies: $_" "ERROR"
    exit 1
}

# Build VM Agent
Write-StrikeLog "Building VM Agent..." "INFO"
try {
    pnpm build 2>&1 | Out-Null
    
    if (Test-Path "$vmAgentDir\dist\index.js") {
        Write-StrikeLog "VM Agent built successfully" "SUCCESS"
    } else {
        throw "Build output not found at dist/index.js"
    }
} catch {
    Write-StrikeLog "Failed to build VM Agent: $_" "ERROR"
    exit 1
}

# ============================================================================
# PHASE 5: Configure PM2 Service
# ============================================================================

Write-StrikeLog "=========== PHASE 5: PM2 Service Configuration ===========" "INFO"

# Stop existing instance if running
Write-StrikeLog "Stopping existing VM Agent instances..." "INFO"
try {
    pm2 delete strike-vm-agent 2>$null | Out-Null
} catch {}

# Start VM Agent with PM2
Write-StrikeLog "Starting VM Agent with PM2..." "INFO"
try {
    Set-Location $vmAgentDir
    pm2 start dist\index.js --name strike-vm-agent 2>&1 | Out-Null
    pm2 save 2>&1 | Out-Null
    
    Start-Sleep -Seconds 3
    
    $pm2Status = pm2 jlist | ConvertFrom-Json
    $vmAgentStatus = $pm2Status | Where-Object { $_.name -eq "strike-vm-agent" }
    
    if ($vmAgentStatus -and $vmAgentStatus.pm2_env.status -eq "online") {
        Write-StrikeLog "VM Agent started successfully with PM2" "SUCCESS"
    } else {
        throw "VM Agent not running after PM2 start"
    }
} catch {
    Write-StrikeLog "Failed to start VM Agent with PM2: $_" "ERROR"
    exit 1
}

# ============================================================================
# PHASE 6: Configure Windows Firewall
# ============================================================================

Write-StrikeLog "=========== PHASE 6: Windows Firewall Configuration ===========" "INFO"

# Enable Windows Firewall
Write-StrikeLog "Enabling Windows Firewall..." "INFO"
try {
    Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True -ErrorAction Stop
    Write-StrikeLog "Windows Firewall enabled" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to enable Windows Firewall: $_" "WARNING"
}

# Create rule for VM Agent
Write-StrikeLog "Creating firewall rule for VM Agent (port 8787)..." "INFO"
try {
    # Remove existing rule if present
    Remove-NetFirewallRule -DisplayName "Strike VM Agent" -ErrorAction SilentlyContinue
    
    New-NetFirewallRule -DisplayName "Strike VM Agent" `
        -Direction Inbound `
        -LocalPort 8787 `
        -Protocol TCP `
        -Action Allow `
        -ErrorAction Stop | Out-Null
    
    Write-StrikeLog "Firewall rule created for port 8787" "SUCCESS"
} catch {
    Write-StrikeLog "Failed to create firewall rule: $_" "ERROR"
}

# ============================================================================
# PHASE 7: Testing and Validation
# ============================================================================

Write-StrikeLog "=========== PHASE 7: Testing and Validation ===========" "INFO"

# Test health endpoint
Write-StrikeLog "Testing VM Agent health endpoint..." "INFO"
Start-Sleep -Seconds 2
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:8787/health" -Method Get -ErrorAction Stop
    
    if ($healthResponse.ok -eq $true) {
        Write-StrikeLog "Health endpoint test PASSED" "SUCCESS"
        Write-StrikeLog "  Hostname: $($healthResponse.hostname)" "INFO"
        Write-StrikeLog "  User: $($healthResponse.user)" "INFO"
        Write-StrikeLog "  Platform: $($healthResponse.platform)" "INFO"
    } else {
        throw "Health endpoint returned ok=false"
    }
} catch {
    Write-StrikeLog "Health endpoint test FAILED: $_" "ERROR"
}

# Test port listening
Write-StrikeLog "Verifying port 8787 is listening..." "INFO"
try {
    $listening = Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue
    if ($listening) {
        Write-StrikeLog "Port 8787 is listening" "SUCCESS"
    } else {
        throw "Port 8787 is not listening"
    }
} catch {
    Write-StrikeLog "Port test FAILED: $_" "ERROR"
}

# Get VM information
$vmHostname = $env:COMPUTERNAME
$vmUser = $env:USERNAME
$vmIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1).IPAddress

# ============================================================================
# PHASE 8: Generate Final Report
# ============================================================================

Write-StrikeLog "=========== PHASE 8: Generating Final Report ===========" "INFO"

$reportPath = "$StrikeDir\VM_SETUP_REPORT.md"

$report = @"
# STRIKE GAMING CLOUD - VM SETUP REPORT

**Date**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Status**: $( if ($Global:SetupErrors.Count -eq 0) { "✅ SUCCESS" } else { "⚠️ COMPLETED WITH WARNINGS" } )

---

## VM Information

- **Hostname**: $vmHostname
- **Username**: $vmUser
- **Private IP**: $vmIP
- **OS**: $(Get-WmiObject -Class Win32_OperatingSystem).Caption
- **OS Version**: $(Get-WmiObject -Class Win32_OperatingSystem).Version

---

## VM Agent Configuration

- **Port**: 8787
- **Status**: $( (pm2 jlist | ConvertFrom-Json | Where-Object { $_.name -eq "strike-vm-agent" }).pm2_env.status )
- **Token**: ``$token``
- **Directory**: $vmAgentDir

⚠️ **IMPORTANT**: Save this token securely! You'll need it for orchestrator configuration.

---

## Software Versions

- **Node.js**: $(node --version)
- **NPM**: $(npm --version)
- **PNPM**: $(pnpm --version)
- **PM2**: $(pm2 --version)
- **Git**: $(git --version)

---

## PM2 Status

``````
$(pm2 status)
``````

---

## Firewall Rules

``````
$(Get-NetFirewallRule -DisplayName "*Strike*" | Select-Object DisplayName, Direction, Action, Enabled | Format-Table -AutoSize | Out-String)
``````

---

## Network Ports

``````
$(Get-NetTCPConnection -LocalPort 8787 -ErrorAction SilentlyContinue | Format-Table -AutoSize | Out-String)
``````

---

## Setup Errors/Warnings

$( if ($Global:SetupErrors.Count -eq 0) { 
    "✅ No errors encountered"
} else { 
    $Global:SetupErrors | ForEach-Object { "- $_" } | Out-String
})

---

## Next Steps

### 1. Steam Login (MANUAL STEP REQUIRED)
1. Open Steam (should auto-start or run from Start Menu)
2. Login with your Steam account
3. Enable "Remember me"
4. Install at least one game for testing (e.g., Capcom Arcade Stadium - App ID 1515950)

### 2. Configure Orchestrator (on your local machine)
Update ``services/orchestrator-service/.env``:

``````env
VM_AGENT_URL=http://$vmIP:8787
VM_AGENT_TOKEN=$token
LAUNCH_DELAY_MS=1500
``````

### 3. Configure Azure NSG (from your local machine)
Restrict VM Agent port to orchestrator IP only:

``````bash
# Get your orchestrator public IP first
curl https://api.ipify.org

# Then update NSG rule
az network nsg rule update \
  --resource-group <your-rg> \
  --nsg-name <your-nsg> \
  --name AllowVMAgent \
  --source-address-prefixes <your-orchestrator-ip>
``````

### 4. Test End-to-End
From your orchestrator machine:

``````powershell
# Test health
curl http://$vmIP:8787/health

# Test launch (after Steam login)
`$headers = @{
    "X-Strike-Token" = "$token"
    "Content-Type" = "application/json"
}
`$body = @{ steamAppId = "1515950" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://$vmIP:8787/launch" ``
  -Method POST ``
  -Headers `$headers ``
  -Body `$body
``````

---

## Useful Commands

``````powershell
# View VM Agent logs
pm2 logs strike-vm-agent

# Restart VM Agent
pm2 restart strike-vm-agent

# Stop VM Agent
pm2 stop strike-vm-agent

# VM Agent status
pm2 status

# Test health endpoint
curl http://localhost:8787/health

# Check listening ports
netstat -ano | findstr :8787
``````

---

## Support

For issues, check:
- VM Agent logs: ``pm2 logs strike-vm-agent``
- Setup log: ``$StrikeDir\logs\setup-log.txt``
- Windows Event Viewer: System and Application logs

---

**Setup completed by**: Strike VM Setup Script v2.0  
**Log location**: $StrikeDir\logs\setup-log.txt
"@

$report | Out-File -FilePath $reportPath -Encoding UTF8 -Force
Write-StrikeLog "Final report saved to: $reportPath" "SUCCESS"

# Save setup log
$logPath = "$StrikeDir\logs\setup-log.txt"
$Global:SetupLog | Out-File -FilePath $logPath -Encoding UTF8 -Force
Write-StrikeLog "Setup log saved to: $logPath" "SUCCESS"

# ============================================================================
# Final Summary
# ============================================================================

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  ✅ SETUP COMPLETE!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VM Agent Status:" -ForegroundColor Yellow
pm2 status
Write-Host ""
Write-Host "VM Agent Token:" -ForegroundColor Yellow
Write-Host "  $token" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  SAVE THIS TOKEN - You need it for orchestrator configuration!" -ForegroundColor Red
Write-Host ""
Write-Host "Full report saved to:" -ForegroundColor Yellow
Write-Host "  $reportPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next manual steps:" -ForegroundColor Yellow
Write-Host "  1. Login to Steam" -ForegroundColor White
Write-Host "  2. Configure orchestrator .env with above token" -ForegroundColor White
Write-Host "  3. Restrict Azure NSG AllowVMAgent to orchestrator IP" -ForegroundColor White
Write-Host "  4. Test end-to-end from frontend" -ForegroundColor White
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan

if ($Global:SetupErrors.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Warnings/Errors encountered:" -ForegroundColor Yellow
    $Global:SetupErrors | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
    Write-Host ""
}
