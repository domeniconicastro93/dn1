# ============================================================================
# STRIKE GAMING CLOUD - Azure VM Creation Script
# ============================================================================
# This script creates a Windows VM optimized for cloud gaming on Azure
# ============================================================================

param(
    [string]$ResourceGroup = "strike-gaming-rg",
    [string]$Location = "westeurope",
    [string]$VMName = "strike-gaming-vm",
    [string]$VMSize = "Standard_NV6ads_A10_v5", # NVIDIA A10 GPU
    [string]$AdminUsername = "strikeadmin",
    [string]$AdminPassword = "", # Will prompt if not provided
    [string]$VMImage = "MicrosoftWindowsServer:WindowsServer:2022-datacenter-azure-edition:latest"
)

Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  STRIKE GAMING CLOUD - Azure VM Setup" -ForegroundColor Cyan
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""

# Check if Azure CLI is installed
Write-Host "[1/10] Checking Azure CLI..." -ForegroundColor Yellow
try {
    $azVersion = az version --query '\"azure-cli\"' -o tsv 2>$null
    Write-Host "✅ Azure CLI version: $azVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Azure CLI not found. Please install from: https://aka.ms/installazurecliwindows" -ForegroundColor Red
    exit 1
}

# Check if logged in
Write-Host "[2/10] Checking Azure login..." -ForegroundColor Yellow
$account = az account show 2>$null
if (!$account) {
    Write-Host "⚠️  Not logged in. Logging in..." -ForegroundColor Yellow
    az login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed" -ForegroundColor Red
        exit 1
    }
}
$accountInfo = az account show | ConvertFrom-Json
Write-Host "✅ Logged in as: $($accountInfo.user.name)" -ForegroundColor Green
Write-Host "   Subscription: $($accountInfo.name)" -ForegroundColor Gray

# Prompt for password if not provided
if ([string]::IsNullOrEmpty($AdminPassword)) {
    Write-Host ""
    $securePassword = Read-Host "Enter VM Administrator Password" -AsSecureString
    $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
    $AdminPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
}

# Create Resource Group
Write-Host ""
Write-Host "[3/10] Creating Resource Group: $ResourceGroup..." -ForegroundColor Yellow
$rgExists = az group exists --name $ResourceGroup
if ($rgExists -eq "true") {
    Write-Host "⚠️  Resource Group already exists, using existing" -ForegroundColor Yellow
} else {
    az group create --name $ResourceGroup --location $Location --output none
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Resource Group created" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to create Resource Group" -ForegroundColor Red
        exit 1
    }
}

# Create Network Security Group
Write-Host "[4/10] Creating Network Security Group..." -ForegroundColor Yellow
az network nsg create `
    --resource-group $ResourceGroup `
    --name "${VMName}-nsg" `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ NSG created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create NSG" -ForegroundColor Red
    exit 1
}

# Get your public IP for RDP restriction
Write-Host "[5/10] Getting your public IP for RDP restriction..." -ForegroundColor Yellow
try {
    $myPublicIP = (Invoke-WebRequest -Uri "https://api.ipify.org" -UseBasicParsing).Content.Trim()
    Write-Host "✅ Your public IP: $myPublicIP" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Could not get public IP, RDP will be open to all (less secure)" -ForegroundColor Yellow
    $myPublicIP = "*"
}

# Create NSG Rules
Write-Host "[6/10] Creating firewall rules..." -ForegroundColor Yellow

# RDP (restricted to your IP)
az network nsg rule create `
    --resource-group $ResourceGroup `
    --nsg-name "${VMName}-nsg" `
    --name "AllowRDP" `
    --priority 100 `
    --source-address-prefixes $myPublicIP `
    --destination-port-ranges 3389 `
    --protocol Tcp `
    --access Allow `
    --description "Allow RDP from admin IP" `
    --output none

# VM Agent (will be restricted later to orchestrator IP)
az network nsg rule create `
    --resource-group $ResourceGroup `
    --nsg-name "${VMName}-nsg" `
    --name "AllowVMAgent" `
    --priority 200 `
    --source-address-prefixes "*" `
    --destination-port-ranges 8787 `
    --protocol Tcp `
    --access Allow `
    --description "Allow VM Agent (restrict to orchestrator IP later)" `
    --output none

Write-Host "✅ Firewall rules created" -ForegroundColor Green

# Create Public IP
Write-Host "[7/10] Creating Public IP address..." -ForegroundColor Yellow
az network public-ip create `
    --resource-group $ResourceGroup `
    --name "${VMName}-ip" `
    --sku Standard `
    --allocation-method Static `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Public IP created" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create Public IP" -ForegroundColor Red
    exit 1
}

