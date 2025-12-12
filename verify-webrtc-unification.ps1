#!/usr/bin/env pwsh
# WEBRTC Unification Verification Script

Write-Host "🔍 WEBRTC FLOW UNIFICATION AUDIT" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

$violations = 0

# Test 1: Check orchestrator for :3015 references
Write-Host "Test 1: Checking orchestrator for :3015..." -ForegroundColor Yellow
$orchestratorRefs = Select-String -Path "services\orchestrator-service\src\*.ts" -Pattern ":3015" -Exclude "webrtc-client.ts"
if ($orchestratorRefs.Count -gt 0) {
    Write-Host "❌ FAIL: Found :3015 outside webrtc-client.ts" -ForegroundColor Red
    $orchestratorRefs | ForEach-Object { Write-Host "   $_" -ForegroundColor Gray }
    $violations++
} else {
    Write-Host "✅ PASS: No :3015 references outside webrtc-client.ts" -ForegroundColor Green
}
Write-Host ""

# Test 2: Check for direct fetch calls to webrtc service in orchestrator
Write-Host "Test 2: Checking for direct fetch to /webrtc/session/..." -ForegroundColor Yellow
$directFetch = Select-String -Path "services\orchestrator-service\src\index.ts" -Pattern "fetch.*\/webrtc\/session\/"
if ($directFetch.Count -gt 0) {
    Write-Host "❌ FAIL: Found direct fetch calls in index.ts" -ForegroundColor Red
    $directFetch | ForEach-Object { Write-Host "   Line $($_.LineNumber): $($_.Line.Trim())" -ForegroundColor Gray }
    $violations++
} else {
    Write-Host "✅ PASS: No direct fetch calls in index.ts" -ForegroundColor Green
}
Write-Host ""

# Test 3: Check frontend for :3015 references
Write-Host "Test 3: Checking frontend for :3015..." -ForegroundColor Yellow
$frontendRefs = Select-String -Path "apps\web\**\*.tsx" -Pattern "localhost:3015" -Recurse
if ($frontendRefs.Count -gt 0) {
    Write-Host "❌ FAIL: Frontend references :3015 directly" -ForegroundColor Red
    $frontendRefs | ForEach-Object { Write-Host "   $($_.Filename):$($_.LineNumber)" -ForegroundColor Gray }
    $violations++
} else {
    Write-Host "✅ PASS: Frontend doesn't reference :3015" -ForegroundColor Green
}
Write-Host ""

# Test 4: Verify webrtc-client.ts exists and has the URL
Write-Host "Test 4: Verifying webrtc-client.ts..." -ForegroundColor Yellow
if (Test-Path "services\orchestrator-service\src\core\webrtc-client.ts") {
    $clientHasUrl = Select-String -Path "services\orchestrator-service\src\core\webrtc-client.ts" -Pattern "WEBRTC_SERVICE_URL"
    if ($clientHasUrl) {
        Write-Host "✅ PASS: webrtc-client.ts has WEBRTC_SERVICE_URL" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL: webrtc-client.ts missing WEBRTC_SERVICE_URL" -ForegroundColor Red
        $violations++
    }
} else {
    Write-Host "❌ FAIL: webrtc-client.ts not found" -ForegroundColor Red
    $violations++
}
Write-Host ""

# Summary
Write-Host "=================================" -ForegroundColor Cyan
if ($violations -eq 0) {
    Write-Host "✅ ALL TESTS PASSED - Flow is unified!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Architecture:" -ForegroundColor Cyan
    Write-Host "  Frontend → Orchestrator (:3012) → webrtc-client → webrtc-service (:3015)" -ForegroundColor White
} else {
    Write-Host "❌ $violations VIOLATIONS FOUND" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review WEBRTC_UNIFICATION_AUDIT.md for fixes" -ForegroundColor Yellow
}
Write-Host "=================================" -ForegroundColor Cyan
