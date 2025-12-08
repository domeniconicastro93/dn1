# GAME LAUNCH TEST - QUICK INSTRUCTIONS
## Test Sunshine Game Launch with Basic Auth

**Date**: 2025-12-05 15:25
**Status**: READY TO TEST

---

## 🎯 OBIETTIVO

Testare il lancio di un gioco Steam tramite Sunshine usando Basic Auth (senza pairing).

---

## 📋 ISTRUZIONI RAPIDE

### Opzione A: Test Manuale con cURL

**Dalla tua macchina locale**, apri PowerShell e esegui:

```powershell
$username = "strike"
$password = "Nosmoking93!!"
$credentials = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${username}:${password}"))

$headers = @{
    "Authorization" = "Basic $credentials"
    "Content-Type" = "application/json"
}

$body = @{
    app = "steam://rungameid/1515950"
} | ConvertTo-Json

Invoke-WebRequest -Uri "https://20.31.130.73:47985/api/launch" `
    -Method POST `
    -Headers $headers `
    -Body $body `
    -SkipCertificateCheck
```

### Opzione B: Aggiungi Endpoint di Test

1. **Apri** `services/orchestrator-service/src/index.ts`

2. **Trova** la riga `// Register session routes` (circa linea 161)

3. **Incolla PRIMA di quella riga** il codice da:
   `services/orchestrator-service/LAUNCH_ENDPOINT_SNIPPET.txt`

4. **Riavvia** Orchestrator:
   ```powershell
   # Ctrl+C per fermare
   pnpm run dev
   ```

5. **Testa**:
   ```
   http://localhost:3012/test/sunshine/launch
   ```

---

## ✅ RISULTATI ATTESI

### Se Funziona ✅

**Browser mostrerà**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "steamAppId": "1515950",
    "response": "...",
    "message": "Game launch successful"
  }
}
```

**Sulla VM**:
- Steam si avvia
- Capcom Arcade Stadium si lancia
- Il gioco è visibile

### Se NON Funziona ❌

**Possibili errori**:

1. **404 Not Found** → Endpoint `/api/launch` non esiste
   - Prova `/api/start` o `/api/apps/launch`

2. **401 Unauthorized** → Credenziali errate
   - Verifica username/password

3. **500 Internal Server Error** → Errore lato Sunshine
   - Controlla log Sunshine sulla VM

---

## 🔍 DEBUG

### Verifica Endpoint Disponibili

**Browser**:
```
https://20.31.130.73:47985/api/apps
```

Questo ti mostra le app configurate e potrebbe rivelare endpoint alternativi.

### Verifica Configurazione Sunshine

**Sulla VM**, apri:
```
https://localhost:47990
```

Vai su **Configuration** → **Applications** e verifica che ci sia un'app configurata per Steam.

---

## 🎯 PROSSIMI PASSI

1. **Testa con cURL** (Opzione A) per verificare che Sunshine accetti il comando
2. Se funziona, **aggiungi endpoint** (Opzione B)
3. Se non funziona, **controlla endpoint alternativi**

---

**INIZIA CON OPZIONE A (cURL) PER TEST RAPIDO!** 🚀
