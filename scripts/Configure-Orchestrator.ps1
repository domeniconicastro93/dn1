# Strike Orchestrator Configuration Script
# Run this to configure the orchestrator with Azure VM Agent connection

$envFile = "c:\Users\Domi\Desktop\Strike Antigravity\services\orchestrator-service\.env"

$envContent = @"
# VM Agent Configuration (Azure VM)
VM_AGENT_URL=http://108.142.237.74:8787
VM_AGENT_TOKEN=sQPMek5lpiKNHGVqLCjoRTyhdJmDtcFg3uxYIzaXn46wrZWUb19BSv08O72fAE
LAUNCH_DELAY_MS=1500

# Orchestrator Server
PORT=3012
NODE_ENV=development

# Database (local PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/strike_gaming_cloud?schema=public

# Logging
LOG_LEVEL=info
"@

$envContent | Out-File -FilePath $envFile -Encoding UTF8 -Force

Write-Host "✅ Orchestrator .env configured with Azure VM Agent!" -ForegroundColor Green
Write-Host "   VM_AGENT_URL: http://108.142.237.74:8787" -ForegroundColor Cyan
Write-Host "   VM_AGENT_TOKEN: sQPM...AE (configured)" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Test VM Agent connectivity: curl http://108.142.237.74:8787/health" -ForegroundColor White
Write-Host "2. Start orchestrator: cd services\orchestrator-service && pnpm dev" -ForegroundColor White
