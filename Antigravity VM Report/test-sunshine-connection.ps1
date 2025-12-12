# ========================================
# STRIKE - SUNSHINE CONNECTION TEST SCRIPT
# ========================================

Write-Host "🎮 Strike Gaming Cloud - Sunshine Connection Test" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$sunshineHost = "20.31.130.73"
$sunshinePortHTTPS = 47990
$sunshinePortHTTP = 47985
$username = "strike"
$password = "Nosmoking93!!"

# Create credentials
$base64Auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))
$headers = @{
    "Authorization" = "Basic $base64Auth"
}

Write-Host "📋 Configuration:" -ForegroundColor Yellow
Write-Host "  Host: $sunshineHost" -ForegroundColor White
Write-Host "  HTTPS Port: $sunshinePortHTTPS" -ForegroundColor White
Write-Host "  HTTP Port: $sunshinePortHTTP" -ForegroundColor White
Write-Host "  Username: $username" -ForegroundColor White
Write-Host ""

# Test 1: HTTPS API Connection
Write-Host "🔍 Test 1: HTTPS API Connection (Port $sunshinePortHTTPS)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://${sunshineHost}:${sunshinePortHTTPS}/api/apps" `
        -Headers $headers `
        -SkipCertificateCheck `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "  ✅ HTTPS API Connection: SUCCESS" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor White
    Write-Host "  Response Length: $($response.Content.Length) bytes" -ForegroundColor White
} catch {
    Write-Host "  ❌ HTTPS API Connection: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: HTTP API Connection
Write-Host "🔍 Test 2: HTTP API Connection (Port $sunshinePortHTTP)" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${sunshineHost}:${sunshinePortHTTP}/api/apps" `
        -Headers $headers `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "  ✅ HTTP API Connection: SUCCESS" -ForegroundColor Green
    Write-Host "  Status Code: $($response.StatusCode)" -ForegroundColor White
    Write-Host "  Response Length: $($response.Content.Length) bytes" -ForegroundColor White
} catch {
    Write-Host "  ❌ HTTP API Connection: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Get Apps List
Write-Host "🔍 Test 3: Get Available Apps" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "https://${sunshineHost}:${sunshinePortHTTPS}/api/apps" `
        -Headers $headers `
        -SkipCertificateCheck `
        -TimeoutSec 10 `
        -ErrorAction Stop
    
    Write-Host "  ✅ Apps List Retrieved: SUCCESS" -ForegroundColor Green
    
    if ($response.apps) {
        Write-Host "  Available Apps:" -ForegroundColor White
        foreach ($app in $response.apps) {
            Write-Host "    - $($app.name)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "  No apps found in response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Get Apps List: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Ping Test
Write-Host "🔍 Test 4: Network Ping Test" -ForegroundColor Yellow
try {
    $pingResult = Test-Connection -ComputerName $sunshineHost -Count 4 -ErrorAction Stop
    $avgTime = ($pingResult | Measure-Object -Property ResponseTime -Average).Average
    
    Write-Host "  ✅ Ping Test: SUCCESS" -ForegroundColor Green
    Write-Host "  Average Response Time: $([math]::Round($avgTime, 2))ms" -ForegroundColor White
} catch {
    Write-Host "  ❌ Ping Test: FAILED" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Port Connectivity
Write-Host "🔍 Test 5: Port Connectivity Test" -ForegroundColor Yellow
$ports = @(47984, 47985, 47989, 47990)
foreach ($port in $ports) {
    try {
        $tcpClient = New-Object System.Net.Sockets.TcpClient
        $tcpClient.Connect($sunshineHost, $port)
        Write-Host "  ✅ Port $port : OPEN" -ForegroundColor Green
        $tcpClient.Close()
    } catch {
        Write-Host "  ❌ Port $port : CLOSED" -ForegroundColor Red
    }
}
Write-Host ""

# Summary
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🎯 Test Summary Complete!" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. If all tests passed, Strike can connect to Sunshine ✅" -ForegroundColor White
Write-Host "  2. If tests failed, check firewall and NSG settings ⚠️" -ForegroundColor White
Write-Host "  3. Restart Orchestrator Service to apply new config 🔄" -ForegroundColor White
Write-Host ""
