# PHASE 0 - SYSTEM READINESS COMMANDS
# Copy and paste these on the VM (PowerShell as Administrator)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STRIKE VM - PHASE 0: SYSTEM READINESS" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 0.1 - Basic System Info
Write-Host "[0.1] Basic System Info..." -ForegroundColor Yellow
$os = Get-ComputerInfo | Select-Object OsName, OsVersion, OsBuildNumber, WindowsProductName, CsName
Write-Host "  OS: $($os.OsName)" -ForegroundColor White
Write-Host "  Version: $($os.OsVersion)" -ForegroundColor White
Write-Host "  Build: $($os.OsBuildNumber)" -ForegroundColor White
Write-Host "  Product: $($os.WindowsProductName)" -ForegroundColor White
Write-Host "  Computer: $($os.CsName)" -ForegroundColor White
Write-Host "  User: $(whoami)" -ForegroundColor White

# 0.2 - GPU Detection
Write-Host "`n[0.2] GPU Detection..." -ForegroundColor Yellow
$gpus = Get-WmiObject Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion, Status
foreach ($gpu in $gpus) {
    Write-Host "  GPU: $($gpu.Name)" -ForegroundColor Green
    Write-Host "    RAM: $([math]::Round($gpu.AdapterRAM/1GB, 2)) GB" -ForegroundColor White
    Write-Host "    Driver: $($gpu.DriverVersion)" -ForegroundColor White
    Write-Host "    Status: $($gpu.Status)" -ForegroundColor White
}

# Count GPUs
$gpuCount = ($gpus | Measure-Object).Count
Write-Host "  Total GPUs: $gpuCount" -ForegroundColor Cyan

# 0.3 - Desktop Session
Write-Host "`n[0.3] Desktop Session..." -ForegroundColor Yellow
$sessions = query user 2>$null
if ($sessions) {
    Write-Host "  Active sessions:" -ForegroundColor White
    $sessions | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
}
else {
    Write-Host "  No active sessions found" -ForegroundColor Red
}

$explorer = Get-Process explorer -ErrorAction SilentlyContinue
if ($explorer) {
    Write-Host "  Explorer.exe: RUNNING" -ForegroundColor Green
}
else {
    Write-Host "  Explorer.exe: NOT RUNNING" -ForegroundColor Red
}

# 0.4 - Audio Devices
Write-Host "`n[0.4] Audio Devices..." -ForegroundColor Yellow
$audioDevices = Get-PnpDevice -Class AudioEndpoint | Where-Object { $_.Status -eq "OK" }
if ($audioDevices) {
    foreach ($device in $audioDevices) {
        Write-Host "  Audio: $($device.FriendlyName) - $($device.Status)" -ForegroundColor Green
    }
    Write-Host "  Total audio devices: $($audioDevices.Count)" -ForegroundColor Cyan
}
else {
    Write-Host "  No audio devices found" -ForegroundColor Red
}

# 0.5 - Network & Firewall
Write-Host "`n[0.5] Network & Firewall..." -ForegroundColor Yellow

# Get network info
$network = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -ne "127.0.0.1" } | Select-Object -First 1
Write-Host "  Private IP: $($network.IPAddress)" -ForegroundColor White
Write-Host "  Interface: $($network.InterfaceAlias)" -ForegroundColor White

# Public IP (requires internet)
try {
    $publicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing -TimeoutSec 5).Content
    Write-Host "  Public IP: $publicIP" -ForegroundColor White
}
catch {
    Write-Host "  Public IP: Could not retrieve" -ForegroundColor Yellow
}

# Check firewall
Write-Host "`n  Firewall Profiles:" -ForegroundColor White
Get-NetFirewallProfile | Select-Object Name, Enabled | ForEach-Object {
    $status = if ($_.Enabled) { "ENABLED" } else { "DISABLED" }
    $color = if ($_.Enabled) { "Green" } else { "Yellow" }
    Write-Host "    $($_.Name): $status" -ForegroundColor $color
}

# Check open ports
Write-Host "`n  Listening Ports (RDP, VM Agent, Streaming):" -ForegroundColor White
$ports = @(3389, 8787, 47990)
foreach ($port in $ports) {
    $listening = Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue
    if ($listening) {
        Write-Host "    Port $port : LISTENING" -ForegroundColor Green
    }
    else {
        Write-Host "    Port $port : NOT LISTENING" -ForegroundColor Yellow
    }
}

# 0.6 - Disk Space
Write-Host "`n[0.6] Disk Space..." -ForegroundColor Yellow
$disk = Get-PSDrive C
$freeGB = [math]::Round($disk.Free / 1GB, 2)
$usedGB = [math]::Round($disk.Used / 1GB, 2)
$totalGB = [math]::Round(($disk.Used + $disk.Free) / 1GB, 2)
$percentFree = [math]::Round(($disk.Free / ($disk.Used + $disk.Free)) * 100, 1)

Write-Host "  C:\ Drive" -ForegroundColor White
Write-Host "    Total: $totalGB GB" -ForegroundColor White
Write-Host "    Used: $usedGB GB" -ForegroundColor White
Write-Host "    Free: $freeGB GB ($percentFree%)" -ForegroundColor $(if ($percentFree -gt 20) { "Green" } else { "Red" })

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PHASE 0 READINESS CHECK COMPLETE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Generate summary
$readiness = @{
    OS       = $os.OsName
    GPUs     = $gpuCount
    Desktop  = if ($explorer) { "Active" } else { "Inactive" }
    Audio    = if ($audioDevices) { "Available" } else { "Not Available" }
    DiskFree = "$freeGB GB"
    Status   = "READY"
}

# Check for blockers
$blockers = @()
if (!$gpus) { $blockers += "No GPU detected" }
if (!$explorer) { $blockers += "Desktop session inactive" }
if (!$audioDevices) { $blockers += "No audio devices" }
if ($percentFree -lt 10) { $blockers += "Low disk space" }

if ($blockers.Count -gt 0) {
    Write-Host "BLOCKERS FOUND:" -ForegroundColor Red
    foreach ($blocker in $blockers) {
        Write-Host "  - $blocker" -ForegroundColor Red
    }
    $readiness.Status = "BLOCKED"
}
else {
    Write-Host "NO BLOCKERS - System ready for validation!" -ForegroundColor Green
}

Write-Host "`nNext: Report these results to continue with Phase 1" -ForegroundColor Cyan