# Create VM
Write-Host "[8/10] Creating VM (this may take 5-10 minutes)..." -ForegroundColor Yellow
Write-Host "   VM Name: $VMName" -ForegroundColor Gray
Write-Host "   VM Size: $VMSize" -ForegroundColor Gray
Write-Host "   Image: $VMImage" -ForegroundColor Gray

az vm create `
    --resource-group $ResourceGroup `
    --name $VMName `
    --image $VMImage `
    --size $VMSize `
    --admin-username $AdminUsername `
    --admin-password $AdminPassword `
    --nsg "${VMName}-nsg" `
    --public-ip-address "${VMName}-ip" `
    --public-ip-sku Standard `
    --storage-sku Premium_LRS `
    --os-disk-size-gb 512 `
    --boot-diagnostics `
    --output none

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ VM created successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to create VM" -ForegroundColor Red
    exit 1
}

# Install NVIDIA GPU drivers (for gaming VM sizes)
if ($VMSize -like "*NV*") {
    Write-Host "[9/10] Installing NVIDIA GPU drivers..." -ForegroundColor Yellow
    az vm extension set `
        --resource-group $ResourceGroup `
        --vm-name $VMName `
        --name NvidiaGpuDriverWindows `
        --publisher Microsoft.HpcCompute `
        --version 1.4 `
        --output none
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ GPU drivers installation started (will complete in background)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  GPU driver installation failed, you may need to install manually" -ForegroundColor Yellow
    }
}

# Get VM details
Write-Host "[10/10] Retrieving VM information..." -ForegroundColor Yellow
$vmDetails = az vm show --resource-group $ResourceGroup --name $VMName --show-details | ConvertFrom-Json

Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host "  ✅ VM CREATED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "===========================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VM Details:" -ForegroundColor Yellow
Write-Host "  Resource Group: $ResourceGroup" -ForegroundColor White
Write-Host "  VM Name: $VMName" -ForegroundColor White
Write-Host "  Location: $Location" -ForegroundColor White
Write-Host "  Size: $VMSize" -ForegroundColor White
Write-Host "  Public IP: $($vmDetails.publicIps)" -ForegroundColor Cyan
Write-Host "  Private IP: $($vmDetails.privateIps)" -ForegroundColor White
Write-Host "  Admin Username: $AdminUsername" -ForegroundColor White
Write-Host ""
Write-Host "RDP Connection:" -ForegroundColor Yellow
Write-Host "  mstsc /v:$($vmDetails.publicIps)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Connect via RDP to the VM" -ForegroundColor White
Write-Host "  2. Copy Strike-VM-Setup.ps1 to the VM" -ForegroundColor White
Write-Host "  3. Run the setup script as Administrator" -ForegroundColor White
Write-Host "  4. Update NSG rule 'AllowVMAgent' to restrict to orchestrator IP" -ForegroundColor White
Write-Host ""

# Save VM info to file
$vmInfo = @{
    ResourceGroup = $ResourceGroup
    VMName = $VMName
    Location = $Location
    Size = $VMSize
    PublicIP = $vmDetails.publicIps
    PrivateIP = $vmDetails.privateIps
    AdminUsername = $AdminUsername
    CreatedAt = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$vmInfoPath = Join-Path $PSScriptRoot "azure-vm-info.json"
$vmInfo | ConvertTo-Json | Out-File -FilePath $vmInfoPath -Encoding UTF8

Write-Host "VM information saved to: $vmInfoPath" -ForegroundColor Gray
Write-Host ""
Write-Host "===========================================================" -ForegroundColor Cyan
