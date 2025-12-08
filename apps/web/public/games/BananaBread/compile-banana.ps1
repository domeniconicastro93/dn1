# Script per compilare BananaBread su Windows
# Richiede: Python, Git, Emscripten SDK

Write-Host "=== BananaBread Compilation Script ===" -ForegroundColor Cyan

$ErrorActionPreference = "Stop"

# Percorsi
$bananaPath = $PSScriptRoot
$emsdkPath = Join-Path $bananaPath "emsdk"
$cube2Path = Join-Path $bananaPath "cube2"
$srcWebPath = Join-Path $cube2Path "src\web"

# Verifica Python
Write-Host "`n[1/5] Verificando Python..." -ForegroundColor Yellow
$pythonPath = "C:\Users\Domi\AppData\Local\Programs\Python\Python312\python.exe"
if (-not (Test-Path $pythonPath)) {
    Write-Host "ERRORE: Python non trovato!" -ForegroundColor Red
    exit 1
}
Write-Host "Python trovato: $pythonPath" -ForegroundColor Green

# Verifica Emscripten
Write-Host "`n[2/5] Verificando Emscripten SDK..." -ForegroundColor Yellow
if (-not (Test-Path $emsdkPath)) {
    Write-Host "Emscripten SDK non trovato. Clonando..." -ForegroundColor Yellow
    Set-Location $bananaPath
    git clone https://github.com/emscripten-core/emsdk.git
}

# Attiva Emscripten
Write-Host "Attivando Emscripten..." -ForegroundColor Yellow
Set-Location $emsdkPath
& $pythonPath emsdk.py activate latest | Out-Null

# Carica variabili d'ambiente
$env:EMSDK = $emsdkPath
$env:EMSDK_PYTHON = Join-Path $emsdkPath "python\3.13.3_64bit\python.exe"
$env:EMSDK_NODE = Join-Path $emsdkPath "node\22.16.0_64bit\bin\node.exe"
$env:Path = "$emsdkPath\upstream\emscripten;$env:Path"

# Verifica make
Write-Host "`n[3/5] Verificando make..." -ForegroundColor Yellow
$makeAvailable = $false

# Prova vari percorsi per make
$makePaths = @(
    "C:\Program Files\Git\usr\bin\make.exe",
    "C:\msys64\usr\bin\make.exe",
    "C:\MinGW\bin\mingw32-make.exe"
)

foreach ($makePath in $makePaths) {
    if (Test-Path $makePath) {
        $env:Path = "$(Split-Path $makePath -Parent);$env:Path"
        $makeAvailable = $true
        Write-Host "make trovato: $makePath" -ForegroundColor Green
        break
    }
}

if (-not $makeAvailable) {
    Write-Host "`nERRORE: make non trovato!" -ForegroundColor Red
    Write-Host "`nOpzioni per installare make:" -ForegroundColor Yellow
    Write-Host "1. Installa MSYS2: https://www.msys2.org/" -ForegroundColor Cyan
    Write-Host "2. Installa Git for Windows (include make)" -ForegroundColor Cyan
    Write-Host "3. Usa WSL: wsl --install" -ForegroundColor Cyan
    Write-Host "`nDopo l'installazione, esegui di nuovo questo script." -ForegroundColor Yellow
    exit 1
}

# Compila BananaBread
Write-Host "`n[4/5] Compilando BananaBread..." -ForegroundColor Yellow
Write-Host "Questo potrebbe richiedere 10-30 minuti..." -ForegroundColor Yellow

Set-Location $srcWebPath

# Usa emmake per compilare
$emmakePath = Join-Path $emsdkPath "upstream\emscripten\emmake.py"
& $env:EMSDK_PYTHON $emmakePath make client -j4

if ($LASTEXITCODE -ne 0) {
    Write-Host "`nERRORE durante la compilazione!" -ForegroundColor Red
    exit 1
}

# Verifica file generati
Write-Host "`n[5/5] Verificando file compilati..." -ForegroundColor Yellow
$bbHtml = Join-Path $cube2Path "bb.html"
$bbJs = Join-Path $cube2Path "bb.js"

if ((Test-Path $bbHtml) -and (Test-Path $bbJs)) {
    Write-Host "`n✓ Compilazione completata con successo!" -ForegroundColor Green
    Write-Host "File generati:" -ForegroundColor Green
    Write-Host "  - $bbHtml" -ForegroundColor Cyan
    Write-Host "  - $bbJs" -ForegroundColor Cyan
    Write-Host "`nPuoi ora testare il gioco visitando /arcade/bananabread" -ForegroundColor Green
} else {
    Write-Host "`nATTENZIONE: I file compilati non sono stati trovati!" -ForegroundColor Yellow
    Write-Host "Controlla i log sopra per errori." -ForegroundColor Yellow
}

