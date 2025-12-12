# Strike VM Agent

Lightweight agent that runs on Windows VMs to launch Steam games and manage game processes.

## Features

- ✅ Steam game launching via `steam://rungameid/<appId>`
- ✅ VM health reporting
- ✅ Token-based authentication
- ✅ Windows-specific PowerShell integration
- ✅ NO external dependencies (Sunshine/Apollo/Parsec)

## Prerequisites

- Windows VM with Steam installed and logged in
- Node.js 18+ installed
- PowerShell available
- Network access on port 8787

## Installation (on Windows VM)

1. **Copy this folder to VM**:
   ```powershell
   # Example: C:\Strike\vm-agent\
   ```

2. **Install dependencies**:
   ```powershell
   cd C:\Strike\vm-agent
   pnpm install
   # or: npm install
   ```

3. **Create `.env` file**:
   ```powershell
   cp .env.example .env
   ```

4. **Generate strong token**:
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   Copy the output and set it in `.env`:
   ```
   VM_AGENT_TOKEN=<paste-generated-token-here>
   ```

5. **Configure Windows Firewall**:
   ```powershell
   # Allow inbound on port 8787
   New-NetFirewallRule -DisplayName "Strike VM Agent" `
     -Direction Inbound `
     -LocalPort 8787 `
     -Protocol TCP `
     -Action Allow
   ```

6. **Test locally**:
   ```powershell
   pnpm dev
   ```
   
   Should see:
   ```
   [VM Agent] ✅ Server listening on http://0.0.0.0:8787
   [VM Agent] Ready to receive launch requests
   ```

## Running

### Development
```powershell
pnpm dev
```

### Production
```powershell
# Build
pnpm build

# Run
pnpm start
```

### As Windows Service (Recommended)
Use `pm2` or `nssm` to run as Windows service:

**With PM2**:
```powershell
npm install -g pm2
pm2 start dist/index.js --name strike-vm-agent
pm2 save
pm2 startup
```

**With NSSM**:
```powershell
nssm install StrikeVMAgent "C:\Program Files\nodejs\node.exe" "C:\Strike\vm-agent\dist\index.js"
nssm start StrikeVMAgent
```

## API Endpoints

### GET /health
Returns VM health information (no auth required for health checks).

**Response**:
```json
{
  "ok": true,
  "hostname": "STRIKE-VM-01",
  "user": "Administrator",
  "uptime": 12345,
  "time": "2024-12-12T15:00:00.000Z",
  "platform": "win32",
  "release": "10.0.22621"
}
```

### POST /launch
Launches a Steam game.

**Headers**:
```
X-Strike-Token: <your-vm-agent-token>
Content-Type: application/json
```

**Body**:
```json
{
  "steamAppId": "1515950"
}
```

**Response (Success)**:
```json
{
  "ok": true,
  "steamAppId": 1515950
}
```

**Response (Error)**:
```json
{
  "ok": false,
  "error": "PowerShell exit code 1: ..."
}
```

### POST /focus (stub)
Brings game window to foreground.

**Status**: 501 Not Implemented (planned for future)

### POST /kill (stub)
Terminates game process.

**Status**: 501 Not Implemented (planned for future)

## Testing Manually

### 1. Check health
```powershell
curl http://localhost:8787/health
```

### 2. Launch Capcom Arcade Stadium
```powershell
$token = "your-token-here"
$body = @{ steamAppId = "1515950" } | ConvertTo-Json

curl -Method POST `
  -Uri "http://localhost:8787/launch" `
  -Headers @{ "X-Strike-Token" = $token; "Content-Type" = "application/json" } `
  -Body $body
```

Expected: Steam opens Capcom Arcade Stadium.

## Security

### Network Security
1. **Windows Firewall**: Allow port 8787 inbound
2. **Azure NSG**: Allow port 8787 ONLY from orchestrator IP or VNet
3. **Token**: Use strong random token (32+ characters)

### Azure NSG Rule Example
```bash
az network nsg rule create \
  --resource-group strike-rg \
  --nsg-name strike-vm-nsg \
  --name AllowVMAgent \
  --priority 1000 \
  --source-address-prefixes <orchestrator-ip> \
  --destination-port-ranges 8787 \
  --protocol Tcp \
  --access Allow
```

### ⚠️ IMPORTANT
- Never expose port 8787 to public internet
- Rotate tokens periodically
- Monitor logs for unauthorized access attempts

## Logs

By default, logs go to stdout/console. For production:

```powershell
# Redirect to file
pnpm start > vm-agent.log 2>&1

# Or use PM2
pm2 logs strike-vm-agent
```

## Troubleshooting

### Port 8787 already in use
```powershell
# Find process using port
netstat -ano | findstr :8787

# Kill it
taskkill /F /PID <pid>
```

### Steam not launching
1. Ensure Steam is running and logged in
2. Test manually: `steam://rungameid/1515950`
3. Check PowerShell execution policy: `Get-ExecutionPolicy`

### Firewall blocking
```powershell
# Test from orchestrator machine
Test-NetConnection -ComputerName <vm-ip> -Port 8787
```

## Development

### Project Structure
```
services/vm-agent/
├── src/
│   └── index.ts       # Main server
├── dist/              # Compiled JS (after build)
├── package.json
├── tsconfig.json
├── .env               # Your config (gitignored)
└── README.md
```

### Dependencies
- `fastify` - HTTP server
- `dotenv` - Environment variables
- `child_process` - PowerShell execution

### Adding New Endpoints
1. Add route in `src/index.ts`
2. Add `preHandler: authenticateToken` for protected routes
3. Update this README
4. Rebuild: `pnpm build`

## License

MIT

## Support

For issues, contact Strike Platform Team.

---

**Version**: 1.0.0  
**Last Updated**: December 12, 2024
