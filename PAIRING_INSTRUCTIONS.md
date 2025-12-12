# 🔐 APOLLO PAIRING - ISTRUZIONI COMPLETE

**Data**: 09 Dicembre 2025, 20:18  
**Obiettivo**: Creare pairing tra Strike (client locale) e Apollo (VM)

---

## 📋 PREREQUISITI

✅ Apollo installato e running sulla VM
✅ Account Web UI creato (strike / Nosmoking93!!)
✅ Firewall Windows configurato
🔴 Azure NSG da configurare (porte 47990, 47998-48010)

---

## 🎯 PROCESSO DI PAIRING

### STEP 1: Avvia Monitor PIN sulla VM

**Sulla VM, apri PowerShell e esegui:**

```powershell
cd "C:\Program Files\Apollo"
.\monitor-pin.ps1
```

Questo script mostrerà il PIN quando il client si connette.

**LASCIA QUESTA FINESTRA APERTA!**

---

### STEP 2: Configura Azure NSG (SE NON L'HAI GIÀ FATTO)

**Sul tuo PC locale, vai su Azure Portal:**

1. Apri: https://portal.azure.com
2. Trova la VM
3. Vai su: **Networking** → **Network Security Group**
4. Aggiungi regola inbound:
   ```
   Nome:              AllowApollo
   Priorità:          320
   Porta destinazione: 47990,47998-48010
   Protocollo:        Any
   Azione:            Allow
   ```

---

### STEP 3: Implementa Client Pairing (Antigravity Locale)

**Sul tuo PC locale, nel progetto Strike:**

Crea un file: `services/orchestrator-service/src/apollo/pairing.ts`

```typescript
import https from 'https';
import crypto from 'crypto';

export class ApolloPairingClient {
    private host: string;
    private port: number;
    private clientCert: string | null = null;
    private clientKey: string | null = null;

    constructor(host: string, port: number = 47990) {
        this.host = host;
        this.port = port;
    }

    /**
     * Step 1: Request pairing with Apollo
     * This will generate a PIN on the Apollo server
     */
    async requestPairing(): Promise<{ pairingId: string }> {
        // Generate client certificate
        const { cert, key } = this.generateClientCert();
        this.clientCert = cert;
        this.clientKey = key;

        const options = {
            hostname: this.host,
            port: this.port,
            path: '/api/pair',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            rejectUnauthorized: false, // Accept self-signed cert
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response);
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(JSON.stringify({
                clientCert: this.clientCert,
            }));
            req.end();
        });
    }

    /**
     * Step 2: Complete pairing with PIN
     * @param pin - The 4-digit PIN shown in Apollo logs/UI
     */
    async completePairing(pairingId: string, pin: string): Promise<boolean> {
        const options = {
            hostname: this.host,
            port: this.port,
            path: `/api/pair/${pairingId}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            rejectUnauthorized: false,
        };

        return new Promise((resolve, reject) => {
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        const response = JSON.parse(data);
                        resolve(response.success === true);
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.write(JSON.stringify({ pin }));
            req.end();
        });
    }

    /**
     * Generate client certificate for pairing
     */
    private generateClientCert(): { cert: string; key: string } {
        // In production, use proper certificate generation
        // For now, this is a placeholder
        const key = crypto.generateKeyPairSync('rsa', {
            modulusLength: 2048,
        });

        return {
            cert: key.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
            key: key.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
        };
    }

    /**
     * Save pairing credentials for future use
     */
    savePairingCredentials(filePath: string): void {
        const fs = require('fs');
        fs.writeFileSync(filePath, JSON.stringify({
            host: this.host,
            port: this.port,
            clientCert: this.clientCert,
            clientKey: this.clientKey,
        }));
    }
}
```

---

### STEP 4: Test Pairing (Antigravity Locale)

**Crea un test script: `test-apollo-pairing.ts`**

```typescript
import { ApolloPairingClient } from './apollo/pairing';

async function testPairing() {
    const apolloHost = '<IP_PUBBLICO_VM>'; // Sostituisci con IP pubblico VM
    const client = new ApolloPairingClient(apolloHost, 47990);

    console.log('🔐 Requesting pairing with Apollo...');
    
    try {
        // Step 1: Request pairing
        const { pairingId } = await client.requestPairing();
        console.log(`✅ Pairing requested! ID: ${pairingId}`);
        console.log('');
        console.log('🔍 CHECK THE VM MONITOR WINDOW FOR THE PIN!');
        console.log('');
        
        // Step 2: Wait for user to enter PIN
        const readline = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        readline.question('Enter the 4-digit PIN from Apollo: ', async (pin: string) => {
            console.log(`\n🔐 Completing pairing with PIN: ${pin}...`);
            
            const success = await client.completePairing(pairingId, pin);
            
            if (success) {
                console.log('✅ PAIRING SUCCESSFUL!');
                console.log('💾 Saving credentials...');
                client.savePairingCredentials('./apollo-credentials.json');
                console.log('✅ Credentials saved to apollo-credentials.json');
            } else {
                console.log('❌ Pairing failed. Check the PIN and try again.');
            }
            
            readline.close();
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

testPairing();
```

---

### STEP 5: Esegui il Pairing

**Sulla VM:**
```powershell
# Finestra 1: Monitor PIN
cd "C:\Program Files\Apollo"
.\monitor-pin.ps1
```

**Sul PC locale:**
```bash
# Finestra 2: Test pairing
cd services/orchestrator-service
npm run test-pairing
```

**Quando vedi il PIN sulla VM, inseriscilo nel prompt sul PC locale!**

---

## 🔍 DOVE TROVARE IL PIN

### Opzione 1: Log Monitor (CONSIGLIATO)
Il PIN appare nello script `monitor-pin.ps1` quando il client si connette.

### Opzione 2: Log File Manuale
```powershell
Get-Content "C:\Program Files\Apollo\config\sunshine.log" -Tail 50 | Select-String "pin"
```

### Opzione 3: Web UI
1. Apri: https://localhost:47990
2. Login: strike / Nosmoking93!!
3. Vai su: **Settings** → **Clients**
4. Il PIN appare quando un nuovo client richiede pairing

---

## ✅ DOPO IL PAIRING

Quando il pairing è completato:
- ✅ Il client ha un certificato salvato
- ✅ Può connettersi ad Apollo senza re-autenticazione
- ✅ Può avviare streaming WebRTC

---

## 🆘 TROUBLESHOOTING

### PIN non appare
- Verifica che Apollo sia running: `Get-Service ApolloService`
- Verifica che il client si connetta all'IP corretto
- Verifica che NSG sia configurato correttamente

### Pairing fallisce
- Verifica che il PIN sia corretto (4 cifre)
- Verifica che il pairing non sia scaduto (timeout ~2 minuti)
- Riprova il pairing da capo

---

**Creato da**: Antigravity VM  
**Per**: Strike Cloud Gaming  
**Data**: 09 Dicembre 2025, 20:18
