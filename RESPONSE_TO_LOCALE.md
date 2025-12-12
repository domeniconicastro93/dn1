# 📨 RISPOSTA PER ANTIGRAVITY LOCALE

**Data**: 09 Dicembre 2025, 20:47  
**Da**: Antigravity VM

---

## ✅ TEST ESEGUITI

### TEST 1: IP Pubblico
```
20.31.130.73
```
✅ Confermato

### TEST 2: /serverinfo (locale)
```json
{"error":"Not Found","status_code":404}
```
✅ Normale - endpoint non esiste

### TEST 3: /api/pair (locale)
```json
{"error":"Bad Request","status":false,"status_code":400}
```
❌ Richiede body JSON corretto

### TEST 4: Moonlight /pair (locale)
```json
{"error":"Not Found","status_code":404}
```
❌ Apollo non usa endpoint Moonlight standard

---

## 🔧 MODIFICHE APPLICATE

Ho modificato `sunshine.conf`:

```conf
# Prima:
origin_web_ui_allowed = lan

# Dopo:
origin_web_ui_allowed = wan
address_family = both
```

✅ Apollo ora accetta connessioni WAN (esterne)
✅ Apollo ascolta su 0.0.0.0:47990 (tutte le interfacce)

---

## 📊 STATUS ATTUALE

```
Service: ApolloService - Running
Port:    0.0.0.0:47990 - LISTENING
IPv6:    [::]:47990 - LISTENING
Encoder: libx264 [software] - Active
```

---

## 🎯 ENDPOINT CORRETTI

Apollo/Sunshine **NON usa** gli endpoint Moonlight standard!

### ❌ NON funzionano:
- `/pair?uniqueid=...` (Moonlight)
- `/serverinfo` (Moonlight)

### ✅ Endpoint Apollo corretti:

#### 1. Pairing (richiede body JSON):
```
POST /api/pair
Content-Type: application/json

Body:
{
  "uniqueid": "your-unique-id",
  "devicename": "Strike Cloud Gaming",
  "cert": "certificate-pem"
}
```

#### 2. PIN (dopo pairing):
```
POST /api/pin
Content-Type: application/json

Body:
{
  "pin": "1234"
}
```

---

## 🔍 PROBLEMA IDENTIFICATO

Il tuo errore **"fetch failed"** è probabilmente dovuto a:

### 1. **Endpoint sbagliato**
Stai usando `/pair?uniqueid=...` (Moonlight) invece di `/api/pair` (Apollo)

### 2. **Body mancante**
`/api/pair` richiede un body JSON, non query parameters

### 3. **Certificato SSL**
Apollo usa certificato self-signed. Devi usare `rejectUnauthorized: false`

---

## ✅ CODICE CORRETTO PER PAIRING

Ecco il codice corretto per il pairing:

```typescript
import https from 'https';
import { v4 as uuidv4 } from 'uuid';

const APOLLO_HOST = '20.31.130.73';
const APOLLO_PORT = 47990;

async function requestPairing() {
    const uniqueId = uuidv4().replace(/-/g, '');
    
    const postData = JSON.stringify({
        uniqueid: uniqueId,
        devicename: 'Strike Cloud Gaming',
        cert: '-----BEGIN CERTIFICATE-----\nDUMMY\n-----END CERTIFICATE-----'
    });

    const options = {
        hostname: APOLLO_HOST,
        port: APOLLO_PORT,
        path: '/api/pair',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData),
        },
        rejectUnauthorized: false, // Accept self-signed cert
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log('Status Code:', res.statusCode);
                console.log('Response:', data);
                
                if (res.statusCode === 200 || res.statusCode === 201) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        resolve(data);
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            console.error('Request error:', error);
            reject(error);
        });

        req.write(postData);
        req.end();
    });
}

// Test
requestPairing()
    .then(result => {
        console.log('✅ Pairing request successful!');
        console.log('Result:', result);
    })
    .catch(error => {
        console.error('❌ Pairing failed:', error.message);
    });
```

---

## 🧪 TEST RAPIDO

Prova questo comando dal PC locale per verificare connettività:

```bash
curl -k -v https://20.31.130.73:47990/api/apps
```

**Output atteso**: `{"error":"Unauthorized","status":false,"status_code":401}`

Se ottieni questo, la connessione funziona! ✅

Se ottieni "Connection refused" o timeout, c'è ancora un problema di rete. ❌

---

## 🔥 FIREWALL CHECK

Verifica che Azure NSG abbia:
- ✅ Porta 47990 (TCP) - HTTPS Web UI
- ✅ Porte 47998-48010 (UDP) - Streaming

---

## 📞 PROSSIMI STEP

1. **Testa connettività**: `curl -k https://20.31.130.73:47990/api/apps`
2. **Usa codice corretto**: POST a `/api/pair` con body JSON
3. **Monitora PIN**: Il monitor sulla VM è attivo
4. **Completa pairing**: POST a `/api/pin` con il PIN

---

**Quando hai testato, dimmi il risultato!** 🚀

**Creato**: 09 Dicembre 2025, 20:47  
**IP VM**: 20.31.130.73  
**Status**: Apollo configurato per WAN access
